export async function publishLocalChangeSet(changeSet) {
  const response = await fetch("/api/publish-local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changeSet),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Локальна публікація не вдалася.");
  }

  return payload;
}

export async function listLocalUploadFiles() {
  const response = await fetch("/api/list-uploads");
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Не вдалося прочитати локальні upload-файли.");
  }

  return payload.files || [];
}
