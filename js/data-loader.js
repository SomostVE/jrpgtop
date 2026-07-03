const DATA_URL = new URL("../data/games.json", import.meta.url);

export const SCOPE_ALL_LICENSES = "all-licenses";
export const SCOPE_ALL_GAMES = "all-games";

const GLOBAL_THEME_SEPARATOR = "::";

export function makeGlobalThemeKey(licenseId, themeId) {
  return `${licenseId}${GLOBAL_THEME_SEPARATOR}${themeId}`;
}

let catalog = null;
let allItems = [];
let licenseItems = [];
let itemByKey = new Map();
let licenseById = new Map();

async function fetchJson(url, label) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Impossible de charger ${label} (${response.status}).`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(
      `Le fichier ${label} ne contient pas un JSON valide : ${error.message}`
    );
  }
}

function normalizeLicenseFile(data, label) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.licenses)) return data.licenses;
  if (data && typeof data === "object" && data.id) return [data];

  throw new Error(`Le fichier ${label} ne contient pas de licence valide.`);
}

async function resolveCatalog(manifest) {
  // Compatibilité avec l'ancien fichier monolithique.
  if (Array.isArray(manifest?.licenses)) return manifest;

  if (!Array.isArray(manifest?.licenseFiles)) {
    throw new Error("data/games.json doit contenir licenses ou licenseFiles.");
  }

  const groups = await Promise.all(
    manifest.licenseFiles.map(async entry => {
      const relativePath = typeof entry === "string" ? entry : entry?.file;

      if (!relativePath) {
        throw new Error(
          "Une entrée de licenseFiles ne contient pas de chemin valide."
        );
      }

      const data = await fetchJson(
        new URL(relativePath, DATA_URL),
        `data/${relativePath}`
      );

      return normalizeLicenseFile(data, `data/${relativePath}`);
    })
  );

  const licenses = groups.flat();
  const seenIds = new Set();

  for (const license of licenses) {
    if (!license?.id || !license?.name) {
      throw new Error("Chaque licence doit contenir au minimum id et name.");
    }

    if (seenIds.has(license.id)) {
      throw new Error(
        `L'identifiant de licence "${license.id}" est présent plusieurs fois.`
      );
    }

    seenIds.add(license.id);
  }

  return {
    version: manifest.version ?? 2,
    app: manifest.app ?? {},
    licenses
  };
}

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
          : [{
              id: "default",
              label: "",
              title: game.title,
              cover: game.cover,
              logo: game.logo,
              defaultRank: game.defaultRank
            }];

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
          themeId:
            variant.theme ||
            game.theme ||
            license.defaultTheme ||
            "",
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
  const manifest = await fetchJson(DATA_URL, "data/games.json");
  const data = await resolveCatalog(manifest);

  if (!data || !Array.isArray(data.licenses)) {
    throw new Error("Le catalogue chargé n'a pas le format attendu.");
  }

  catalog = data;
  buildIndexes(data);
  return data;
}

export function getCatalog() {
  if (!catalog) throw new Error("Le catalogue n'est pas encore chargé.");
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

export function getAllThemes() {
  return getCatalog().licenses.flatMap(license =>
    (license.themes || []).map(theme => ({
      ...theme,
      licenseId: license.id,
      licenseName: license.name,
      globalKey: makeGlobalThemeKey(license.id, theme.id)
    }))
  );
}

function getGlobalTheme(selection) {
  return getAllThemes().find(theme => theme.globalKey === selection) || null;
}

export function isGlobalRankingScope(scopeId) {
  return scopeId === SCOPE_ALL_LICENSES || scopeId === SCOPE_ALL_GAMES;
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
    const selectedTheme =
      getGlobalTheme(state.selectedThemeByLicense[state.rankingScope]) ||
      getAllThemes()[0] ||
      null;

    if (selectedTheme) {
      const license = getLicenseById(selectedTheme.licenseId);

      return {
        id: selectedTheme.globalKey,
        name: `${selectedTheme.licenseName} — ${selectedTheme.name}`,
        background:
          selectedTheme.background ||
          license?.background ||
          data.app?.defaultBackground ||
          "",
        accent:
          selectedTheme.accent ||
          license?.accent ||
          data.app?.defaultAccent ||
          "#ffd369",
        accentStrong:
          selectedTheme.accentStrong ||
          license?.accentStrong ||
          data.app?.defaultAccentStrong ||
          "#ffb347"
      };
    }

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
