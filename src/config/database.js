// src/config/database.js
import config from "./env.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Extract schema from DATABASE_URL (default to "public" if omitted)
const url = new URL(config.databaseUrl);
const schema = url.searchParams.get("schema") || "public";

const adapter = new PrismaPg(
    {
        connectionString: config.databaseUrl,
    },
    { schema } // 👈 Required: informs driver adapter which schema to query
);

const prisma = new PrismaClient({ adapter });

export default prisma;