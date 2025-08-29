export const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_if_env_fails';
export const JWT_EXPIRATION_TIME = '1h'; // e.g., '1h', '7d', '30m'

// NOTE: In production, ensure process.env.JWT_SECRET is set and never rely on the fallback.
