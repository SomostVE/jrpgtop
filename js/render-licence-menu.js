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
const licenceDrawer = document.getElementById("licence-drawer");
const searchInput = document.getElementById("licence-search");
const clearSearchButton = document.getElementById("licence-search-clear");

let searchQuery = "";
let drawerWasOpen = false;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

function syncSearchControls() {
  if (searchInput && searchInput.value !== searchQuery) {
    searchInput.value = searchQuery;
  }

  if (clearSearchButton) {
    clearSearchButton.hidden = searchQuery.length === 0;
  }
}

function scrollEntryToCenter(entry, behavior = "auto") {
  if (!entry || listRoot.clientHeight <= 0) {
    return;
  }

  const targetTop =
    entry.offsetTop -
    (listRoot.clientHeight - entry.offsetHeight) / 2;

  listRoot.scrollTo({
    top: Math.max(0, targetTop),
    behavior
  });
}

function centerCurrentEntry(behavior = "auto") {
  window.requestAnimationFrame(() => {
    const activeEntry =
      listRoot.querySelector(".licence-entry.active");

    if (activeEntry) {
      scrollEntryToCenter(activeEntry, behavior);
      return;
    }

    const firstResult =
      listRoot.querySelector("[data-license-id]");

    if (firstResult) {
      scrollEntryToCenter(firstResult, behavior);
    }
  });
}

function centerFirstSearchResult() {
  window.requestAnimationFrame(() => {
    const firstResult =
      listRoot.querySelector("[data-license-id]");

    if (firstResult) {
      scrollEntryToCenter(firstResult, "auto");
      return;
    }

    const emptyMessage =
      listRoot.querySelector(".licence-empty");

    if (emptyMessage) {
      scrollEntryToCenter(emptyMessage, "auto");
    }
  });
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
        <span class="licence-entry-name">
          ${escapeHtml(title)}
        </span>

        <span class="licence-entry-count">
          ${escapeHtml(subtitle)}
        </span>
      </span>
    </button>
  `;
}

function licenseEntry(license, index, state) {
  const count = getItemsForLicense(license.id).length;

  return `
    <button
      class="licence-entry ${
        state.rankingScope === license.id
          ? "active"
          : ""
      }"
      type="button"
      data-ranking-scope="${escapeHtml(license.id)}"
      data-license-id="${escapeHtml(license.id)}"
      style="
        --entry-accent:${escapeHtml(
          license.accent || "#d83d91"
        )};
        --entry-offset:${Math.min(
          (index + 2) * 9,
          45
        )}px;
      "
    >
      <img
        class="licence-entry-image"
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
        src="${escapeHtml(
          license.menuImage ||
          license.background ||
          ""
        )}"
        alt=""
      />

      <span class="licence-entry-text">
        <span class="licence-entry-name">
          ${escapeHtml(license.name)}
        </span>

        <span class="licence-entry-count">
          ${escapeHtml(t("gameCount", { count }))}
        </span>
      </span>
    </button>
  `;
}

export function renderLicenseMenu() {
  const state = getState();
  const catalog = getCatalog();
  const defaultImage =
    catalog.app?.defaultBackground || "";

  const globalEntries = [
    specialEntry({
      scopeId: SCOPE_ALL_LICENSES,
      title: t("allLicenses"),
      subtitle: t("licenseCount", {
        count: catalog.licenses.length
      }),
      image:
        catalog.app?.allLicensesMenuImage ||
        defaultImage,
      accent:
        catalog.app?.defaultAccent ||
        "#ffd369",
      active:
        state.rankingScope ===
        SCOPE_ALL_LICENSES,
      index: 0
    }),

    specialEntry({
      scopeId: SCOPE_ALL_GAMES,
      title: t("allGames"),
      subtitle: t("gameCount", {
        count: getAllItems().length
      }),
      image:
        catalog.app?.allGamesMenuImage ||
        defaultImage,
      accent:
        catalog.app?.defaultAccentStrong ||
        "#ffb347",
      active:
        state.rankingScope ===
        SCOPE_ALL_GAMES,
      index: 1
    })
  ].join("");

  const normalizedQuery =
    normalizeSearch(searchQuery);

  const filteredLicenses =
    normalizedQuery
      ? catalog.licenses.filter(license =>
          normalizeSearch(
            license.name
          ).includes(normalizedQuery)
        )
      : catalog.licenses;

  const licenseEntries =
    filteredLicenses
      .map((license, index) =>
        licenseEntry(license, index, state)
      )
      .join("");

  const emptyMessage =
    normalizedQuery &&
    filteredLicenses.length === 0
      ? `
        <div
          class="licence-empty"
          role="status"
        >
          <strong>
            ${escapeHtml(t("noLicenseFound"))}
          </strong>

          <span>
            ${escapeHtml(t("tryAnotherSearch"))}
          </span>
        </div>
      `
      : "";

  /*
   * Une seule liste continue :
   * les classements globaux puis les licences.
   */
  listRoot.innerHTML =
    globalEntries +
    licenseEntries +
    emptyMessage;

  syncSearchControls();
}

export function initLicenseMenu() {
  searchInput?.addEventListener("input", () => {
    searchQuery = searchInput.value;
    renderLicenseMenu();

    if (normalizeSearch(searchQuery)) {
      centerFirstSearchResult();
    } else {
      centerCurrentEntry();
    }
  });

  searchInput?.addEventListener(
    "keydown",
    event => {
      if (
        event.key !== "Escape" ||
        searchQuery.length === 0
      ) {
        return;
      }

      event.stopPropagation();

      searchQuery = "";
      renderLicenseMenu();
      centerCurrentEntry();
      searchInput.focus();
    }
  );

  clearSearchButton?.addEventListener(
    "click",
    () => {
      searchQuery = "";
      renderLicenseMenu();
      centerCurrentEntry();
      searchInput?.focus();
    }
  );

  listRoot.addEventListener(
    "click",
    event => {
      const button = event.target.closest(
        "[data-ranking-scope]"
      );

      if (!button) {
        return;
      }

      const scopeId =
        button.dataset.rankingScope;

      const licenseId =
        button.dataset.licenseId || "";

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

      searchQuery = "";
      syncSearchControls();

      rightMenu.classList.remove("open");
      licenceDrawer.setAttribute(
        "aria-hidden",
        "true"
      );
    }
  );

  /*
   * À chaque ouverture, l'entrée sélectionnée est
   * automatiquement replacée au milieu de la liste.
   */
  const drawerObserver =
    new MutationObserver(() => {
      const isOpen =
        rightMenu.classList.contains("open");

      if (isOpen && !drawerWasOpen) {
        if (normalizeSearch(searchQuery)) {
          centerFirstSearchResult();
        } else {
          centerCurrentEntry();
        }
      }

      drawerWasOpen = isOpen;
    });

  drawerObserver.observe(rightMenu, {
    attributes: true,
    attributeFilter: ["class"]
  });

  window.addEventListener("resize", () => {
    if (
      rightMenu.classList.contains("open")
    ) {
      centerCurrentEntry();
    }
  });
}
