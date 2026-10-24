const cache = new Map();

/** Loads an external script once and resolves true/false. */
export function loadScript(src) {
  if (cache.has(src)) return cache.get(src);
  const promise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      cache.delete(src);
      script.remove();
      resolve(false);
    };
    document.body.appendChild(script);
  });
  cache.set(src, promise);
  return promise;
}
