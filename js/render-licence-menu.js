import {
  getCatalog,
  getItemsForLicense
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

export function renderLicenseMenu() {
  const state = getState();
  const catalog = getCatalog();

  listRoot.innerHTML = catalog.licenses
    .map((license, index) => {
      const count = getItemsForLicense(license.id).length;

      return `
        <button
          class="licence-entry ${state.activeLicenseId === license.id ? "active" : ""}"
          type="button"
          data-license-id="${escapeHtml(license.id)}"
          style="
            --entry-accent:${escapeHtml(license.accent || "#d83d91")};
            --entry-offset:${Math.min(index * 9, 45)}px;
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
}

export function initLicenseMenu() {
  listRoot.addEventListener("click", event => {
    const button = event.target.closest("[data-license-id]");

    if (!button) return;

    const licenseId = button.dataset.licenseId;

    updateState(draft => {
      draft.activeLicenseId = licenseId;
      draft.finalized = false;

      if (!draft.rankings[licenseId]) {
        draft.rankings[licenseId] = [];
      }
    });

    rightMenu.classList.remove("open");
    document
      .getElementById("licence-drawer")
      .setAttribute("aria-hidden", "true");
  });
}
