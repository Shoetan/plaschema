import { AppError } from '../http/app-error';
import { hasBearerToken, resolveJwtAuthError } from './jwt-auth-errors';

describe('jwt-auth-errors', () => {
  describe('hasBearerToken', () => {
    it('returns false when the Authorization header is missing', () => {
      expect(hasBearerToken(undefined)).toBe(false);
    });

    it('returns false for an empty bearer token', () => {
      expect(hasBearerToken('Bearer ')).toBe(false);
      expect(hasBearerToken('Bearer    ')).toBe(false);
    });

    it('returns true when a bearer token is present', () => {
      expect(hasBearerToken('Bearer eyJhbGciOiJIUzI1NiJ9')).toBe(true);
    });
  });

  describe('resolveJwtAuthError', () => {
    it('requires authentication when no bearer token is sent', () => {
      const error = resolveJwtAuthError({
        err: null,
        info: 'No auth token',
        hasBearerToken: false,
      });

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        statusCode: 401,
      });
    });

    it('reports an expired token when passport returns TokenExpiredError info', () => {
      const error = resolveJwtAuthError({
        err: null,
        info: { name: 'TokenExpiredError', message: 'jwt expired' },
        hasBearerToken: true,
      });

      expect(error).toMatchObject({
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired',
        statusCode: 401,
      });
    });

    it('reports an expired token when jsonwebtoken throws TokenExpiredError', () => {
      const error = resolveJwtAuthError({
        err: Object.assign(new Error('jwt expired'), {
          name: 'TokenExpiredError',
        }),
        info: undefined,
        hasBearerToken: true,
      });

      expect(error).toMatchObject({
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired',
      });
    });

    it('reports an invalid token when a bearer token fails verification', () => {
      const error = resolveJwtAuthError({
        err: Object.assign(new Error('invalid signature'), {
          name: 'JsonWebTokenError',
        }),
        info: undefined,
        hasBearerToken: true,
      });

      expect(error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid access token',
      });
    });

    it('preserves intentional AppError failures from validate()', () => {
      const appError = new AppError(
        'UNAUTHORIZED',
        'User account is inactive',
        401,
      );

      const error = resolveJwtAuthError({
        err: appError,
        info: undefined,
        hasBearerToken: true,
      });

      expect(error).toBe(appError);
    });

    it('returns null for non-JWT infrastructure errors', () => {
      const error = resolveJwtAuthError({
        err: new Error('database unavailable'),
        info: undefined,
        hasBearerToken: true,
      });

      expect(error).toBeNull();
    });
  });
});
