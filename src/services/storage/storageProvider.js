import { listGitHubUploadFiles, publishGitHubChangeSet } from "./githubProvider";
import { listLocalUploadFiles, publishLocalChangeSet } from "./localProvider";

export function createStorageProvider({ runtimeMode, token, repo, branch }) {
  if (runtimeMode === "local-dev") {
    return {
      mode: "local",
      requiresAuth: false,
      publish: publishLocalChangeSet,
      listUploadFiles: listLocalUploadFiles,
    };
  }

  return {
    mode: "github",
    requiresAuth: true,
    publish: (changeSet) => publishGitHubChangeSet({ token, repo, branch, changeSet }),
    listUploadFiles: () => listGitHubUploadFiles({ token, repo, branch }),
  };
}
