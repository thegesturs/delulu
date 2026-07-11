import { describe, expect, it } from "vitest";
import { buildInspectReport } from "../../src/inspect";
import { parseSnapshotBuffer } from "../../src/snapshot/reader";
import { buildSnapshotZip } from "../fixtures/builder";
import { legacyTables } from "../fixtures/legacy-data";

const reportFor = async (tables = legacyTables) =>
  buildInspectReport(
    await parseSnapshotBuffer(Buffer.from(buildSnapshotZip(tables)))
  );

const count = (
  table: string,
  report: Awaited<ReturnType<typeof reportFor>>
): number => report.tables.find((row) => row.table === table)?.count ?? -1;

describe("inspect", () => {
  it("counts documents per table and classifies dispositions", async () => {
    const report = await reportFor();
    expect(count("users", report)).toBe(5);
    expect(count("posts", report)).toBe(9);
    expect(count("socialProviders", report)).toBe(3);
    expect(count("organizationMembers", report)).toBe(3);
    expect(count("subscriptions", report)).toBe(3);
    expect(count("apiKeys", report)).toBe(1);
    expect(
      report.tables.find((row) => row.table === "apiKeys")?.disposition
    ).toBe("drop");
  });

  it("decodes every golden document without error", async () => {
    const report = await reportFor();
    expect(report.decodeErrors).toEqual([]);
    const users = report.tables.find((row) => row.table === "users");
    expect(users?.decoded).toBe(5);
    expect(users?.decodeErrors).toBe(0);
  });

  it("skips Convex system tables and flags unknown tables", async () => {
    const report = await reportFor({
      ...legacyTables,
      weirdTable: [{ _id: "x", _creationTime: 1 }],
    });
    expect(report.unknownTables).toEqual([{ table: "weirdTable", count: 1 }]);
  });

  it("names the table and _id of a malformed document", async () => {
    const report = await reportFor({
      ...legacyTables,
      users: [
        ...legacyTables.users,
        { _id: "user_broken", _creationTime: 1, email: 123, name: "x" },
      ],
    });
    const broken = report.decodeErrors.find(
      (issue) => issue.id === "user_broken"
    );
    expect(broken).toBeDefined();
    expect(broken?.table).toBe("users");
  });
});
