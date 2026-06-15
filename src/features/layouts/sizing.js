export const anchorXOptions = ["left", "center", "right", "stretch"];
export const anchorYOptions = ["top", "middle", "bottom", "stretch"];
export const validAnchorX = new Set(anchorXOptions);
export const validAnchorY = new Set(anchorYOptions);

export const fillModeOptions = ["content", "width", "parent", "viewport"];
export const validFillMode = new Set(fillModeOptions);

export function normalizeFillMode(value) {
  return validFillMode.has(value) ? value : "content";
}

export function normalizeAnchorX(value, fillMode = "content") {
  if (validAnchorX.has(value)) return value;
  if (fillMode === "content") return "center";
  return "stretch";
}

export function normalizeAnchorY(value, fillMode = "content") {
  if (validAnchorY.has(value)) return value;
  if (fillMode === "viewport" || fillMode === "parent") return "stretch";
  return "top";
}

export function getAnchorStyle(anchorX, anchorY) {
  return {
    ...getAnchorXStyle(anchorX),
    ...getAnchorYStyle(anchorY),
  };
}

function getAnchorXStyle(anchorX) {
  if (anchorX === "left") {
    return {
      alignSelf: "flex-start",
      justifySelf: "start",
      maxWidth: "100%",
    };
  }

  if (anchorX === "center") {
    return {
      alignSelf: "center",
      justifySelf: "center",
      maxWidth: "100%",
    };
  }

  if (anchorX === "right") {
    return {
      alignSelf: "flex-end",
      justifySelf: "end",
      maxWidth: "100%",
    };
  }

  return {
    alignSelf: "stretch",
    justifySelf: "stretch",
    width: "100%",
  };
}

function getAnchorYStyle(anchorY) {
  if (anchorY === "middle") {
    return {
      marginTop: "auto",
      marginBottom: "auto",
    };
  }

  if (anchorY === "bottom") {
    return {
      marginTop: "auto",
    };
  }

  if (anchorY === "stretch") {
    return {
      minHeight: "var(--layout-viewport-height, 100%)",
    };
  }

  return {};
}

export function getFillModeStyle(fillMode) {
  if (fillMode === "width") {
    return getAnchorStyle("stretch", "top");
  }

  if (fillMode === "parent") {
    return getAnchorStyle("stretch", "stretch");
  }

  if (fillMode === "viewport") {
    return getAnchorStyle("stretch", "stretch");
  }

  return getAnchorStyle("center", "top");
}
