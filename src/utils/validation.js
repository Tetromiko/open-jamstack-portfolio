import { getFeature } from "../features/registry";

export {
  validateEmail,
  validateHttpUrl,
  validateOptionalMediaPath,
  validateRequiredString,
} from "./schema";

const SUPPORTED_SCHEMA_VERSION = 2;
const HOME_PAGE_ID = "home";
const validTheme = new Set(["light", "dark"]);

export function createDefaultPortfolioData() {
  return normalizePortfolioData({
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    site: {
      title: "Personal Portfolio",
      language: "uk",
      theme: "light",
    },
    pages: [
      {
        id: HOME_PAGE_ID,
        path: "/",
        title: "Home",
        blocks: [
          {
            id: "author-info-default",
            type: "author.info",
            version: 1,
            state: getFeature("author.info").defaultState,
          },
        ],
      },
    ],
  });
}

export function normalizePortfolioData(json) {
  if (hasSiteDocumentShape(json)) {
    return normalizeSiteDocument(json);
  }

  return normalizeSiteDocument(migrateLegacyData(json));
}

export function validatePortfolioData(json) {
  const data = normalizePortfolioData(json);
  const errors = [];

  if (data.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    errors.push(`Підтримується schemaVersion ${SUPPORTED_SCHEMA_VERSION}.`);
  }

  if (!data.pages.length) {
    errors.push("Документ має містити хоча б одну сторінку.");
  }

  data.pages.forEach((page, pageIndex) => {
    if (!page.id) errors.push(`pages[${pageIndex}].id є обов'язковим.`);
    if (!page.path) errors.push(`pages[${pageIndex}].path є обов'язковим.`);
    if (!Array.isArray(page.blocks)) errors.push(`pages[${pageIndex}].blocks має бути масивом.`);

    validateBlocks(page.blocks, `pages[${pageIndex}].blocks`, errors);
  });

  return {
    ok: errors.length === 0,
    data,
    errors,
    message: errors[0] || "",
  };
}

export function normalizeAndValidatePortfolioData(json) {
  return validatePortfolioData(json);
}

export function getHomePage(data) {
  return data.pages.find((page) => page.path === "/") || data.pages[0];
}

export function updateBlockState(data, blockId, nextState) {
  return normalizePortfolioData({
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      blocks: updateBlockStateInTree(page.blocks, blockId, nextState),
    })),
  });
}

export function addBlockToHomePage(data, block, parentId = "", targetIndex = null) {
  const homePage = getHomePage(data);

  return normalizePortfolioData({
    ...data,
    pages: data.pages.map((page) => (
      page.id === homePage.id
        ? {
          ...page,
          blocks: parentId
            ? addBlockToParent(page.blocks, parentId, block, targetIndex)
            : insertBlockAt(page.blocks, clearBlockPlacement(block), targetIndex),
        }
        : page
    )),
  });
}

export function moveBlock(data, blockId, targetParentId = "", targetIndex = null) {
  const homePage = getHomePage(data);

  return normalizePortfolioData({
    ...data,
    pages: data.pages.map((page) => {
      if (page.id !== homePage.id) return page;

      const extraction = extractBlockFromTree(page.blocks, blockId);
      if (!extraction.block) return page;
      if (targetParentId && containsBlock(extraction.block.children || [], targetParentId)) return page;

      return {
        ...page,
        blocks: targetParentId
          ? addBlockToParent(extraction.blocks, targetParentId, extraction.block, targetIndex)
          : insertBlockAt(extraction.blocks, clearBlockPlacement(extraction.block), targetIndex),
      };
    }),
  });
}

export function removeBlock(data, blockId) {
  return normalizePortfolioData({
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      blocks: removeBlockFromTree(page.blocks, blockId),
    })),
  });
}

function normalizeSiteDocument(json) {
  const source = isPlainObject(json) ? json : {};
  const pages = Array.isArray(source.pages) ? source.pages : [];
  const normalizedPages = pages.map((page, pageIndex) => ({
    id: String(page.id || (pageIndex === 0 ? HOME_PAGE_ID : `page-${pageIndex + 1}`)),
    path: String(page.path || (pageIndex === 0 ? "/" : `/page-${pageIndex + 1}`)),
    title: String(page.title || (pageIndex === 0 ? "Home" : `Page ${pageIndex + 1}`)),
    blocks: normalizeBlocks(page.blocks),
  }));

  if (!normalizedPages.length) {
    normalizedPages.push(createDefaultPortfolioData().pages[0]);
  }

  return {
    ...source,
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    site: {
      title: source.site?.title || "Personal Portfolio",
      language: source.site?.language || "uk",
      theme: validTheme.has(source.site?.theme) ? source.site.theme : "light",
    },
    pages: normalizedPages,
  };
}

function normalizeBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];

  return blocks
    .map((block, index) => {
      const feature = getFeature(block?.type);
      if (!feature) {
        return {
          id: block?.id || `unknown-${index + 1}`,
          type: block?.type || "unknown",
          version: Number(block?.version) || 1,
          state: block?.state || {},
          children: Array.isArray(block?.children) ? normalizeBlocks(block.children) : undefined,
        };
      }

      const normalizedBlock = {
        id: block.id || `${feature.type.replace(/[^a-zA-Z0-9]+/g, "-")}-${index + 1}`,
        type: feature.type,
        version: Number(block.version) || feature.version,
        state: feature.normalize(block.state),
      };

      if (isPlainObject(block.placement) && Number.isInteger(block.placement.gridCell)) {
        normalizedBlock.placement = {
          gridCell: Math.max(0, block.placement.gridCell),
        };
      }

      if (feature.acceptsChildren) {
        normalizedBlock.children = normalizeBlocks(block.children);
      }

      return normalizedBlock;
    });
}

function validateBlocks(blocks, path, errors) {
  blocks.forEach((block, blockIndex) => {
    const blockPath = `${path}[${blockIndex}]`;
    const feature = getFeature(block.type);

    if (!block.id) errors.push(`${blockPath}.id є обов'язковим.`);
    if (!feature) {
      errors.push(`${blockPath}.type "${block.type}" не зареєстрований.`);
      return;
    }

    errors.push(...feature.validate(feature.normalize(block.state), `${blockPath}.state`));

    if (feature.acceptsChildren) {
      if (block.type === "layout.grid") {
        validateGridChildPlacements(block, `${blockPath}.children`, errors);
      }
      validateBlocks(block.children || [], `${blockPath}.children`, errors);
      return;
    }

    if (Array.isArray(block.children) && block.children.length > 0) {
      errors.push(`${blockPath}.children дозволено тільки для layout блоків.`);
    }
  });
}

function validateGridChildPlacements(block, path, errors) {
  const rows = Math.max(1, Number.parseInt(block.state.rows, 10) || 1);
  const columns = Math.max(1, Number.parseInt(block.state.columns, 10) || 1);
  const capacity = rows * columns;
  const occupiedCells = new Set();

  (block.children || []).forEach((childBlock, childIndex) => {
    const cellIndex = Number.isInteger(childBlock.placement?.gridCell)
      ? childBlock.placement.gridCell
      : childIndex;

    if (cellIndex < 0 || cellIndex >= capacity) {
      errors.push(`${path}[${childIndex}].placement.gridCell має бути в межах 0..${capacity - 1}.`);
      return;
    }

    if (occupiedCells.has(cellIndex)) {
      errors.push(`${path}[${childIndex}].placement.gridCell дублює cell ${cellIndex}.`);
      return;
    }

    occupiedCells.add(cellIndex);
  });
}

function updateBlockStateInTree(blocks, blockId, nextState) {
  return blocks.map((block) => {
    const nextBlock = block.id === blockId ? { ...block, state: nextState } : block;
    if (!Array.isArray(nextBlock.children)) return nextBlock;

    return {
      ...nextBlock,
      children: updateBlockStateInTree(nextBlock.children, blockId, nextState),
    };
  });
}

function addBlockToParent(blocks, parentId, blockToAdd, targetIndex = null) {
  return blocks.map((block) => {
    if (block.id === parentId) {
      const nextChildren = block.type === "layout.grid"
        ? placeBlockInGridCell(block.children || [], blockToAdd, targetIndex)
        : insertBlockAt(block.children || [], clearBlockPlacement(blockToAdd), targetIndex);

      return {
        ...block,
        children: nextChildren,
      };
    }

    if (!Array.isArray(block.children)) return block;

    return {
      ...block,
      children: addBlockToParent(block.children, parentId, blockToAdd, targetIndex),
    };
  });
}

function placeBlockInGridCell(blocks, blockToPlace, target) {
  const cellIndex = normalizeGridCellTarget(target);
  if (!Number.isInteger(cellIndex)) return blocks;

  const targetIsOccupied = blocks.some((block) => block.placement?.gridCell === cellIndex);
  if (targetIsOccupied) return blocks;

  return [
    ...blocks,
    {
      ...blockToPlace,
      placement: {
        ...(blockToPlace.placement || {}),
        gridCell: cellIndex,
      },
    },
  ].sort(compareGridBlocks);
}

function insertBlockAt(blocks, blockToAdd, targetIndex = null) {
  const nextBlocks = [...blocks];
  const insertIndex = Number.isInteger(targetIndex)
    ? Math.max(0, Math.min(targetIndex, nextBlocks.length))
    : nextBlocks.length;

  nextBlocks.splice(insertIndex, 0, blockToAdd);
  return nextBlocks;
}

function normalizeGridCellTarget(target) {
  if (Number.isInteger(target)) return target;
  if (target?.kind === "grid-cell" && Number.isInteger(target.cellIndex)) return target.cellIndex;
  return null;
}

function clearBlockPlacement(block) {
  if (!block?.placement) return block;
  const nextBlock = { ...block };
  delete nextBlock.placement;
  return nextBlock;
}

function compareGridBlocks(left, right) {
  const leftCell = Number.isInteger(left.placement?.gridCell) ? left.placement.gridCell : Number.MAX_SAFE_INTEGER;
  const rightCell = Number.isInteger(right.placement?.gridCell) ? right.placement.gridCell : Number.MAX_SAFE_INTEGER;
  return leftCell - rightCell;
}

function extractBlockFromTree(blocks, blockId) {
  let extractedBlock = null;
  const nextBlocks = [];

  blocks.forEach((block) => {
    if (block.id === blockId) {
      extractedBlock = block;
      return;
    }

    if (Array.isArray(block.children)) {
      const childExtraction = extractBlockFromTree(block.children, blockId);
      if (childExtraction.block) {
        extractedBlock = childExtraction.block;
        nextBlocks.push({ ...block, children: childExtraction.blocks });
        return;
      }
    }

    nextBlocks.push(block);
  });

  return {
    blocks: nextBlocks,
    block: extractedBlock,
  };
}

function containsBlock(blocks, blockId) {
  return blocks.some((block) => (
    block.id === blockId || containsBlock(block.children || [], blockId)
  ));
}

function removeBlockFromTree(blocks, blockId) {
  return blocks
    .filter((block) => block.id !== blockId)
    .map((block) => {
      if (!Array.isArray(block.children)) return block;

      return {
        ...block,
        children: removeBlockFromTree(block.children, blockId),
      };
    });
}

function migrateLegacyData(json) {
  const source = isPlainObject(json) ? json : {};
  const profile = isPlainObject(source.profile) ? source.profile : {};
  const contacts = isPlainObject(source.contacts) ? source.contacts : {};
  const socials = [];

  if (contacts.email) {
    socials.push({
      id: "email",
      icon: "@",
      name: "Email",
      url: `mailto:${contacts.email}`,
    });
  }

  if (contacts.linkedin) {
    socials.push({
      id: "linkedin",
      icon: "in",
      name: "LinkedIn",
      url: contacts.linkedin,
    });
  }

  return {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    site: {
      title: profile.name ? `${profile.name} Portfolio` : "Personal Portfolio",
      language: "uk",
      theme: "light",
    },
    pages: [
      {
        id: HOME_PAGE_ID,
        path: "/",
        title: "Home",
        blocks: [
          {
            id: "author-info",
            type: "author.info",
            version: 1,
            state: {
              avatar: profile.avatar || "",
              name: profile.name || "Your Name",
              title: profile.title || "Your Role",
              location: profile.location || "",
              socialDisplay: "icons-labels",
              socials,
            },
          },
        ],
      },
    ],
  };
}

function hasSiteDocumentShape(json) {
  return isPlainObject(json) && Array.isArray(json.pages);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
