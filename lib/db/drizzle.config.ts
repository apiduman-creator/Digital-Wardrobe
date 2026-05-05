import { defineConfig } from "drizzle-kit";
import path from "path";

const dbPath = path.resolve(__dirname, "../../local.db");

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
