import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: `file:${dbPath}`,
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
