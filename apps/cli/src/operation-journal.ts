import { createHash, randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import lockfile from "proper-lockfile";

interface OperationRecord {
  readonly command: string;
  readonly fingerprint: string;
  readonly idempotencyKey: string;
  readonly operationId: string;
  readonly resourceId?: string;
  readonly createdAt: number;
}

type PreparedOperation = OperationRecord & { readonly replayed: boolean };

const MAX_RECORDS = 100;
const REPLAY_WINDOW_MS = 24 * 60 * 60 * 1000;

export const journalPath = () =>
  join(homedir(), ".config", "delulu", "operations.json");

const readJournal = async (): Promise<readonly OperationRecord[]> => {
  try {
    return JSON.parse(
      await readFile(journalPath(), "utf8")
    ) as OperationRecord[];
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw cause;
  }
};

const writeJournal = async (records: readonly OperationRecord[]) => {
  const path = journalPath();
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(
    temporaryPath,
    `${JSON.stringify(records.slice(0, MAX_RECORDS), null, 2)}\n`,
    {
      mode: 0o600,
    }
  );
  await rename(temporaryPath, path);
  await chmod(path, 0o600);
};

const acquireLock = async () => {
  const path = journalPath();
  await mkdir(dirname(path), { recursive: true });
  return lockfile.lock(path, {
    realpath: false,
    stale: 30_000,
    update: 10_000,
    retries: { retries: 80, factor: 1, minTimeout: 25, maxTimeout: 25 },
  });
};

let localUpdate = Promise.resolve();

const updateJournal = async <T>(
  update: (records: readonly OperationRecord[]) => Promise<{
    readonly records: readonly OperationRecord[];
    readonly value: T;
  }>
) => {
  const previous = localUpdate;
  let releaseLocal: () => void = () => undefined;
  localUpdate = new Promise<void>((resolve) => {
    releaseLocal = resolve;
  });
  await previous;
  let releaseLock: undefined | (() => Promise<void>);
  try {
    releaseLock = await acquireLock();
    const result = await update(await readJournal());
    await writeJournal(result.records);
    return result.value;
  } finally {
    await releaseLock?.();
    releaseLocal();
  }
};

export const operationFingerprint = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

export const prepareOperation = async (input: {
  readonly command: string;
  readonly fingerprintValue: unknown;
  readonly forceNew?: boolean;
  readonly idempotencyKey?: string;
  readonly now?: number;
}) => {
  const now = input.now ?? Date.now();
  const fingerprint = operationFingerprint(input.fingerprintValue);
  return updateJournal<PreparedOperation>(async (journal) => {
    const records = journal.filter(
      (record) => now - record.createdAt <= REPLAY_WINDOW_MS
    );
    const existing = input.forceNew
      ? undefined
      : records.find(
          (record) =>
            record.command === input.command &&
            record.fingerprint === fingerprint
        );
    if (existing) {
      return {
        records,
        value: { ...existing, replayed: true as const },
      };
    }
    const operationId = `op_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const record: OperationRecord = {
      command: input.command,
      fingerprint,
      idempotencyKey: input.idempotencyKey ?? operationId,
      operationId,
      createdAt: now,
    };
    return {
      records: [record, ...records],
      value: { ...record, replayed: false as const },
    };
  });
};

export const completeOperation = async (
  operationId: string,
  resourceId: string
) => {
  await updateJournal(async (records) => ({
    records: records.map((record) =>
      record.operationId === operationId ? { ...record, resourceId } : record
    ),
    value: undefined,
  }));
};
