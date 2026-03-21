import { AwsClient } from 'aws4fetch';
import { authorizeRequest } from './auth';
import { VAULT_SETTINGS } from './config';

let signer: AwsClient | null = null;

export async function processVaultMiss(request: Request, config: any): Promise<Response> {
	const url = new URL(request.url);
	const token = url.searchParams.get('token');

	if (!token) throw { status: 401, msg: 'Missing Vault Token' };

	await authorizeRequest(token, config.JWKS_URL, url.pathname);

	if (!signer) {
		signer = new AwsClient({
			accessKeyId: config.B2_KEY_ID,
			secretAccessKey: config.B2_APP_KEY,
			service: 's3',
			region: VAULT_SETTINGS.REGION,
		});
	}

	const cleanPath = url.pathname.replace(/^\//, '');
	const target = `${config.B2_S3_BASE}/${config.B2_BUCKET_NAME}/${cleanPath}`;

	const signed = await signer.sign(target, { method: 'GET' });
	const b2Res = await fetch(signed);

	if (!b2Res.ok) {
		const errorBody = await b2Res.text();
		console.error(`[Vault Storage Error] Status: ${b2Res.status}\nBody: ${errorBody}`);
		throw { status: b2Res.status, msg: `B2_STORAGE_ERROR_${b2Res.status}` };
	}

	const response = new Response(b2Res.body, b2Res);
	response.headers.set('Cache-Control', `public, max-age=${VAULT_SETTINGS.CACHE_TTL}, immutable`);

	return response;
}
