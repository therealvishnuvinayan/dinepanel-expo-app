const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,200}$/;

export class InvalidClaimUrlError extends Error {
  constructor() {
    super('This is not a recognised DinePanel claim code.');
    this.name = 'InvalidClaimUrlError';
  }
}

function validateToken(value: string): string {
  const token = value.trim();
  if (!TOKEN_PATTERN.test(token)) throw new InvalidClaimUrlError();
  return token;
}

/**
 * Accepts only an opaque token or a canonical /claim/<token> URL. No bill or
 * reward values are read from the QR. HTTP is accepted for local/LAN testing.
 */
export function parseClaimToken(value: string, allowBareToken = true): string {
  const candidate = value.trim();
  if (allowBareToken && TOKEN_PATTERN.test(candidate)) return candidate;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new InvalidClaimUrlError();
  }

  if (url.search || url.hash) throw new InvalidClaimUrlError();
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (url.protocol === 'dinepanel:') {
    if (url.hostname !== 'claim' || pathParts.length !== 1) throw new InvalidClaimUrlError();
    return validateToken(pathParts[0]);
  }

  if (url.protocol === 'http:' || url.protocol === 'https:') {
    if (pathParts.length !== 2 || pathParts[0] !== 'claim') throw new InvalidClaimUrlError();
    return validateToken(pathParts[1]);
  }

  throw new InvalidClaimUrlError();
}

export function claimTokenFromInternalPath(pathname: string): string | null {
  const match = pathname.match(/^\/claim\/([^/?#]+)\/?$/);
  if (!match) return null;
  try {
    return parseClaimToken(decodeURIComponent(match[1]), true);
  } catch {
    return null;
  }
}
