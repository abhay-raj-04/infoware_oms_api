const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET environment variable must be set');
}
export const JWT_SECRET = secret || 'default_secret';
export const JWT_EXPIRATION_TIME = '1h';