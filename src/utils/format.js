export function prettyJson(obj) {
  return `${JSON.stringify(obj, null, 2)}\n`;
}

export function shortSha(sha) {
  return sha ? sha.slice(0, 7) : "";
}
