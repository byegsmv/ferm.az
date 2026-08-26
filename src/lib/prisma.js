import { PrismaClient } from "@prisma/client";

const createPrismaFallback = () => {
  const createModelProxy = () =>
    new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "findMany" || prop === "count") {
            return async () => [];
          }
          if (prop === "findFirst" || prop === "findUnique") {
            return async () => null;
          }
          if (prop === "create" || prop === "update" || prop === "delete" || prop === "upsert" || prop === "createMany" || prop === "updateMany" || prop === "deleteMany") {
            return async () => null;
          }
          return async () => null;
        },
      }
    );

  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "$disconnect" || prop === "$connect" || prop === "$on" || prop === "$transaction" || prop === "$use" || prop === "$extends") {
          return async () => null;
        }
        return createModelProxy();
      },
    }
  );
};

const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL || "";
  return /^(postgres|postgresql):\/\//i.test(url) || /^prisma:\/\//i.test(url);
};

// Singleton pattern — prevents multiple PrismaClient instances
// during Next.js hot-reload in development
const globalForPrisma = globalThis;

let prismaClient;

if (!globalForPrisma.prisma) {
  try {
    if (isDatabaseConfigured()) {
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      });
    } else {
      console.warn("DATABASE_URL is missing or invalid; using Prisma fallback client.");
      globalForPrisma.prisma = createPrismaFallback();
    }
  } catch (error) {
    console.warn("Prisma client initialization failed, using fallback client:", error.message);
    globalForPrisma.prisma = createPrismaFallback();
  }
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = globalForPrisma.prisma;
}

export const prisma = globalForPrisma.prisma;
