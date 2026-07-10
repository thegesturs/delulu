import { DateTime, Schema } from "effect";

export const Timestamp = Schema.DateTimeUtcFromDate;
export type Timestamp = typeof Timestamp.Type;

export const fromEpochMillis = (milliseconds: number): DateTime.Utc =>
  DateTime.fromDateUnsafe(new Date(milliseconds));

export const toEpochMillis = (value: DateTime.DateTime): number =>
  DateTime.toEpochMillis(value);

export const toTimestamp = (milliseconds: number): Date =>
  DateTime.toDateUtc(fromEpochMillis(milliseconds));

export const timestampToWire = (value: Date | DateTime.DateTime): string =>
  (value instanceof Date ? value : DateTime.toDateUtc(value)).toISOString();
