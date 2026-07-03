const DATA_URL = new URL("../data/games.json", import.meta.url);

let catalog = null;
let allItems = [];
let itemByKey = new Map();
let licenseById = new Map();

function buildIndexes(data) {
  allItems = [];
  itemByKey = new Map();
  licenseById = new Map();

  for (const license of data.licenses) {
    licenseById.set(license.id, license);

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
                defaultSelected: game.defaultSelected,
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
          defaultSelected: Boolean(
            variant.defaultSelected ?? game.defaultSelected
          ),
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

export function getItemByKey(key) {
  return itemByKey.get(key) || null;
}

export function getLicenseById(id) {
  return licenseById.get(id) || null;
}

export function getItemsForGame(licenseId, gameId) {
  return allItems.filter(
    item => item.licenseId === licenseId && item.gameId === gameId
  );
}

export function getSelectedItems(state) {
  const selected = new Set(state.selectedItems);

  return allItems.filter(item => selected.has(item.key));
}

export function getScopeItems(state) {
  const selectedItems = getSelectedItems(state);

  if (state.rankingScope === "all") {
    return selectedItems;
  }

  return selectedItems.filter(
    item => item.licenseId === state.rankingScope
  );
}

export function getActiveTheme(state) {
  const data = getCatalog();

  const preferredLicenseId =
    state.rankingScope !== "all"
      ? state.rankingScope
      : state.activeLicenseId;

  const license =
    getLicenseById(preferredLicenseId) ||
    data.licenses[0] ||
    null;

  if (!license) {
    return {
      id: "default",
      name: "Default",
      background: data.app?.defaultBackground || "",
      accent: data.app?.defaultAccent || "#ffd369"
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
