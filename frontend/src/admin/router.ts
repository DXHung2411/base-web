import { useEffect, useState } from 'preact/hooks';

const currentPath = () => window.location.hash.replace(/^#/, '') || '/';

export function navigate(path: string) {
  window.location.hash = path;
}

/** Hash-based routing keeps the admin a single static page: no server rewrites are needed. */
export function useHashPath(): string {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

/** Matches "/pages/:id/:tab?" style patterns. Returns the params or null. */
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('?')[0].split('/').filter(Boolean);
  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    const optional = part.endsWith('?');
    const name = part.replace(/^:/, '').replace(/\?$/, '');
    if (pathParts[i] === undefined) {
      if (optional) continue;
      return null;
    }
    if (part.startsWith(':')) params[name] = decodeURIComponent(pathParts[i]);
    else if (part !== pathParts[i]) return null;
  }
  return pathParts.length > patternParts.length ? null : params;
}
