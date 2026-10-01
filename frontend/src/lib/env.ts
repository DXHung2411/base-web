/** Runtime configuration. process.env wins in production; import.meta.env covers `astro dev` with a .env file. */
function read(name: string, fallback: string): string {
  return process.env[name] ?? (import.meta.env[name] as string | undefined) ?? fallback;
}

/** API origin used by the server when rendering pages. */
export const apiUrl = () => read('API_URL', read('PUBLIC_API_URL', 'http://localhost:5040')).replace(/\/$/, '');

/** API origin reachable from the visitor's browser (uploads, admin UI). */
export const publicApiUrl = () => read('PUBLIC_API_URL', 'http://localhost:5040').replace(/\/$/, '');
