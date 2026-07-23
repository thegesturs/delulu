import { normalizePostgresUrl } from "@delulu/core";

const LOCAL_DATABASE_URL = "postgres://delulu:delulu@localhost:5432/delulu";

export const getTranscriptionDatabaseUrl = (
  value = process.env.DATABASE_URL ?? LOCAL_DATABASE_URL
): string => normalizePostgresUrl(value);
