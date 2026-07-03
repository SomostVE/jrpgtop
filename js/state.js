const STORAGE_KEY = "jrpgtop-state-v2";

const DEFAULT_STATE = {
  version: 3,
  initialized: false,

  lang: "fr",
  spoilerOn: false,
  hideTitles: false,
  finalized: false,

  rankingScope: "all-licenses",
  activeLicenseId: "",
  selectedThemeByLicense: {},
  rankings: {}
};

let state = loadState();
const listeners = new Set();

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function normalizeState(candidate) {
  const hasRankingScope =
    candidate && typeof candidate.rankingScope === "string";

  const next = {
    ...clone(DEFAULT_STATE),
    ...(candidate && typeof candidate === "object" ? candidate : {})
  };

  if (!hasRankingScope) {
    next.rankingScope = next.activeLicenseId || "all-licenses";
  }

  next.selectedThemeByLicense =
    next.selectedThemeByLicense && typeof next.selectedThemeByLicense === "object"
      ? next.selectedThemeByLicense
      : {};

  next.rankings =
    next.rankings && typeof next.rankings === "object"
      ? next.rankings
      : {};

  for (const [scopeId, order] of Object.entries(next.rankings)) {
    next.rankings[scopeId] = Array.isArray(order)
      ? [...new Set(order.filter(Boolean))]
      : [];
  }

  if (!["fr", "en"].includes(next.lang)) {
    next.lang = "fr";
  }

  if (typeof next.rankingScope !== "string" || !next.rankingScope) {
    next.rankingScope = "all-licenses";
  }

  if (typeof next.activeLicenseId !== "string") {
    next.activeLicenseId = "";
  }

  next.version = 3;
  next.spoilerOn = Boolean(next.spoilerOn);
  next.hideTitles = Boolean(next.hideTitles);
  next.finalized = Boolean(next.finalized);
  next.initialized = Boolean(next.initialized);

  return next;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return clone(DEFAULT_STATE);
    }

    return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.warn("Impossible de charger l'état sauvegardé.", error);
    return clone(DEFAULT_STATE);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Impossible de sauvegarder l'état.", error);
  }
}

function emit() {
  for (const listener of listeners) {
    listener(state);
  }
}

export function getState() {
  return state;
}

export function updateState(recipe, options = {}) {
  const draft = clone(state);

  if (typeof recipe === "function") {
    recipe(draft);
  } else if (recipe && typeof recipe === "object") {
    Object.assign(draft, recipe);
  }

  state = normalizeState(draft);

  if (options.persist !== false) {
    saveState();
  }

  if (options.emit !== false) {
    emit();
  }

  return state;
}

export function subscribe(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
