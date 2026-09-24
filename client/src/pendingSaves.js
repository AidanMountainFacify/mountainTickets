const pending = new Set();

export function trackSave(promise) {
  pending.add(promise);
  const clear = () => pending.delete(promise);
  promise.then(clear, clear);
  return promise;
}

export function waitForPendingSaves() {
  return Promise.allSettled(Array.from(pending));
}
