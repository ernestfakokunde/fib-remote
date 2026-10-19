import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

const [imagePath, token, apiBase = "http://localhost:5000/api"] = process.argv.slice(2);

if (!imagePath || !token) {
  console.error("Usage: node scripts/testAnalyzeImage.js <image-path> <bearer-token> [api-base-url]");
  process.exit(1);
}

const mimeByExtension = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const mimeType = mimeByExtension[extname(imagePath).toLowerCase()];
if (!mimeType) {
  console.error("Use a JPEG, PNG, or WebP image.");
  process.exit(1);
}

try {
  const image = await readFile(resolve(imagePath));
  const form = new FormData();
  form.append("image", new Blob([image], { type: mimeType }), basename(imagePath));

  const response = await fetch(`${apiBase.replace(/\/$/, "")}/products/analyze-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const result = await response.json().catch(() => ({ message: "Server returned a non-JSON response." }));
  console.log(JSON.stringify({ status: response.status, ...result }, null, 2));
  if (!response.ok) process.exitCode = 1;
} catch (error) {
  console.error(`Request failed: ${error.message}`);
  process.exitCode = 1;
}
