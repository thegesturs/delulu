/**
 * Node's Postgres driver treats `sslrootcert` as a filesystem path. Database
 * providers use `sslrootcert=system` to mean the runtime trust store, so leave
 * that responsibility to Node instead of making it open a file named system.
 */
export const normalizePostgresUrl = (value: string): string => {
  const url = new URL(value);
  if (url.searchParams.get("sslrootcert") === "system") {
    url.searchParams.delete("sslrootcert");
  }
  return url.toString();
};
