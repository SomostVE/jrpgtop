import {
  getAllItems,
  getCatalog,
  getItemsForGame,
  getLicenseById
} from "./data-loader.js";
import { getState, updateState } from "./state.js";
import { t } from "./i18n.js";

const listRoot = document.getElementById("licence-list");
const detailRoot = document.getElementById("licence-detail");
const searchInput = document.getElementById("licence-search");
const panel = document.getElementById("right-panel");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function selectedCountForLicense(licenseId, selectedSet) {
  return getAllItems().filter(
    item => item.licenseId === licenseId && selectedSet.has(item.key)
  ).length;
}

function renderLicenseList(state) {
  const catalog = getCatalog();
  const selectedSet = new Set(state.selectedItems);

  listRoot.innerHTML = catalog.licenses
    .map((license, index) => {
      const count = selectedCountForLicense(license.id, selectedSet);
      const total = getAllItems().filter(
        item => item.licenseId === license.id
      ).length;

      return `
        <button
          class="licence-entry ${state.activeLicenseId === license.id ? "active" : ""}"
          type="button"
          data-license-id="${escapeHtml(license.id)}"
          style="
            --entry-accent:${escapeHtml(license.accent || "#d83d91")};
            --entry-offset:${Math.min(index * 5, 25)}px;
          "
        >
          <img
            class="licence-entry-image"
            crossorigin="anonymous"
            referrerpolicy="no-referrer"
            src="${escapeHtml(license.menuImage || license.background || "")}"
            alt=""
          />

          <span class="licence-entry-text">
            <span class="licence-entry-name">${escapeHtml(license.name)}</span>
            <span class="licence-entry-count">${count}/${total}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderThemes(license, state) {
  if (!Array.isArray(license.themes) || license.themes.length === 0) {
    return "";
  }

  const activeTheme =
    state.selectedThemeByLicense[license.id] ||
    license.defaultTheme ||
    license.themes[0].id;

  return `
    <div class="detail-section-title">${escapeHtml(t("themes"))}</div>

    <div class="theme-list">
      ${license.themes
        .map(
          theme => `
            <button
              class="theme-chip ${activeTheme === theme.id ? "active" : ""}"
              type="button"
              data-theme-id="${escapeHtml(theme.id)}"
            >
              ${escapeHtml(theme.name)}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderGame(game, license, selectedSet, search) {
  const items = getItemsForGame(license.id, game.id);

  const searchable = [
    game.title,
    ...items.map(item => `${item.title} ${item.variantLabel}`)
  ]
    .join(" ")
    .toLowerCase();

  if (search && !searchable.includes(search)) {
    return "";
  }

  const previewItem = items[0];

  return `
    <article class="game-entry">
      <img
        class="game-entry-cover"
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
        src="${escapeHtml(previewItem?.cover || game.cover || "")}"
        alt=""
      />

      <div class="game-entry-main">
        <div class="game-entry-title">${escapeHtml(game.title)}</div>

        <div class="variant-list">
          ${items
            .map(
              item => `
                <button
                  class="variant-chip ${selectedSet.has(item.key) ? "selected" : ""}"
                  type="button"
                  data-item-key="${escapeHtml(item.key)}"
                  aria-pressed="${selectedSet.has(item.key)}"
                >
                  ${escapeHtml(item.variantLabel || item.title)}
                </button>
              `
            )
            .join("")}
        </div>
      </div>
    </article>
  `;
}

function renderLicenseDetail(state) {
  const license =
    getLicenseById(state.activeLicenseId) ||
    getCatalog().licenses[0] ||
    null;

  if (!license) {
    detailRoot.innerHTML = "";
    return;
  }

  const selectedSet = new Set(state.selectedItems);
  const search = state.search.trim().toLowerCase();

  const gamesHtml = (license.games || [])
    .map(game => renderGame(game, license, selectedSet, search))
    .filter(Boolean)
    .join("");

  detailRoot.innerHTML = `
    <div class="licence-detail-header">
      <h3 class="licence-detail-title">${escapeHtml(license.name)}</h3>

      <div class="licence-detail-actions">
        <button class="tiny-button" type="button" data-action="select-license">
          ${escapeHtml(t("selectAll"))}
        </button>

        <button class="tiny-button" type="button" data-action="clear-license">
          ${escapeHtml(t("clearLicense"))}
        </button>
      </div>
    </div>

    ${renderThemes(license, state)}

    <div class="detail-section-title">${escapeHtml(t("games"))}</div>

    <div class="game-list">
      ${gamesHtml || `<div class="no-results">${escapeHtml(t("noResults"))}</div>`}
    </div>
  `;
}

export function renderLicenseMenu() {
  const state = getState();

  if (searchInput.value !== state.search) {
    searchInput.value = state.search;
  }

  renderLicenseList(state);
  renderLicenseDetail(state);
}

function toggleItem(itemKey) {
  updateState(draft => {
    const selected = new Set(draft.selectedItems);

    if (selected.has(itemKey)) {
      selected.delete(itemKey);

      for (const scope of Object.keys(draft.rankings)) {
        draft.rankings[scope] =
          draft.rankings[scope]?.filter(key => key !== itemKey) || [];
      }
    } else {
      selected.add(itemKey);
    }

    draft.selectedItems = [...selected];
    draft.finalized = false;
  });
}

function selectWholeLicense(licenseId) {
  const keys = getAllItems()
    .filter(item => item.licenseId === licenseId)
    .map(item => item.key);

  updateState(draft => {
    draft.selectedItems = [
      ...new Set([...draft.selectedItems, ...keys])
    ];
    draft.finalized = false;
  });
}

function clearWholeLicense(licenseId) {
  const keys = new Set(
    getAllItems()
      .filter(item => item.licenseId === licenseId)
      .map(item => item.key)
  );

  updateState(draft => {
    draft.selectedItems = draft.selectedItems.filter(
      key => !keys.has(key)
    );

    for (const scope of Object.keys(draft.rankings)) {
      draft.rankings[scope] =
        draft.rankings[scope]?.filter(key => !keys.has(key)) || [];
    }

    draft.finalized = false;
  });
}

export function initLicenseMenu() {
  searchInput.addEventListener("input", () => {
    updateState(draft => {
      draft.search = searchInput.value;
    });
  });

  panel.addEventListener("click", event => {
    const licenseButton = event.target.closest("[data-license-id]");

    if (licenseButton) {
      updateState(draft => {
        draft.activeLicenseId = licenseButton.dataset.licenseId;
        draft.search = "";
      });

      return;
    }

    const itemButton = event.target.closest("[data-item-key]");

    if (itemButton) {
      toggleItem(itemButton.dataset.itemKey);
      return;
    }

    const themeButton = event.target.closest("[data-theme-id]");

    if (themeButton) {
      const state = getState();

      updateState(draft => {
        draft.selectedThemeByLicense[state.activeLicenseId] =
          themeButton.dataset.themeId;
      });

      return;
    }

    const actionButton = event.target.closest("[data-action]");

    if (!actionButton) return;

    const state = getState();

    if (actionButton.dataset.action === "select-license") {
      selectWholeLicense(state.activeLicenseId);
    }

    if (actionButton.dataset.action === "clear-license") {
      clearWholeLicense(state.activeLicenseId);
    }
  });
}
