import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = "public/portfolio-data.json";
const uploadsDirPath = "public/uploads";

export default defineConfig({
  plugins: [react(), tailwindcss(), localCmsBridge()],
});

function localCmsBridge() {
  return {
    name: "local-cms-bridge",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = new URL(req.url || "/", `http://${req.headers.host}`);
        if (requestUrl.pathname !== "/api/publish-local" || req.method !== "POST") {
          if (requestUrl.pathname === "/api/list-uploads" && req.method === "GET") {
            try {
              sendJson(res, 200, { ok: true, files: listLocalUploads() });
            } catch (error) {
              sendJson(res, 500, {
                ok: false,
                message: error.message || "Local upload scan failed.",
              });
            }
            return;
          }

          next();
          return;
        }

        try {
          const changeSet = await readJsonBody(req);
          const result = publishLocalChangeSet(changeSet);
          sendJson(res, 200, result);
        } catch (error) {
          sendJson(res, 500, {
            ok: false,
            message: error.message || "Local publish failed.",
          });
        }
      });
    },
  };
}

function listLocalUploads() {
  const uploadsDir = path.resolve(__dirname, uploadsDirPath);
  if (!fs.existsSync(uploadsDir)) return [];

  return fs.readdirSync(uploadsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => `${uploadsDirPath}/${entry.name}`)
    .filter((repoPath) => /^public\/uploads\/[a-zA-Z0-9._-]+\.(avif|gif|jpe?g|png|svg|webp)$/i.test(repoPath))
    .sort();
}

function publishLocalChangeSet(changeSet) {
  if (!Array.isArray(changeSet?.files) || changeSet.files.length === 0) {
    throw new Error("Change set не містить файлів.");
  }

  const transactionId = `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const transactionDir = path.resolve(__dirname, ".local-publish-tmp", transactionId);
  const stagedFiles = changeSet.files.map((file) => stageFile(transactionDir, file));
  const deletedFiles = (changeSet.deletedFiles || []).map((repoPath) => ({
    repoPath: normalizeRepoPath(repoPath),
    finalPath: resolveWritableRepoPath(repoPath),
  }));

  try {
    for (const deletedFile of deletedFiles) {
      fs.rmSync(deletedFile.finalPath, { force: true });
    }

    for (const stagedFile of orderFilesForVisibility(stagedFiles)) {
      fs.mkdirSync(path.dirname(stagedFile.finalPath), { recursive: true });
      fs.copyFileSync(stagedFile.stagedPath, stagedFile.finalPath);
    }
  } finally {
    fs.rmSync(transactionDir, { recursive: true, force: true });
  }

  const commitSha = `local-${Date.now().toString(36)}`;

  return {
    ok: true,
    mode: "local",
    branch: "dev",
    commitSha,
    files: [...deletedFiles.map((file) => file.repoPath), ...stagedFiles.map((file) => file.repoPath)],
  };
}

function stageFile(transactionDir, file) {
  const repoPath = normalizeRepoPath(file.repoPath);
  const finalPath = resolveWritableRepoPath(repoPath);
  const stagedPath = path.join(transactionDir, repoPath);
  const content = decodeFileContent(file);

  fs.mkdirSync(path.dirname(stagedPath), { recursive: true });
  fs.writeFileSync(stagedPath, content);

  return {
    repoPath,
    finalPath,
    stagedPath,
  };
}

function decodeFileContent(file) {
  if (file.encoding === "base64") return Buffer.from(file.content || "", "base64");
  if (file.encoding === "utf-8") return String(file.content || "");
  throw new Error(`Непідтримуване encoding для ${file.repoPath}.`);
}

function resolveWritableRepoPath(repoPath) {
  const allowed =
    repoPath === dataFilePath ||
    /^public\/uploads\/[a-zA-Z0-9._-]+\.(avif|gif|jpe?g|png|svg|webp)$/i.test(repoPath);

  if (!allowed) {
    throw new Error(`Локальна публікація не може записати ${repoPath}.`);
  }

  const resolved = path.resolve(__dirname, repoPath);
  const root = path.resolve(__dirname);
  const rootWithSeparator = `${root}${path.sep}`.toLowerCase();

  if (!resolved.toLowerCase().startsWith(rootWithSeparator)) {
    throw new Error(`Небезпечний шлях: ${repoPath}.`);
  }

  return resolved;
}

function normalizeRepoPath(repoPath) {
  const normalized = String(repoPath || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").includes("..")) {
    throw new Error(`Небезпечний шлях: ${repoPath}.`);
  }
  return normalized;
}

function orderFilesForVisibility(files) {
  return [...files].sort((left, right) => {
    if (left.repoPath === dataFilePath) return 1;
    if (right.repoPath === dataFilePath) return -1;
    return left.repoPath.localeCompare(right.repoPath);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 12 * 1024 * 1024) {
        reject(new Error("Payload завеликий для локальної публікації."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Некоректний JSON payload."));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}
