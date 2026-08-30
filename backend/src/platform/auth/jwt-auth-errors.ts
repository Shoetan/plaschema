import { AppError } from '../http/app-error';

type AuthFailureInput = {
  err: Error | null;
  info: unknown;
  hasBearerToken: boolean;
};

function readInfo(info: unknown): { name?: string; message?: string } {
  if (typeof info === 'string') {
    return { message: info };
  }

  if (typeof info === 'object' && info !== null) {
    const record = info as { name?: unknown; message?: unknown };
    return {
      name: typeof record.name === 'string' ? record.name : undefined,
      message: typeof record.message === 'string' ? record.message : undefined,
    };
  }

  return {};
}

function isJwtRelatedError(err: Error): boolean {
  return (
    err.name === 'TokenExpiredError' ||
    err.name === 'JsonWebTokenError' ||
    err.name === 'NotBeforeError'
  );
}

function isTokenExpired(err: Error | null, info: unknown): boolean {
  const infoValues = readInfo(info);

  return (
    err?.name === 'TokenExpiredError' ||
    infoValues.name === 'TokenExpiredError' ||
    err?.message === 'jwt expired' ||
    infoValues.message === 'jwt expired'
  );
}

/**
 * Maps Passport JWT failures to API errors.
 * Returns null when a non-auth infrastructure error should bubble up unchanged.
 */
export function resolveJwtAuthError(
  input: AuthFailureInput,
): AppError | null {
  if (input.err instanceof AppError) {
    return input.err;
  }

  if (input.err && !isJwtRelatedError(input.err)) {
    return null;
  }

  if (!input.hasBearerToken) {
    return new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  if (isTokenExpired(input.err, input.info)) {
    return new AppError('TOKEN_EXPIRED', 'Access token has expired', 401);
  }

  return new AppError('UNAUTHORIZED', 'Invalid access token', 401);
}

export function hasBearerToken(authorizationHeader: unknown): boolean {
  return (
    typeof authorizationHeader === 'string' &&
    authorizationHeader.startsWith('Bearer ') &&
    authorizationHeader.slice('Bearer '.length).trim().length > 0
  );
}
