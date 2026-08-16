import { execFileSync } from "child_process";
import { createCipheriv, pbkdf2Sync, randomBytes } from "crypto";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/seal-publish-token.mjs <password>");
  process.exit(1);
}

const token = execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
if (!token) {
  console.error("gh auth token returned nothing.");
  process.exit(1);
}

const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(password, salt, 210000, 32, "sha256");
const cipher = createCipheriv("aes-256-gcm", key, iv);
const data = Buffer.concat([cipher.update(token, "utf8"), cipher.final(), cipher.getAuthTag()]);
const payload = {
  v: 1,
  salt: salt.toString("base64"),
  iv: iv.toString("base64"),
  data: data.toString("base64"),
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
writeFileSync(join(root, "public", "admin-publish.json"), `${JSON.stringify(payload)}\n`);
console.log("Wrote public/admin-publish.json");
