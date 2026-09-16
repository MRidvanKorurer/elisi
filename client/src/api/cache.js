const memory = new Map();
const inflight = new Map();

export const cachedGet = (key, fetcher, ttlMs = 60_000) => {
  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return Promise.resolve(hit.value);
  }

  if (inflight.has(key)) return inflight.get(key);

  const request = Promise.resolve()
    .then(fetcher)
    .then((value) => {
      memory.set(key, { value, at: Date.now() });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
};

export const invalidateCache = (prefix = '') => {
  const needle = String(prefix || '');
  for (const key of memory.keys()) {
    if (!needle || key === needle || key.startsWith(needle)) memory.delete(key);
  }
};
