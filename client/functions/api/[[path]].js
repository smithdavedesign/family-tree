// Cloudflare Pages Function: proxies /api/* to the API host, so the browser still sees one origin
// (what Vercel's /api rewrite did; the Google-connection cookies depend on it).
const API_ORIGIN = 'https://api.familytree-e.com';

export async function onRequest({ request }) {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, API_ORIGIN);
    // Forward method, headers and body untouched; Request(target, request) keeps all three.
    return fetch(new Request(target, request));
}
