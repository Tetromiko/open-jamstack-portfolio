import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DATA_FILE_PUBLIC_PATH,
  DEFAULT_BRANCH,
  DRAFT_STORAGE_KEY,
  LEGACY_REPO_KEY,
  LEGACY_TOKEN_KEY,
  STORAGE_BRANCH_KEY,
  STORAGE_REPO_KEY,
  STORAGE_TOKEN_KEY,
} from "../constants";
import { createBlock } from "../features/registry";
import { revokePendingAsset } from "../services/mediaStaging";
import { createPortfolioChangeSet } from "../services/storage/changeSet";
import { validateRepoAccess } from "../services/storage/githubProvider";
import { createStorageProvider } from "../services/storage/storageProvider";
import { shortSha } from "../utils/format";
import { collectLocalMediaPaths, publicUploadPathToRepoPath, repoUploadPathToPublicPath } from "../utils/mediaReferences";
import {
  detectRepoFromUrl,
  detectRuntimeMode,
  getAdminUrl,
  getConfiguredBranch,
  getVirtualPathname,
} from "../utils/routing";
import {
  addBlockToHomePage,
  moveBlock,
  normalizePortfolioData,
  removeBlock,
  updateBlockState,
  validatePortfolioData,
} from "../utils/validation";

export function usePortfolioApp() {
  const virtualPathname = getVirtualPathname();
  const isAdminRoute = virtualPathname.endsWith("/admin");
  const runtimeMode = detectRuntimeMode();
  const autoDetectedRepo = detectRepoFromUrl();
  const defaultBranch = getConfiguredBranch() || DEFAULT_BRANCH;
  const canonicalAdminUrl = getAdminUrl(runtimeMode);

  const [auth, setAuth] = useState({
    token: "",
    repo: autoDetectedRepo,
    branch: defaultBranch,
  });
  const [data, setData] = useState(null);
  const [pendingAssets, setPendingAssets] = useState([]);
  const [deletedAssetRepoPaths, setDeletedAssetRepoPaths] = useState([]);
  const [lastPublish, setLastPublish] = useState(null);
  const [status, setStatus] = useState("booting");
  const [message, setMessage] = useState("");
  const mediaCleanupKeyRef = useRef("");

  const storageProvider = useMemo(
    () =>
      createStorageProvider({
        runtimeMode,
        token: auth.token,
        repo: auth.repo,
        branch: auth.branch,
      }),
    [auth.branch, auth.repo, auth.token, runtimeMode],
  );
  const requiresPat = storageProvider.requiresAuth;
  const isAuthenticated = Boolean(auth.token && auth.repo && auth.branch);
  const authReady = requiresPat ? isAuthenticated : true;
  const showDashboard = Boolean(data) && authReady;
  const canSave = Boolean(data) && authReady && status !== "saving" && status !== "loading";

  const findUnusedUploadRepoPaths = useCallback(async () => {
    if (!data || !storageProvider.listUploadFiles) return [];

    const uploadRepoPaths = await storageProvider.listUploadFiles();
    const usedPublicPaths = new Set(collectLocalMediaPaths(data));
    const pendingRepoPaths = new Set(pendingAssets.map((asset) => asset.repoPath));

    return uploadRepoPaths
      .filter((repoPath) => !pendingRepoPaths.has(repoPath))
      .filter((repoPath) => {
        const publicPath = repoUploadPathToPublicPath(repoPath);
        return publicPath && !usedPublicPaths.has(publicPath);
      });
  }, [data, pendingAssets, storageProvider]);

  const persistAuth = useCallback((nextAuth) => {
    localStorage.setItem(STORAGE_TOKEN_KEY, nextAuth.token);
    localStorage.setItem(STORAGE_REPO_KEY, nextAuth.repo);
    localStorage.setItem(STORAGE_BRANCH_KEY, nextAuth.branch);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_REPO_KEY);
    setAuth(nextAuth);
  }, []);

  const handleLogout = useCallback((reload = true) => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_REPO_KEY);
    localStorage.removeItem(STORAGE_BRANCH_KEY);
    setAuth({ token: "", repo: autoDetectedRepo, branch: defaultBranch });
    setStatus("idle");
    setMessage("Сесію очищено.");
    if (reload) window.location.reload();
  }, [autoDetectedRepo, defaultBranch]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setStatus("loading");
      setMessage("");

      try {
        const cacheBuster = runtimeMode === "local-dev" ? `?t=${Date.now()}` : "";
        const response = await fetch(`${import.meta.env.BASE_URL}${DATA_FILE_PUBLIC_PATH}${cacheBuster}`);
        if (!response.ok) {
          throw new Error(`Не вдалося завантажити ${DATA_FILE_PUBLIC_PATH} (${response.status}).`);
        }

        const json = await response.json();
        const validation = validatePortfolioData(json);
        if (!validation.ok) throw new Error(validation.message);
        if (cancelled) return;

        setData(validation.data);
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setMessage(error.message || "Помилка завантаження публічних даних.");
        return;
      }

      if (!isAdminRoute) {
        setStatus("idle");
        return;
      }

      if (!requiresPat) {
        setAuth({ token: "local-dev", repo: "local/dev", branch: defaultBranch });
        setStatus("success");
        setMessage("Local dev mode: редактор відкритий, save піде у файлову систему.");
        return;
      }

      const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || "";
      const storedRepo = localStorage.getItem(STORAGE_REPO_KEY) || localStorage.getItem(LEGACY_REPO_KEY) || autoDetectedRepo;
      const storedBranch = localStorage.getItem(STORAGE_BRANCH_KEY) || defaultBranch;

      setAuth({ token: "", repo: storedRepo, branch: storedBranch });
      if (!storedToken || !storedRepo) {
        setStatus("idle");
        return;
      }

      setStatus("auth-checking");
      setMessage("Перевірка доступу до репозиторію...");

      const result = await validateRepoAccess(storedToken, storedRepo, storedBranch);
      if (cancelled) return;

      if (!result.ok) {
        handleLogout(false);
        setStatus("error");
        setMessage(`${result.message} Авторизуйтесь ще раз.`);
        return;
      }

      persistAuth({ token: storedToken, repo: storedRepo, branch: result.branch || storedBranch });
      setStatus("success");
      setMessage("Сесію відновлено. Редактор готовий.");
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [autoDetectedRepo, defaultBranch, handleLogout, isAdminRoute, persistAuth, requiresPat, runtimeMode]);

  useEffect(() => {
    if (!isAdminRoute || !showDashboard || !data || !storageProvider.listUploadFiles) return;

    const cleanupKey = `${storageProvider.mode}:${auth.repo}:${auth.branch}:${collectLocalMediaPaths(data).join("|")}`;
    if (mediaCleanupKeyRef.current === cleanupKey) return;
    mediaCleanupKeyRef.current = cleanupKey;

    let cancelled = false;

    async function cleanupUnusedMediaQuietly() {
      try {
        const unusedRepoPaths = await findUnusedUploadRepoPaths();
        if (cancelled || unusedRepoPaths.length === 0) return;

        const validation = validatePortfolioData(data);
        if (!validation.ok) return;

        const changeSet = createPortfolioChangeSet(validation.data, [], unusedRepoPaths);
        await storageProvider.publish(changeSet);
      } catch (error) {
        console.warn("Unused media cleanup skipped.", error);
      }
    }

    cleanupUnusedMediaQuietly();

    return () => {
      cancelled = true;
    };
  }, [auth.branch, auth.repo, data, findUnusedUploadRepoPaths, isAdminRoute, showDashboard, storageProvider]);

  async function handleLogin({ token, repo, branch }) {
    if (!token.trim() || !repo.trim() || !branch.trim()) return;

    setStatus("auth-checking");
    setMessage("Перевірка GitHub доступу...");

    const result = await validateRepoAccess(token.trim(), repo.trim(), branch.trim());
    if (!result.ok) {
      setStatus("error");
      setMessage(result.message);
      return;
    }

    persistAuth({
      token: token.trim(),
      repo: repo.trim(),
      branch: result.branch || branch.trim(),
    });
    setStatus("success");
    setMessage("GitHub storage підключено.");
  }

  function handleBlockCommit(blockId, nextState, stagedAssets = []) {
    const nextData = updateBlockState(data, blockId, nextState);
    const beforeMediaPaths = collectLocalMediaPaths(data);
    const afterMediaPaths = new Set(collectLocalMediaPaths(nextData));
    const stagedPublicPaths = new Set(stagedAssets.map((asset) => asset.publicPath));
    const pendingMediaPaths = new Set(pendingAssets.map((asset) => asset.publicPath));
    const removedMediaPaths = beforeMediaPaths.filter((path) => !afterMediaPaths.has(path));
    const removedPublishedRepoPaths = beforeMediaPaths
      .filter((path) => !afterMediaPaths.has(path))
      .filter((path) => !stagedPublicPaths.has(path))
      .filter((path) => !pendingMediaPaths.has(path))
      .map(publicUploadPathToRepoPath)
      .filter(Boolean);

    if (removedPublishedRepoPaths.length) {
      setDeletedAssetRepoPaths((current) => [...new Set([...current, ...removedPublishedRepoPaths])]);
    }

    if (stagedAssets.length) {
      const usedPublicPaths = new Set(collectLocalMediaPaths(nextData));
      setPendingAssets((current) => [
        ...current.filter((asset) => {
          const shouldKeep = !removedMediaPaths.includes(asset.publicPath);
          if (!shouldKeep) revokePendingAsset(asset);
          return shouldKeep;
        }),
        ...stagedAssets.filter((asset) => usedPublicPaths.has(asset.publicPath)),
      ]);
    } else if (removedMediaPaths.some((path) => pendingMediaPaths.has(path))) {
      setPendingAssets((current) => current.filter((asset) => {
        const shouldKeep = !removedMediaPaths.includes(asset.publicPath);
        if (!shouldKeep) revokePendingAsset(asset);
        return shouldKeep;
      }));
    }

    setData(nextData);
    setLastPublish(null);
    setStatus("idle");
    setMessage("Зміни блока застосовано.");
  }

  function handleAddBlock(type, parentId = "", targetIndex = null) {
    try {
      setData((current) => addBlockToHomePage(current, createBlock(type), parentId, targetIndex));
      setLastPublish(null);
      setStatus("idle");
      setMessage("Блок додано до документа.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Не вдалося додати блок.");
    }
  }

  function handleMoveBlock(blockId, parentId = "", targetIndex = null) {
    setData((current) => moveBlock(current, blockId, parentId, targetIndex));
    setLastPublish(null);
    setStatus("idle");
    setMessage("Порядок блоків оновлено.");
  }

  function handleThemeChange(nextTheme) {
    setData((current) => normalizePortfolioData({
      ...current,
      site: {
        ...current.site,
        theme: nextTheme,
      },
    }));
    setLastPublish(null);
    setStatus("idle");
    setMessage("Тему оновлено.");
  }

  function handleRemoveBlock(blockId) {
    const beforeMediaPaths = collectLocalMediaPaths(data);
    const nextData = removeBlock(data, blockId);
    const afterMediaPaths = new Set(collectLocalMediaPaths(nextData));
    const orphanedMediaPaths = beforeMediaPaths.filter((path) => !afterMediaPaths.has(path));
    const pendingMediaPaths = new Set(pendingAssets.map((asset) => asset.publicPath));
    const orphanedPublishedRepoPaths = orphanedMediaPaths
      .filter((path) => !pendingMediaPaths.has(path))
      .map(publicUploadPathToRepoPath)
      .filter(Boolean);

    if (orphanedMediaPaths.some((path) => pendingMediaPaths.has(path))) {
      setPendingAssets((current) => current.filter((asset) => {
        const shouldKeep = !orphanedMediaPaths.includes(asset.publicPath);
        if (!shouldKeep) revokePendingAsset(asset);
        return shouldKeep;
      }));
    }

    if (orphanedPublishedRepoPaths.length) {
      setDeletedAssetRepoPaths((current) => [...new Set([...current, ...orphanedPublishedRepoPaths])]);
    }

    setData(nextData);
    setLastPublish(null);
  }

  function handleRemovePendingAsset(assetId) {
    const asset = pendingAssets.find((item) => item.id === assetId);
    if (!asset) return;

    revokePendingAsset(asset);
    setPendingAssets((current) => current.filter((item) => item.id !== assetId));
    setData((current) => normalizePortfolioData(replaceAssetReference(current, asset.publicPath, "")));
  }

  async function handleSave() {
    if (!canSave || !data) return;

    const validation = validatePortfolioData(data);
    if (!validation.ok) {
      setStatus("error");
      setMessage(validation.message);
      return;
    }

    if (storageProvider.requiresAuth && !isAuthenticated) {
      setStatus("error");
      setMessage("Потрібно підключити GitHub PAT перед публікацією.");
      return;
    }

    setStatus("saving");
    setMessage("Формування атомарного change set...");

    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          savedAt: new Date().toISOString(),
          data: validation.data,
        }),
      );

      const stillUnusedDeletedAssetRepoPaths = deletedAssetRepoPaths.filter((repoPath) => {
        const publicPath = repoPath.replace(/^public/, "");
        return !collectLocalMediaPaths(validation.data).includes(publicPath);
      });
      const changeSet = createPortfolioChangeSet(validation.data, pendingAssets, stillUnusedDeletedAssetRepoPaths);
      const result = await storageProvider.publish(changeSet);

      pendingAssets.forEach(revokePendingAsset);
      setPendingAssets([]);
      setDeletedAssetRepoPaths([]);
      setData(validation.data);
      setLastPublish(result);
      setStatus("success");
      setMessage(
        result.commitSha
          ? `Зміни опубліковано одним commit: ${shortSha(result.commitSha)}.`
          : "Зміни опубліковано.",
      );
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Публікація не вдалася.");
    }
  }

  return {
    auth,
    canSave,
    canonicalAdminUrl,
    data,
    isAdminRoute,
    lastPublish,
    message,
    pendingAssets,
    requiresPat,
    runtimeMode,
    showDashboard,
    status,
    actions: {
      handleAddBlock,
      handleBlockCommit,
      handleLogin,
      handleLogout,
      handleMoveBlock,
      handleRemoveBlock,
      handleRemovePendingAsset,
      handleSave,
      handleThemeChange,
    },
  };
}

function replaceAssetReference(value, from, to) {
  if (Array.isArray(value)) return value.map((item) => replaceAssetReference(item, from, to));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceAssetReference(item, from, to)]),
    );
  }

  return value === from ? to : value;
}
