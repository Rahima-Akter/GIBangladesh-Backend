import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import config from "../config";

const connectionString = config.databaseUrl;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log:
    config.nodeEnv === "development" ? ["query", "warn", "error"] : ["error"],
});

export { prisma };