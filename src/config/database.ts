// Prisma database client singleton using @prisma/adapter-pg.
import config from "./env";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = new URL(config.databaseUrl);
const schema = url.searchParams.get("schema") || "public";

const adapter = new PrismaPg(
  {
    connectionString: config.databaseUrl,
  },
  { schema }
);

const prisma = new PrismaClient({ adapter });

export default prisma;

