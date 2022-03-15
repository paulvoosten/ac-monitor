export function localStorageProvider(key: string) {
  key = `swr-${key}`;
  return () => {
    const map = new Map(JSON.parse(localStorage.getItem(key) || '[]'));
    window.addEventListener('beforeunload', () => {
      const appCache = JSON.stringify(Array.from(map.entries()));
      localStorage.setItem(key, appCache);
    });
    return map;
  };
}
