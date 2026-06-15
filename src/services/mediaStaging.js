import { MAX_IMAGE_BYTES, UPLOADS_PUBLIC_DIR, UPLOADS_REPO_DIR } from "../constants";

const IMAGE_EXTENSIONS = new Set(["avif", "gif", "jpg", "jpeg", "png", "svg", "webp"]);

export async function stageImageFile(file) {
  if (!file) return null;
  validateImageFile(file);

  const safeName = createSafeUploadName(file.name);
  const publicPath = `${UPLOADS_PUBLIC_DIR}/${safeName}`;

  return {
    id: `${Date.now()}-${crypto.randomUUID()}`,
    fileName: file.name,
    repoPath: `${UPLOADS_REPO_DIR}/${safeName}`,
    publicPath,
    contentBase64: await fileToBase64(file),
    contentType: file.type || "application/octet-stream",
    size: file.size,
    previewUrl: URL.createObjectURL(file),
  };
}

export function revokePendingAsset(asset) {
  if (asset?.previewUrl) URL.revokeObjectURL(asset.previewUrl);
}

function validateImageFile(file) {
  const extension = getExtension(file.name);
  if (!file.type.startsWith("image/") || !IMAGE_EXTENSIONS.has(extension)) {
    throw new Error("Підтримуються лише зображення: avif, gif, jpg, png, svg або webp.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Зображення перевищує 5MB.");
  }
}

function createSafeUploadName(fileName) {
  const extension = getExtension(fileName) || "png";
  const rawBase = fileName.replace(/\.[^.]+$/, "");
  const safeBase = rawBase
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "image";
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);

  return `${safeBase}-${stamp}.${extension}`;
}

function getExtension(fileName) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Не вдалося прочитати файл."));
    reader.readAsDataURL(file);
  });
}
