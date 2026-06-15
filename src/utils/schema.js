const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRequiredString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return `${label} не може бути порожнім.`;
  }
  return "";
}

export function validateEmail(value, label) {
  const requiredError = validateRequiredString(value, label);
  if (requiredError) return requiredError;
  return EMAIL_PATTERN.test(value.trim()) ? "" : `${label} має бути валідним email.`;
}

export function validateHttpUrl(value, label) {
  const requiredError = validateRequiredString(value, label);
  if (requiredError) return requiredError;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? ""
      : `${label} має починатися з http або https.`;
  } catch {
    return `${label} має бути валідним URL.`;
  }
}

export function validateOptionalMediaPath(value, label) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return "";
  if (/^\/uploads\/[a-zA-Z0-9._-]+\.(avif|gif|jpe?g|png|svg|webp)$/i.test(value)) return "";
  return `${label} має бути URL або шляхом виду /uploads/file.png.`;
}
