import {
  getActiveTheme,
  getCatalog,
  getItemByKey,
  getLicenseById,
  getScopeItems
} from "./data-loader.js";
import { getState } from "./state.js";
import { t } from "./i18n.js";

const rankedGrid = document.getElementById("grid-ranked");
const unrankedGrid = document.getElementById("grid-unranked");
const app = document.getElementById("app");
const scopeTitle = document.getElementById("scope-title");
const rankingSummary = document.getElementById("ranking-summary");
const backgroundImage = document.getElementById("background-image");
const exportStage = document.getElementById("export-stage");

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

function getScopeName(state) {
  if (state.rankingScope === "all") {
    return t("allGames");
  }

  return getLicenseById(state.rankingScope)?.name || state.rankingScope;
}

export function getRankedKeysForCurrentScope() {
  const state = getState();
  const available = new Set(getScopeItems(state).map(item => item.key));
  const order = state.rankings[state.rankingScope] || [];

  return order.filter(key => available.has(key));
}

export function getRankedItemsForCurrentScope() {
  return getRankedKeysForCurrentScope()
    .map(key => getItemByKey(key))
    .filter(Boolean);
}

export function renderGrid() {
  const state = getState();
  const scopeItems = getScopeItems(state);
  const scopeItemMap = new Map(scopeItems.map(item => [item.key, item]));

  const rankedKeys = getRankedKeysForCurrentScope();
  const rankedSet = new Set(rankedKeys);

  const rankedItems = rankedKeys
    .map(key => scopeItemMap.get(key))
    .filter(Boolean);

  const unrankedItems = scopeItems.filter(item => !rankedSet.has(item.key));

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

  document.documentElement.style.setProperty("--accent", theme.accent);
  document.documentElement.style.setProperty(
    "--accent-strong",
    theme.accentStrong
  );

  document.body.classList.toggle("spoiler-on", state.spoilerOn);
  document.body.classList.toggle(
    "hide-titles",
    state.hideTitles && !state.spoilerOn
  );

  app.classList.toggle("selection-empty", scopeItems.length === 0);
  app.classList.toggle("unranked-empty", unrankedItems.length === 0);
  app.classList.toggle("finalized", state.finalized);

  scopeTitle.textContent = getScopeName(state);

  rankingSummary.textContent =
    rankedItems.length > 0
      ? t("rankedCount", {
          ranked: rankedItems.length,
          selected: scopeItems.length
        })
      : t("selectedCount", {
          selected: scopeItems.length
        });

  renderExportScene();
}

function calculateExportLayout(count) {
  if (count <= 0) {
    return {
      columns: 1,
      cardWidth: 190,
      gap: 14
    };
  }

  const maxWidth = 1780;
  const maxHeight = 860;
  const gap = count > 35 ? 10 : 14;

  let best = null;

  for (let columns = 1; columns <= Math.min(12, count); columns += 1) {
    const rows = Math.ceil(count / columns);

    const widthLimited =
      (maxWidth - gap * (columns - 1)) / columns;

    const heightLimited =
      ((maxHeight - gap * (rows - 1)) / rows) * 0.75;

    const cardWidth = Math.floor(
      Math.min(widthLimited, heightLimited, 220)
    );

    if (cardWidth < 72) continue;

    const score = cardWidth - Math.abs(columns - rows * 1.6) * 0.5;

    if (!best || score > best.score) {
      best = {
        score,
        columns,
        cardWidth,
        gap
      };
    }
  }

  return (
    best || {
      columns: Math.min(12, count),
      cardWidth: 72,
      gap
    }
  );
}

function exportCardHtml(item, rank, state) {
  const title = escapeHtml(item.title);
  const variant = escapeHtml(item.variantLabel);
  const cover = escapeHtml(item.cover);
  const logo = escapeHtml(item.logo);

  if (state.spoilerOn) {
    return `
      <article class="export-card spoiler">
        <div class="export-card-rank">#${rank}</div>
        <div class="export-card-spoiler">
          <img
            crossorigin="anonymous"
            referrerpolicy="no-referrer"
            src="${logo}"
            alt="${title}"
          />
        </div>
      </article>
    `;
  }

  return `
    <article class="export-card">
      <div class="export-card-rank">#${rank}</div>

      <div class="cover">
        <img
          class="cover-img"
          crossorigin="anonymous"
          referrerpolicy="no-referrer"
          src="${cover}"
          alt="${title}"
        />
        <div class="no-cover">${escapeHtml(t("noCover"))}</div>
      </div>

      ${
        state.hideTitles
          ? ""
          : `
            <div class="export-card-title">
              ${title}
              ${variant ? `<span class="export-card-variant">${variant}</span>` : ""}
            </div>
          `
      }
    </article>
  `;
}

export function renderExportScene() {
  const state = getState();
  const theme = getActiveTheme(state);
  const rankedItems = getRankedItemsForCurrentScope();
  const layout = calculateExportLayout(rankedItems.length);

  const title = escapeHtml(getScopeName(state));
  const countText = escapeHtml(
    t("selectedCount", {
      selected: rankedItems.length
    })
  );

  exportStage.style.setProperty(
    "--export-accent",
    theme.accent || "#ffd369"
  );

  exportStage.innerHTML = `
    <div class="export-background">
      <img
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
        src="${escapeHtml(theme.background)}"
        alt=""
      />
    </div>

    <div class="export-overlay"></div>

    <div class="export-content">
      <header class="export-header">
        <div>
          <div class="export-brand">JRPGTop</div>
          <div class="export-title">${title}</div>
        </div>

        <div class="export-count">${countText}</div>
      </header>

      ${
        rankedItems.length > 0
          ? `
            <div
              class="export-grid"
              style="
                --export-columns:${layout.columns};
                --export-card-width:${layout.cardWidth}px;
                --export-gap:${layout.gap}px;
              "
            >
              ${rankedItems
                .map((item, index) =>
                  exportCardHtml(item, index + 1, state)
                )
                .join("")}
            </div>
          `
          : `<div class="export-empty">${escapeHtml(t("emptyTop"))}</div>`
      }
    </div>
  `;

  bindImageFallbacks(exportStage);
}
