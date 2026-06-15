import {
  validateOptionalMediaPath,
  validateRequiredString,
} from "../../../utils/schema";
import { AuthorInfoEditor } from "./AuthorInfoEditor";
import { AuthorInfoView } from "./AuthorInfoView";
import { authorInfoDefaultState } from "./defaults";

const validSocialDisplay = new Set(["tags", "icons", "icons-labels"]);

export const authorInfoFeature = {
  type: "author.info",
  category: "block",
  version: 1,
  title: "Інформація про автора",
  description: "Avatar, author identity, optional location, and nested social links.",
  defaultState: authorInfoDefaultState,
  ViewComponent: AuthorInfoView,
  EditorComponent: AuthorInfoEditor,
  normalize(state) {
    return {
      ...authorInfoDefaultState,
      ...state,
      socials: Array.isArray(state?.socials)
        ? state.socials.map((social) => ({
          id: social.id || crypto.randomUUID(),
          icon: social.icon || "",
          name: social.name || "",
          url: social.url || "",
        }))
        : [],
    };
  },
  validate(state, path) {
    const errors = [
      validateOptionalMediaPath(state.avatar, `${path}.avatar`),
      validateRequiredString(state.name, `${path}.name`),
      validateRequiredString(state.title, `${path}.title`),
      validSocialDisplay.has(state.socialDisplay)
        ? ""
        : `${path}.socialDisplay має бути tags, icons або icons-labels.`,
    ];

    state.socials.forEach((social, index) => {
      const socialPath = `${path}.socials[${index}]`;
      errors.push(validateRequiredString(social.name, `${socialPath}.name`));
      errors.push(validateSocialUrl(social.url, `${socialPath}.url`));
      if (social.icon) errors.push(validateOptionalIcon(social.icon, `${socialPath}.icon`));
    });

    return errors.filter(Boolean);
  },
};

function validateSocialUrl(value, label) {
  const requiredError = validateRequiredString(value, label);
  if (requiredError) return requiredError;

  if (value.startsWith("mailto:")) return "";

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? ""
      : `${label} має бути http, https або mailto посиланням.`;
  } catch {
    return `${label} має бути валідним посиланням.`;
  }
}

function validateOptionalIcon(value, label) {
  if (value.length <= 12 && !value.includes("/") && !value.includes(".")) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return "";
  return validateOptionalMediaPath(value, label);
}
