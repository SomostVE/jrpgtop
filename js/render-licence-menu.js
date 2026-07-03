import {
  getAllItems,
  getCatalog,
  getItemsForLicense,
  SCOPE_ALL_GAMES,
  SCOPE_ALL_LICENSES
} from "./data-loader.js";
import { getState, updateState } from "./state.js";
import { t } from "./i18n.js";

const listRoot = document.getElementById("licence-list");
const rightMenu = document.getElementById("right-menu");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function specialEntry({
  scopeId,
  title,
  subtitle,
  image,
  accent,
  active,
  index
}) {
  return `
    <button
      class="licence-entry ${active ? "active" : ""}"
      type="button"
      data-ranking-scope="${escapeHtml(scopeId)}"
      style="
        --entry-accent:${escapeHtml(accent)};
        --entry-offset:${Math.min(index * 9, 45)}px;
      "
    >
      <img
        class="licence-entry-image"
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
        src="${escapeHtml(image)}"
        alt=""
      />

      <span class="licence-entry-text">
        <span class="licence-entry-name">${escapeHtml(title)}</span>
        <span class="licence-entry-count">${escapeHtml(subtitle)}</span>
      </span>
    </button>
  `;
}

export function renderLicenseMenu() {
  const state = getState();
  const catalog = getCatalog();
  const defaultImage = catalog.app?.defaultBackground || "";

  const globalEntries = [
    specialEntry({
      scopeId: SCOPE_ALL_LICENSES,
      title: t("allLicenses"),
      subtitle: t("licenseCount", { count: catalog.licenses.length }),
      image: catalog.app?.allLicensesMenuImage || defaultImage,
      accent: catalog.app?.defaultAccent || "#ffd369",
      active: state.rankingScope === SCOPE_ALL_LICENSES,
      index: 0
    }),
    specialEntry({
      scopeId: SCOPE_ALL_GAMES,
      title: t("allGames"),
      subtitle: t("gameCount", { count: getAllItems().length }),
      image: catalog.app?.allGamesMenuImage || defaultImage,
      accent: catalog.app?.defaultAccentStrong || "#ffb347",
      active: state.rankingScope === SCOPE_ALL_GAMES,
      index: 1
    })
  ].join("");

  const licenseEntries = catalog.licenses
    .map((license, index) => {
      const count = getItemsForLicense(license.id).length;

      return `
        <button
          class="licence-entry ${state.rankingScope === license.id ? "active" : ""}"
          type="button"
          data-ranking-scope="${escapeHtml(license.id)}"
          data-license-id="${escapeHtml(license.id)}"
          style="
            --entry-accent:${escapeHtml(license.accent || "#d83d91")};
            --entry-offset:${Math.min((index + 2) * 9, 45)}px;
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
            <span class="licence-entry-count">
              ${escapeHtml(t("gameCount", { count }))}
            </span>
          </span>
        </button>
      `;
    })
    .join("");

  listRoot.innerHTML = globalEntries + licenseEntries;
}

export function initLicenseMenu() {
  listRoot.addEventListener("click", event => {
    const button = event.target.closest("[data-ranking-scope]");

    if (!button) return;

    const scopeId = button.dataset.rankingScope;
    const licenseId = button.dataset.licenseId || "";

    updateState(draft => {
      draft.rankingScope = scopeId;
      draft.finalized = false;

      if (licenseId) {
        draft.activeLicenseId = licenseId;
      }

      if (!draft.rankings[scopeId]) {
        draft.rankings[scopeId] = [];
      }
    });

    rightMenu.classList.remove("open");
    document
      .getElementById("licence-drawer")
      .setAttribute("aria-hidden", "true");
  });
}
