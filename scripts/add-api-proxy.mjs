import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiRoot = path.join(root, "app", "api");

const IMPORT_LINE =
  'import { maybeProxyToBackend } from "@/lib/api/proxy-storefront";\n';

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name === "route.ts") files.push(p);
  }
  return files;
}

for (const file of walk(apiRoot)) {
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("maybeProxyToBackend") || content.includes("useBackendAuth()")) {
    continue;
  }

  if (!content.includes(IMPORT_LINE.trim())) {
    const m = content.match(/^(import .+\n)+/);
    if (m) content = m[0] + IMPORT_LINE + content.slice(m[0].length);
    else content = IMPORT_LINE + content;
  }

  content = content.replace(
    /export async function (GET|POST|PATCH|DELETE|PUT)\(([^)]*)\)\s*\{/g,
    (match, method, args) => {
      if (match.includes("maybeProxyToBackend")) return match;
      const hasReq = /\breq\b/.test(args);
      const reqParam = hasReq ? "" : "req: Request, ";
      const fixedArgs = hasReq
        ? args
        : args.trim()
          ? `req: Request, ${args}`
          : "req: Request";
      return `export async function ${method}(${fixedArgs}) {
  const proxied = await maybeProxyToBackend(req);
  if (proxied) return proxied;
`;
    }
  );

  if (!content.includes('import type { Request }') && !content.includes("from \"next/server\"")) {
    // next/server usually exports Request via global in route handlers
  }

  fs.writeFileSync(file, content);
  console.log("patched", path.relative(root, file));
}

console.log("done");
