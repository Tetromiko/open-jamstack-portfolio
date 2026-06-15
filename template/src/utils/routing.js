import { DEFAULT_BRANCH } from "../constants";

export function getVirtualPathname() {
  const redirectedPath = new URLSearchParams(window.location.search).get("p");
  const hashPath = window.location.hash ? window.location.hash.replace("#", "") : "";
  const pathname = redirectedPath || hashPath || window.location.pathname;
  return normalizePathname(pathname);
}

export function detectRuntimeMode() {
  return "github-pages";
}

export function detectRepoFromUrl() {
  const host = window.location.hostname.toLowerCase();
  if (!host.endsWith(".github.io")) return "";

  const owner = host.replace(".github.io", "");
  const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
  const isProjectSite = firstSegment && firstSegment !== "admin";
  const repo = isProjectSite ? firstSegment : `${owner}.github.io`;

  return `${owner}/${repo}`;
}

export function getConfiguredBranch() {
  return import.meta.env.VITE_PORTFOLIO_BRANCH || DEFAULT_BRANCH;
}

export function getAdminUrl() {
  return `${import.meta.env.BASE_URL}#/admin`;
}

function normalizePathname(pathname) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalized.replace(/\/+$/, "").toLowerCase() || "/";
}
