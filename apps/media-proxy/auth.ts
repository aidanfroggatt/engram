import * as jose from 'jose';

let jwksCache: any = null;

export async function authorizeRequest(token: string, jwksUrl: string, pathname: string) {
	if (!jwksCache) jwksCache = jose.createRemoteJWKSet(new URL(jwksUrl));

	try {
		const { payload } = await jose.jwtVerify(token, jwksCache);
		const userId = payload.sub;
		const folderOwner = pathname.split('/').filter(Boolean)[0];

		if (userId !== folderOwner) throw new Error('FORBIDDEN');
		return userId;
	} catch (err: any) {
		if (err.message === 'FORBIDDEN') throw { status: 403, msg: 'Vault Partition Mismatch' };
		throw { status: 401, msg: 'Invalid Session' };
	}
}
