import { VAULT_SETTINGS } from './config';

export function handlePreflight(): Response {
	return new Response(null, { headers: VAULT_SETTINGS.CORS_HEADERS });
}

export function finalizeResponse(response: Response): Response {
	const final = new Response(response.body, response);

	Object.entries(VAULT_SETTINGS.CORS_HEADERS).forEach(([k, v]) => final.headers.set(k, v));

	const cacheStatus = response.headers.get('CF-Cache-Status') || 'MISS';
	final.headers.set('X-Vault-Status', cacheStatus);
	final.headers.set('X-Engram-Origin', 'Edge-Proxy');

	return final;
}
