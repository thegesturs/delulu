/** Bounded source reads keep large uploads out of the Worker's shared heap. */
export const inspectMedia = async (url: string) => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: { Range: "bytes=0-0", "Accept-Encoding": "identity" },
  });
  if (!response.ok) {
    throw new Error(`Media fetch returned ${response.status}`);
  }
  const range = response.headers.get("content-range");
  const size = Number(
    range?.split("/")[1] ?? response.headers.get("content-length")
  );
  const mimeType =
    response.headers.get("content-type") ?? "application/octet-stream";
  await response.body?.cancel();
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error("Media size is unavailable");
  }
  return { url, size, mimeType };
};

export const readMediaRange = async (
  url: string,
  first: number,
  last: number,
  maximum = 8 * 1024 * 1024
) => {
  const length = last - first + 1;
  if (!Number.isSafeInteger(length) || length <= 0 || length > maximum) {
    throw new Error("Invalid media chunk size");
  }
  const response = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: { Range: `bytes=${first}-${last}`, "Accept-Encoding": "identity" },
  });
  const range = response.headers.get("content-range");
  if (
    response.status !== 206 ||
    !range?.startsWith(`bytes ${first}-${last}/`)
  ) {
    // Some small media origins ignore Range. Never accept an unbounded response.
    if (
      !(
        response.status === 200 &&
        first === 0 &&
        Number(response.headers.get("content-length")) === length
      )
    ) {
      await response.body?.cancel();
      throw new Error("Media origin did not honor the requested range");
    }
  }
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Media response has no body");
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      if (offset + value.length > length) {
        throw new Error("Media response exceeds requested range");
      }
      bytes.set(value, offset);
      offset += value.length;
    }
    if (offset !== length) {
      throw new Error("Media chunk was truncated");
    }
    return bytes;
  } finally {
    await reader.cancel();
  }
};
