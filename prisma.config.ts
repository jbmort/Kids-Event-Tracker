import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts", // Optional: pointer to database seeding script
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});