import dotenv from "dotenv";
import path from "path";

// Load .env file
dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  databaseUrl: process.env.DATABASE_URL || "",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "super-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // Better Auth
  betterAuthSecret: process.env.BETTER_AUTH_SECRET || "",
  betterAuthBaseUrl:
    process.env.BETTER_AUTH_BASE_URL || "http://localhost:5000",

  // Frontend URL (for CORS and cookies)
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",
};

export default config;
