import crypto from "crypto";

/**
 * Generates a cryptographically secure random secret key for Bearer tokens / JWT secrets.
 * Usage: npx tsx src/scripts/seed/secret-key.ts [byteLength]
 */
const byteLength = Number.parseInt(process.argv[2] ?? "32", 10) || 32;

const hexKey = crypto.randomBytes(byteLength).toString("hex");
const base64UrlKey = crypto.randomBytes(byteLength).toString("base64url");

console.log(`Generated ${byteLength}-byte (${byteLength * 8}-bit) secret keys:\n`);
console.log(`Hex       : ${hexKey}`);
console.log(`Base64URL : ${base64UrlKey}\n`);
console.log("Copy either line into your .env file:");
console.log(`BEARER_TOKEN=${hexKey}`);

