declare module "express-serve-static-core" {
  interface Request {
    /** Raw body buffer from `express.json({ verify })` — used for HMAC verification. */
    rawBody?: Buffer;
    requestId?: string;
  }
}
