import { DATA_FILE_REPO_PATH } from "../../constants";
import { prettyJson } from "../../utils/format";

export function createPortfolioChangeSet(data, pendingAssets, deletedAssetRepoPaths = []) {
  return {
    message: "Update portfolio content",
    deletedFiles: [...new Set(deletedAssetRepoPaths)],
    files: [
      {
        repoPath: DATA_FILE_REPO_PATH,
        content: prettyJson(data),
        encoding: "utf-8",
      },
      ...pendingAssets.map((asset) => ({
        repoPath: asset.repoPath,
        content: asset.contentBase64,
        encoding: "base64",
        contentType: asset.contentType,
      })),
    ],
  };
}
