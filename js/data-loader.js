const DATA_URL = new URL("../data/games.json", import.meta.url);

export const SCOPE_ALL_LICENSES = "all-licenses";
export const SCOPE_ALL_GAMES = "all-games";

let catalog = null;
let allItems = [];
let licenseItems = [];
let itemByKey = new Map();
let licenseById = new Map();

function buildIndexes(data) {
  allItems = [];
  licenseItems = [];
  itemByKey = new Map();
  licenseById = new Map();

  for (const license of data.licenses) {
    licenseById.set(license.id, license);

    const licenseItem = {
      key: `license:${license.id}`,
      licenseId: license.id,
      licenseName: license.name,
      gameId: "",
      gameTitle: license.name,
      title: license.name,
      variantId: "",
      variantLabel: "",
      type: "license",
      themeId: license.defaultTheme || "",
      cover:
        license.rankingCover ||
        license.menuImage ||
        license.background ||
        data.app?.defaultBackground ||
        "",
      logo:
        license.rankingLogo ||
        license.logo ||
        license.menuImage ||
        "",
      defaultRank: null
    };

    licenseItems.push(licenseItem);
    itemByKey.set(licenseItem.key, licenseItem);

    for (const game of license.games ?? []) {
      const variants =
        Array.isArray(game.variants) && game.variants.length > 0
          ? game.variants
          : [
              {
                id: "default",
                label: "",
                title: game.title,
                cover: game.cover,
                logo: game.logo,
                defaultRank: game.defaultRank
              }
            ];

      for (const variant of variants) {
        const key = `${license.id}:${game.id}:${variant.id}`;

        const item = {
          key,
          licenseId: license.id,
          licenseName: license.name,
          gameId: game.id,
          gameTitle: game.title,
          title: variant.title || game.title,
          variantId: variant.id,
          variantLabel: variant.label || "",
          type: variant.type || "default",
          themeId: variant.theme || game.theme || license.defaultTheme || "",
          cover: variant.cover || game.cover || "",
          logo: variant.logo || game.logo || license.logo || "",
          defaultRank:
            Number.isFinite(Number(variant.defaultRank))
              ? Number(variant.defaultRank)
              : Number.isFinite(Number(game.defaultRank))
                ? Number(game.defaultRank)
                : null
        };

        allItems.push(item);
        itemByKey.set(key, item);
      }
    }
  }
}

export async function loadCatalog() {
  const response = await fetch(DATA_URL, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `Impossible de charger data/games.json (${response.status}).`
    );
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.licenses)) {
    throw new Error("Le fichier data/games.json n'a pas le format attendu.");
  }

  catalog = data;
  buildIndexes(data);

  return data;
}

export function getCatalog() {
  if (!catalog) {
    throw new Error("Le catalogue n'est pas encore chargé.");
  }

  return catalog;
}

export function getAllItems() {
  return allItems;
}

export function getLicenseRankingItems() {
  return licenseItems;
}

export function getItemByKey(key) {
  return itemByKey.get(key) || null;
}

export function getLicenseById(id) {
  return licenseById.get(id) || null;
}

export function getItemsForLicense(licenseId) {
  return allItems.filter(item => item.licenseId === licenseId);
}

export function isGlobalRankingScope(scopeId) {
  return (
    scopeId === SCOPE_ALL_LICENSES ||
    scopeId === SCOPE_ALL_GAMES
  );
}

export function getActiveLicense(state) {
  return (
    getLicenseById(state.activeLicenseId) ||
    getCatalog().licenses[0] ||
    null
  );
}

export function getScopeItems(state) {
  if (state.rankingScope === SCOPE_ALL_LICENSES) {
    return getLicenseRankingItems();
  }

  if (state.rankingScope === SCOPE_ALL_GAMES) {
    return getAllItems();
  }

  const license = getLicenseById(state.rankingScope);

  return license ? getItemsForLicense(license.id) : [];
}

// Conservé pour éviter de casser les autres modules.
export function getActiveItems(state) {
  return getScopeItems(state);
}

export function getActiveTheme(state) {
  const data = getCatalog();

  if (isGlobalRankingScope(state.rankingScope)) {
    return {
      id: "global",
      name: "JRPGTop",
      background: data.app?.defaultBackground || "",
      accent: data.app?.defaultAccent || "#ffd369",
      accentStrong: data.app?.defaultAccentStrong || "#ffb347"
    };
  }

  const license =
    getLicenseById(state.rankingScope) ||
    getActiveLicense(state);

  if (!license) {
    return {
      id: "default",
      name: "Default",
      background: data.app?.defaultBackground || "",
      accent: data.app?.defaultAccent || "#ffd369",
      accentStrong: data.app?.defaultAccentStrong || "#ffb347"
    };
  }

  const selectedThemeId =
    state.selectedThemeByLicense[license.id] ||
    license.defaultTheme ||
    license.themes?.[0]?.id;

  const theme =
    license.themes?.find(entry => entry.id === selectedThemeId) ||
    license.themes?.[0] ||
    {};

  return {
    id: theme.id || "default",
    name: theme.name || license.name,
    background:
      theme.background ||
      license.background ||
      data.app?.defaultBackground ||
      "",
    accent:
      theme.accent ||
      license.accent ||
      data.app?.defaultAccent ||
      "#ffd369",
    accentStrong:
      theme.accentStrong ||
      license.accentStrong ||
      data.app?.defaultAccentStrong ||
      "#ffb347"
  };
}
