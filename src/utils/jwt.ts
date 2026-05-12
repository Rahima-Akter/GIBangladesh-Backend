import jwt from "jsonwebtoken";
import config from "../config";

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

// Create a JWT token
export const createToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
};

// Verify a JWT token
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};