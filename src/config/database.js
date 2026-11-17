// Prisma database client configuration using @prisma/adapter-pg.
const config = require("./env");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const url = new URL(config.databaseUrl);
const schema = url.searchParams.get("schema") || "public";

const adapter = new PrismaPg(
  {
    connectionString: config.databaseUrl,
  },
  { schema }
);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;

