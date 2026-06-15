import { authorInfoFeature } from "./author/info";
import { gridLayoutFeature } from "./layouts/grid";
import { photoCaptionFeature } from "./media/photoCaption";

export const featureRegistry = [gridLayoutFeature, authorInfoFeature, photoCaptionFeature];

export const layoutFeatures = featureRegistry.filter((feature) => feature.category === "layout");
export const blockFeatures = featureRegistry.filter((feature) => feature.category === "block");

export function getFeature(type) {
  return featureRegistry.find((feature) => feature.type === type) || null;
}

export function createBlock(type) {
  const feature = getFeature(type);
  if (!feature) throw new Error(`Unknown feature type: ${type}`);

  const block = {
    id: `${type.replace(/[^a-zA-Z0-9]+/g, "-")}-${crypto.randomUUID()}`,
    type: feature.type,
    version: feature.version,
    state: structuredClone(feature.defaultState),
  };

  if (feature.acceptsChildren) {
    block.children = [];
  }

  return block;
}
