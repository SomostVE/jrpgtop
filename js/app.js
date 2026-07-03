import {
  getActiveLicense,
  getAllItems,
  getCatalog,
  getItemsForLicense,
  loadCatalog
} from "./data-loader.js";
import { applyTranslations, setLanguage, t } from "./i18n.js";
import { closePreview, exportTop, openPreview } from "./export.js";
import { closeGuide, initGuide, openGuide } from "./guide.js";
import { initLicenseMenu, renderLicenseMenu } from "./render-licence-menu.js";
import { renderGrid } from "./render-grid.js";
import { initRanking, refreshSortable, toggleFinalize } from "./ranking.js";
import { getState, subscribe, updateState } from "./state.js";

const configScreen = document.getElementById("config-screen");
const configStart = document.getElementById("config-start");
const configSpoiler = document.getElementById("config-spoiler");
const configHideTitles = document.getElementById("config-hide-titles");
const configHideTitlesRow = document.getElementById("config-hide-titles-row");

const app = document.getElementById("app");

const leftMenu = document.getElementById("left-menu");
const leftHandle = document.getElementById("left-handle");

const rightMenu = document.getElementById("right-menu");
const rightHandle = document.getElementById("right-handle");
const rightClose = document.getElementById("right-close");
const rightBackdrop = document.getElementById("licence-drawer-backdrop");
const licenceDrawer = document.getElementById("licence-drawer");

const sideLanguage = document.getElementById("side-language");
const sideSpoiler = document.getElementById("side-spoiler");
const sideHideTitles = document.getElementById("side-hide-titles");
const sideHideTitlesRow = document.getElementById("side-hide-titles-row");
const themeSelect = document.getElementById("theme-select");

const finalizeButton = document.getElementById("btn-finalize");
const previewButton = document.getElementById("btn-preview");
const guideButton = document.getElementById("btn-guide");
const exportButton = document.getElementById("btn-export");

const previewModal = document.getElementById("preview-modal");
const fatalError = document.getElementById("fatal-error");

let started = false;

function getConfigLanguage() {
  return (
    document.querySelector('input[name="config-language"]:checked')?.value ||
    "fr"
  );
}

function syncHideTitleAvailability(spoilerOn, source = "side") {
  const disabled = Boolean(spoilerOn);

  configHideTitles.disabled = disabled;
  sideHideTitles.disabled = disabled;

  configHideTitlesRow.classList.toggle("disabled-row", disabled);
  sideHideTitlesRow.classList.toggle("disabled-row", disabled);

  if (disabled) {
    configHideTitles.checked = false;
    sideHideTitles.checked = false;

    if (source === "side") {
      updateState(draft => {
        draft.hideTitles = false;
      });
    }
  }
}

function initializeDefaults() {
  const catalog = getCatalog();
  const validLicenseIds = new Set(catalog.licenses.map(license => license.id));
  const validItemKeys = new Set(getAllItems().map(item => item.key));

  updateState(
    draft => {
      if (!validLicenseIds.has(draft.activeLicenseId)) {
        draft.activeLicenseId = catalog.licenses[0]?.id || "";
      }

      for (const license of catalog.licenses) {
        const available = new Set(
          getItemsForLicense(license.id).map(item => item.key)
        );

        draft.rankings[license.id] = (
          draft.rankings[license.id] || []
        ).filter(key => available.has(key) && validItemKeys.has(key));

        const initialTheme =
          license.defaultTheme || license.themes?.[0]?.id;

        if (
          initialTheme &&
          !draft.selectedThemeByLicense[license.id]
        ) {
          draft.selectedThemeByLicense[license.id] = initialTheme;
        }
      }

      if (!draft.initialized) {
        for (const license of catalog.licenses) {
          const defaultOrder = getItemsForLicense(license.id)
            .filter(item => Number.isFinite(item.defaultRank))
            .sort((a, b) => a.defaultRank - b.defaultRank)
            .map(item => item.key);

          draft.rankings[license.id] = defaultOrder;
        }

        draft.initialized = true;
      }
    },
    {
      emit: false
    }
  );
}

function populateThemeSelect() {
  const state = getState();
  const license = getActiveLicense(state);
  const themes = license?.themes || [];

  themeSelect.innerHTML = themes
    .map(
      theme => `
        <option value="${theme.id}">${theme.name}</option>
      `
    )
    .join("");

  const selectedTheme =
    state.selectedThemeByLicense[license?.id] ||
    license?.defaultTheme ||
    themes[0]?.id ||
    "";

  themeSelect.value = selectedTheme;
  themeSelect.disabled = themes.length <= 1;
}

function syncControls() {
  const state = getState();

  sideLanguage.value = state.lang;
  sideSpoiler.checked = state.spoilerOn;
  sideHideTitles.checked = state.hideTitles;

  finalizeButton.textContent = state.finalized
    ? t("editTop")
    : t("finalizeTop");

  syncHideTitleAvailability(state.spoilerOn, "render");
  populateThemeSelect();
}

function renderAll() {
  const state = getState();

  setLanguage(state.lang);
  applyTranslations();
  renderGrid();
  renderLicenseMenu();
  syncControls();

  window.requestAnimationFrame(refreshSortable);
}

function showApp() {
  started = true;

  configScreen.hidden = true;
  app.classList.add("visible");
  app.setAttribute("aria-hidden", "false");
  document.body.classList.add("app-started");

  renderAll();
}

function openLicenseDrawer() {
  rightMenu.classList.add("open");
  licenceDrawer.setAttribute("aria-hidden", "false");
  leftMenu.classList.remove("open");
}

function closeLicenseDrawer() {
  rightMenu.classList.remove("open");
  licenceDrawer.setAttribute("aria-hidden", "true");
}

function bindConfiguration() {
  document
    .querySelectorAll('input[name="config-language"]')
    .forEach(input => {
      input.addEventListener("change", () => {
        setLanguage(getConfigLanguage());
        applyTranslations();
      });
    });

  configSpoiler.addEventListener("change", () => {
    syncHideTitleAvailability(configSpoiler.checked, "config");
  });

  configStart.addEventListener("click", () => {
    updateState(
      draft => {
        draft.lang = getConfigLanguage();
        draft.spoilerOn = configSpoiler.checked;
        draft.hideTitles =
          !configSpoiler.checked && configHideTitles.checked;
      },
      {
        emit: false
      }
    );

    showApp();
  });
}

function bindPanels() {
  leftHandle.addEventListener("click", () => {
    leftMenu.classList.toggle("open");
    closeLicenseDrawer();
  });

  rightHandle.addEventListener("click", openLicenseDrawer);
  rightClose.addEventListener("click", closeLicenseDrawer);
  rightBackdrop.addEventListener("click", closeLicenseDrawer);

  document.addEventListener("pointerdown", event => {
    if (
      leftMenu.classList.contains("open") &&
      !leftMenu.contains(event.target)
    ) {
      leftMenu.classList.remove("open");
    }
  });
}

function bindSideControls() {
  sideLanguage.addEventListener("change", () => {
    updateState(draft => {
      draft.lang = sideLanguage.value;
    });
  });

  themeSelect.addEventListener("change", () => {
    const license = getActiveLicense(getState());
    if (!license) return;

    updateState(draft => {
      draft.selectedThemeByLicense[license.id] = themeSelect.value;
    });
  });

  sideSpoiler.addEventListener("change", () => {
    updateState(draft => {
      draft.spoilerOn = sideSpoiler.checked;

      if (draft.spoilerOn) {
        draft.hideTitles = false;
      }
    });
  });

  sideHideTitles.addEventListener("change", () => {
    if (sideHideTitles.disabled) return;

    updateState(draft => {
      draft.hideTitles = sideHideTitles.checked;
    });
  });

  finalizeButton.addEventListener("click", () => {
    toggleFinalize();
    leftMenu.classList.remove("open");
    closeLicenseDrawer();
  });

  previewButton.addEventListener("click", () => {
    leftMenu.classList.remove("open");
    openPreview();
  });

  guideButton.addEventListener("click", () => {
    leftMenu.classList.remove("open");
    openGuide();
  });

  exportButton.addEventListener("click", async () => {
    leftMenu.classList.remove("open");
    await exportTop();
  });

  document
    .querySelectorAll('[data-close-modal="preview"]')
    .forEach(element => {
      element.addEventListener("click", closePreview);
    });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    leftMenu.classList.remove("open");
    closeLicenseDrawer();

    if (!previewModal.hidden) {
      closePreview();
    }

    closeGuide();
  });
}

function showFatalError(error) {
  console.error(error);

  configScreen.hidden = true;
  fatalError.hidden = false;
  fatalError.textContent = `${t("loadingError")}\n\n${error.message}`;
}

async function initialize() {
  try {
    await loadCatalog();
    initializeDefaults();

    const state = getState();

    document
      .querySelectorAll('input[name="config-language"]')
      .forEach(input => {
        input.checked = input.value === state.lang;
      });

    configSpoiler.checked = state.spoilerOn;
    configHideTitles.checked = state.hideTitles;

    setLanguage(state.lang);
    applyTranslations();
    syncHideTitleAvailability(state.spoilerOn, "config");

    initLicenseMenu();
    initRanking();
    initGuide();

    bindConfiguration();
    bindPanels();
    bindSideControls();

    subscribe(() => {
      if (started) {
        renderAll();
      } else {
        const nextState = getState();
        setLanguage(nextState.lang);
        applyTranslations();
      }
    });
  } catch (error) {
    showFatalError(error);
  }
}

initialize();
