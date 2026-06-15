import { UPLOADS_PUBLIC_DIR, UPLOADS_REPO_DIR } from "../constants";

const localUploadPattern = /^\/uploads\/[a-zA-Z0-9._-]+\.(avif|gif|jpe?g|png|svg|webp)$/i;

export function collectLocalMediaPaths(value) {
  const paths = new Set();
  collect(value, paths);
  return [...paths];
}

export function publicUploadPathToRepoPath(publicPath) {
  if (!localUploadPattern.test(publicPath)) return "";
  return `${UPLOADS_REPO_DIR}/${publicPath.slice(UPLOADS_PUBLIC_DIR.length + 1)}`;
}

export function repoUploadPathToPublicPath(repoPath) {
  if (!repoPath.startsWith(`${UPLOADS_REPO_DIR}/`)) return "";
  const fileName = repoPath.slice(UPLOADS_REPO_DIR.length + 1);
  const publicPath = `${UPLOADS_PUBLIC_DIR}/${fileName}`;
  return localUploadPattern.test(publicPath) ? publicPath : "";
}

function collect(value, paths) {
  if (typeof value === "string") {
    if (localUploadPattern.test(value)) paths.add(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collect(item, paths));
    return;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collect(item, paths));
  }
}
