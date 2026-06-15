const API_ROOT = "https://api.github.com";
const uploadsRepoDir = "public/uploads";

export async function validateRepoAccess(token, repo, branch) {
  try {
    const parsedRepo = parseRepo(repo);
    const repository = await githubRequest(token, parsedRepo, "");
    const targetBranch = branch || repository.default_branch || "main";
    await githubRequest(token, parsedRepo, `/git/ref/heads/${encodeGitRef(targetBranch)}`);

    return {
      ok: true,
      defaultBranch: repository.default_branch,
      branch: targetBranch,
    };
  } catch (error) {
    return {
      ok: false,
      message: mapGitHubError(error),
    };
  }
}

export async function publishGitHubChangeSet({ token, repo, branch, changeSet }) {
  const parsedRepo = parseRepo(repo);
  const targetBranch = branch || "main";
  const refPath = `/git/ref/heads/${encodeGitRef(targetBranch)}`;

  try {
    const currentRef = await githubRequest(token, parsedRepo, refPath);
    const parentSha = currentRef.object.sha;
    const parentCommit = await githubRequest(token, parsedRepo, `/git/commits/${parentSha}`);

    const treeEntries = [];
    for (const repoPath of changeSet.deletedFiles || []) {
      treeEntries.push({
        path: normalizeRepoPath(repoPath),
        mode: "100644",
        type: "blob",
        sha: null,
      });
    }

    for (const file of changeSet.files) {
      const blob = await githubRequest(token, parsedRepo, "/git/blobs", {
        method: "POST",
        body: {
          content: file.content,
          encoding: file.encoding,
        },
      });

      treeEntries.push({
        path: normalizeRepoPath(file.repoPath),
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      });
    }

    const tree = await githubRequest(token, parsedRepo, "/git/trees", {
      method: "POST",
      body: {
        base_tree: parentCommit.tree.sha,
        tree: treeEntries,
      },
    });

    const commit = await githubRequest(token, parsedRepo, "/git/commits", {
      method: "POST",
      body: {
        message: changeSet.message,
        tree: tree.sha,
        parents: [parentSha],
      },
    });

    await githubRequest(token, parsedRepo, refPath, {
      method: "PATCH",
      body: {
        sha: commit.sha,
        force: false,
      },
    });

    return {
      ok: true,
      mode: "github",
      branch: targetBranch,
      commitSha: commit.sha,
      commitUrl: commit.html_url || `https://github.com/${parsedRepo.owner}/${parsedRepo.name}/commit/${commit.sha}`,
      files: treeEntries.map((entry) => entry.path),
    };
  } catch (error) {
    if (error.status === 409) {
      throw new Error("Гілка змінилася під час збереження. Оновіть дані й повторіть save.", {
        cause: error,
      });
    }
    throw new Error(mapGitHubError(error), { cause: error });
  }
}

export async function listGitHubUploadFiles({ token, repo, branch }) {
  const parsedRepo = parseRepo(repo);
  const targetBranch = branch || "main";

  try {
    const payload = await githubRequest(
      token,
      parsedRepo,
      `/contents/${uploadsRepoDir}?ref=${encodeURIComponent(targetBranch)}`,
    );

    if (!Array.isArray(payload)) return [];

    return payload
      .filter((item) => item.type === "file")
      .map((item) => item.path)
      .filter((repoPath) => /^public\/uploads\/[a-zA-Z0-9._-]+\.(avif|gif|jpe?g|png|svg|webp)$/i.test(repoPath));
  } catch (error) {
    if (error.status === 404) return [];
    throw new Error(mapGitHubError(error), { cause: error });
  }
}

async function githubRequest(token, repo, endpoint, options = {}) {
  const response = await fetch(`${API_ROOT}/repos/${repo.owner}/${repo.name}${endpoint}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(payload?.message || `GitHub API повернув статус ${response.status}.`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function parseRepo(repo) {
  const match = /^([^/\s]+)\/([^/\s]+)$/.exec(repo || "");
  if (!match) {
    throw new Error("Репозиторій має бути у форматі owner/repo.");
  }
  return {
    owner: match[1],
    name: match[2],
  };
}

function encodeGitRef(branch) {
  return branch.split("/").map(encodeURIComponent).join("/");
}

function normalizeRepoPath(repoPath) {
  return repoPath.replace(/^\/+/, "").replace(/\\/g, "/");
}

function mapGitHubError(error) {
  if (error.status === 401) return "GitHub token недійсний або не має потрібних прав.";
  if (error.status === 403) return "GitHub token не має права Contents: read/write для цього repo.";
  if (error.status === 404) return "Репозиторій або гілку не знайдено.";
  if (error.status === 409) return "Гілка змінилася під час збереження.";
  return error.message || "GitHub API помилка.";
}
