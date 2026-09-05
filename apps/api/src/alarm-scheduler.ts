/** The storage subset used by the scheduler, shared with deterministic tests. */
export interface AlarmStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  getAlarm(): Promise<number | null>;
  setAlarm(time: number): Promise<void>;
}

export interface AlarmState {
  readonly storage: AlarmStorage;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}

export const SCHEDULER_LANES = ["dispatch", "maintenance", "recovery"] as const;
export type SchedulerLane = (typeof SCHEDULER_LANES)[number];
const RECOVERY_INTERVAL_MS = 60_000;

/** Alarms are armed before external I/O so outages cannot exhaust recovery. */
export class AlarmScheduler {
  private readonly state: AlarmState;
  private readonly run: (lane: SchedulerLane) => Promise<number | null>;
  private readonly now: () => number;

  constructor(
    state: AlarmState,
    run: (lane: SchedulerLane) => Promise<number | null>,
    now: () => number = Date.now
  ) {
    this.state = state;
    this.run = run;
    this.now = now;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const lane = SCHEDULER_LANES.find((value) => url.pathname === `/${value}`);
    if (request.method !== "POST" || !lane) {
      return new Response("Not found", { status: 404 });
    }
    await this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<SchedulerLane>("lane");
      if (stored && stored !== lane) {
        throw new Error("Scheduler lane cannot change");
      }
      if (!stored) {
        await this.state.storage.put("lane", lane);
      }
      const alarm = await this.state.storage.getAlarm();
      // Bootstrap is idempotent. Only dispatch notifications accelerate work.
      if (
        alarm === null ||
        (lane === "dispatch" && url.searchParams.has("wake"))
      ) {
        await this.state.storage.setAlarm(this.now());
      }
    });
    return new Response(null, { status: 204 });
  }

  async alarm(): Promise<void> {
    const lane = await this.state.blockConcurrencyWhile(async () => {
      const lane = await this.state.storage.get<SchedulerLane>("lane");
      if (!lane) {
        throw new Error("Scheduler lane was not initialized");
      }
      await this.state.storage.setAlarm(this.now() + RECOVERY_INTERVAL_MS);
      return lane;
    });
    // Let failures surface in invocation logs. A fresh alarm already exists,
    // so continued recovery does not depend on the platform's retry limit.
    const next = await this.run(lane);
    if (next === null) {
      return;
    }
    await this.state.blockConcurrencyWhile(async () => {
      const current = await this.state.storage.getAlarm();
      const deadline = Math.max(this.now() + 100, next);
      // A mutation may have requested an earlier alarm during external I/O.
      if (current === null || deadline < current) {
        await this.state.storage.setAlarm(deadline);
      }
    });
  }
}

export interface SchedulerNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(request: Request): Promise<Response> };
}

export const notifyScheduler = async (
  namespace: SchedulerNamespace,
  lane: SchedulerLane,
  wake = false
): Promise<void> => {
  const response = await namespace.get(namespace.idFromName(lane)).fetch(
    new Request(`https://scheduler/${lane}${wake ? "?wake" : ""}`, {
      method: "POST",
    })
  );
  if (!response.ok) {
    throw new Error(`Scheduler ${lane} returned ${response.status}`);
  }
};

export const ensureSchedulers = (
  namespace: SchedulerNamespace
): Promise<void> =>
  Promise.all(
    SCHEDULER_LANES.map((lane) => notifyScheduler(namespace, lane))
  ).then(() => undefined);
