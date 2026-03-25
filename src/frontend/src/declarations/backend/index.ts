// Re-export backend actor singleton for use in components
import { createActorWithConfig } from "../../config";

let _backend: Awaited<ReturnType<typeof createActorWithConfig>> | null = null;
let _promise: Promise<Awaited<ReturnType<typeof createActorWithConfig>>> | null = null;

async function getBackend() {
  if (_backend) return _backend;
  if (_promise) return _promise;
  _promise = createActorWithConfig().then((actor) => {
    _backend = actor;
    return actor;
  });
  return _promise;
}

// Proxy that lazily calls methods on the backend actor
export const backend = new Proxy({} as any, {
  get(_target, prop: string) {
    return (...args: unknown[]) => getBackend().then((actor: any) => actor[prop](...args));
  },
});
