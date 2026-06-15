import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, ".template-export");
const overridesDir = path.join(root, "template");

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
  "public/uploads",
  "src/assets",
  "src/services/storage/localProvider.js",
  "docs",
  "scripts",
  "dist",
  "_vite_seed",
  ".local-publish-tmp",
];

safeRemove(outDir);
fs.mkdirSync(outDir, { recursive: true });

for (const relativePath of includePaths) {
  copyIfExists(path.join(root, relativePath), path.join(outDir, relativePath));
}

for (const relativePath of removeFromExport) {
  safeRemove(path.join(outDir, relativePath));
}

copyIfExists(overridesDir, outDir);
writeTemplateData();

console.log("Template export generated:", outDir);

function writeTemplateData() {
  const templateData = {
    schemaVersion: 2,
    site: {
      title: "Personal Portfolio",
      language: "uk",
      theme: "light",
    },
    pages: [
      {
        id: "home",
        path: "/",
        title: "Home",
        blocks: [
          {
            id: "author-info",
            type: "author.info",
            version: 1,
            state: {
              avatar: "",
              name: "Your Name",
              title: "Your Role",
              location: "City, Country",
              socialDisplay: "icons-labels",
              socials: [
                {
                  id: "linkedin",
                  icon: "in",
                  name: "LinkedIn",
                  url: "https://www.linkedin.com/in/your-profile",
                },
              ],
            },
          },
        ],
      },
    ],
  };

  fs.writeFileSync(
    path.join(outDir, "public", "portfolio-data.json"),
    `${JSON.stringify(templateData, null, 2)}\n`,
  );
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return;
  copyRecursive(src, dest);
}

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
