import {
  getActiveItems,
  getActiveTheme,
  getCatalog,
  getItemByKey,
  getLicenseById,
  SCOPE_ALL_GAMES,
  SCOPE_ALL_LICENSES
} from "./data-loader.js";
import { getState } from "./state.js";
import { t } from "./i18n.js";

const rankedGrid = document.getElementById("grid-ranked");
const unrankedGrid = document.getElementById("grid-unranked");
const app = document.getElementById("app");
const scopeTitle = document.getElementById("scope-title");
const rankingSummary = document.getElementById("ranking-summary");
const backgroundImage = document.getElementById("background-image");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cardHtml(item, rank) {
  const title = escapeHtml(item.title);
  const variant = escapeHtml(item.variantLabel);
  const cover = escapeHtml(item.cover);
  const logo = escapeHtml(item.logo);

  return `
    <article
      class="card ${rank ? "ranked" : ""}"
      data-item-key="${escapeHtml(item.key)}"
      data-rank="${rank || ""}"
    >
      <div class="rank-badge">
        <input
          class="rank-input"
          type="text"
          inputmode="numeric"
          maxlength="3"
          value="${rank || ""}"
          aria-label="Rank"
        />
      </div>

      <div class="info-bar">
        <div class="info-text">
          <div class="title">${title}</div>
          ${variant ? `<span class="variant-name">${variant}</span>` : ""}
        </div>
      </div>

      <div class="view-normal">
        <div class="cover">
          <img
            class="cover-blur"
            crossorigin="anonymous"
            referrerpolicy="no-referrer"
            src="${cover}"
            alt=""
          />
          <img
            class="cover-img"
            crossorigin="anonymous"
            referrerpolicy="no-referrer"
            src="${cover}"
            alt="${title}"
          />
          <div class="no-cover">${escapeHtml(t("noCover"))}</div>
        </div>
      </div>

      <div class="view-spoiler">
        <div class="spoiler-surface"></div>
        <div class="spoiler-inner">
          <img
            class="logo-img"
            crossorigin="anonymous"
            referrerpolicy="no-referrer"
            src="${logo}"
            alt="${title}"
          />
        </div>
      </div>
    </article>
  `;
}

function bindImageFallbacks(root) {
  root.querySelectorAll(".cover-img").forEach(image => {
    image.addEventListener(
      "error",
      () => {
        const cover = image.closest(".cover");
        if (!cover) return;

        const blur = cover.querySelector(".cover-blur");
        const noCover = cover.querySelector(".no-cover");

        image.style.display = "none";
        if (blur) blur.style.display = "none";
        if (noCover) noCover.style.display = "grid";
      },
      { once: true }
    );
  });

  root.querySelectorAll(".cover-blur").forEach(image => {
    image.addEventListener(
      "error",
      () => {
        image.style.display = "none";
      },
      { once: true }
    );
  });

  root.querySelectorAll(".logo-img").forEach(image => {
    image.addEventListener(
      "error",
      () => {
        image.style.display = "none";
      },
      { once: true }
    );
  });
}

export function getCurrentScopeTitle() {
  const state = getState();

  if (state.rankingScope === SCOPE_ALL_LICENSES) {
    return t("allLicenses");
  }

  if (state.rankingScope === SCOPE_ALL_GAMES) {
    return t("allGames");
  }

  return getLicenseById(state.rankingScope)?.name || "JRPGTop";
}

export function getRankedKeysForCurrentScope() {
  const state = getState();
  const available = new Set(getActiveItems(state).map(item => item.key));
  const order = state.rankings[state.rankingScope] || [];

  return order.filter(key => available.has(key));
}

export function getRankedItemsForCurrentScope() {
  return getRankedKeysForCurrentScope()
    .map(key => getItemByKey(key))
    .filter(Boolean);
}

// Alias conservés pour les anciens imports.
export const getRankedKeysForCurrentLicense =
  getRankedKeysForCurrentScope;

export const getRankedItemsForCurrentLicense =
  getRankedItemsForCurrentScope;

export function renderGrid() {
  const state = getState();
  const items = getActiveItems(state);
  const itemMap = new Map(items.map(item => [item.key, item]));

  const rankedKeys = getRankedKeysForCurrentScope();
  const rankedSet = new Set(rankedKeys);

  const rankedItems = rankedKeys
    .map(key => itemMap.get(key))
    .filter(Boolean);

  const unrankedItems = items.filter(item => !rankedSet.has(item.key));

  rankedGrid.innerHTML = rankedItems
    .map((item, index) => cardHtml(item, index + 1))
    .join("");

  unrankedGrid.innerHTML = state.finalized
    ? ""
    : unrankedItems.map(item => cardHtml(item, null)).join("");

  bindImageFallbacks(rankedGrid);
  bindImageFallbacks(unrankedGrid);

  const theme = getActiveTheme(state);

  backgroundImage.src =
    theme.background ||
    getCatalog().app?.defaultBackground ||
    "";

  document.documentElement.style.setProperty(
    "--accent",
    theme.accent
  );

  document.documentElement.style.setProperty(
    "--accent-strong",
    theme.accentStrong
  );

  document.body.classList.toggle("spoiler-on", state.spoilerOn);
  document.body.classList.toggle(
    "hide-titles",
    state.hideTitles && !state.spoilerOn
  );

  app.classList.toggle("unranked-empty", unrankedItems.length === 0);
  app.classList.toggle("finalized", state.finalized);

  scopeTitle.textContent = getCurrentScopeTitle();

  rankingSummary.textContent = t("rankedCount", {
    ranked: rankedItems.length,
    total: items.length
  });
}
