import { listGitHubUploadFiles, publishGitHubChangeSet } from "./githubProvider";

export function createStorageProvider({ token, repo, branch }) {
  return {
    mode: "github",
    requiresAuth: true,
    publish: (changeSet) => publishGitHubChangeSet({ token, repo, branch, changeSet }),
    listUploadFiles: () => listGitHubUploadFiles({ token, repo, branch }),
  };
}
