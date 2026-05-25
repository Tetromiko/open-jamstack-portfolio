import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, ".template-export");

const includePaths = [
  "src",
  "public",
  ".github/workflows/deploy-pages.yml",
  "index.html",
  "package.json",
  "package-lock.json",
  "vite.config.js",
  "eslint.config.js",
  ".gitignore",
  "README.md",
];

const removeFromExport = [
  "public/data/demo",
  "public/demo",
  "src/dev-only",
  "docs",
  "scripts",
  "dist",
  "_vite_seed",
];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function safeRemove(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  fs.rmSync(targetPath, { recursive: true, force: true });
}

safeRemove(outDir);
fs.mkdirSync(outDir, { recursive: true });

for (const relativePath of includePaths) {
  const src = path.join(root, relativePath);
  if (!fs.existsSync(src)) {
    continue;
  }
  const dest = path.join(outDir, relativePath);
  copyRecursive(src, dest);
}

for (const relativePath of removeFromExport) {
  safeRemove(path.join(outDir, relativePath));
}

console.log("Template export generated:", outDir);
