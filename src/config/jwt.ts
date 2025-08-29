const JWT_SECRET = process.env.JWT_SECRET || "random_jwt_secret";
if (JWT_SECRET === "random_jwt_secret") {
  throw new Error('JWT_SECRET is not set');
}
export { JWT_SECRET };
export const JWT_EXPIRATION_TIME = '1h';