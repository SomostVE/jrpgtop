import {
  getActiveItems,
  getActiveLicense
} from "./data-loader.js";
import { getState, updateState } from "./state.js";
import { t } from "./i18n.js";
import { getRankedKeysForCurrentLicense } from "./render-grid.js";

const rankedGrid = document.getElementById("grid-ranked");
const unrankedGrid = document.getElementById("grid-unranked");
const app = document.getElementById("app");

let rankedSortable = null;
let unrankedSortable = null;

function getAvailableKeys() {
  return getActiveItems(getState()).map(item => item.key);
}

function applyRankInput(input) {
  const card = input.closest("[data-item-key]");
  if (!card) return;

  const state = getState();
  const license = getActiveLicense(state);
  if (!license) return;

  const itemKey = card.dataset.itemKey;
  const raw = String(input.value || "").replace(/[^\d]/g, "").slice(0, 3);
  const availableKeys = getAvailableKeys();

  if (!availableKeys.includes(itemKey)) return;

  updateState(draft => {
    const currentOrder = (draft.rankings[license.id] || []).filter(
      key => availableKeys.includes(key) && key !== itemKey
    );

    if (!raw) {
      draft.rankings[license.id] = currentOrder;
      draft.finalized = false;
      return;
    }

    const requestedRank = Math.max(1, Number.parseInt(raw, 10) || 1);
    const index = Math.min(requestedRank - 1, currentOrder.length);

    currentOrder.splice(index, 0, itemKey);

    draft.rankings[license.id] = currentOrder;
    draft.finalized = false;
  });
}

function syncOrderFromDom() {
  const state = getState();
  const license = getActiveLicense(state);
  if (!license) return;

  const available = new Set(getAvailableKeys());

  const rankedKeys = [...rankedGrid.children]
    .map(card => card.dataset.itemKey)
    .filter(key => available.has(key));

  updateState(draft => {
    draft.rankings[license.id] = rankedKeys;
    draft.finalized = false;
  });
}

export function refreshSortable() {
  rankedSortable?.destroy();
  unrankedSortable?.destroy();

  rankedSortable = null;
  unrankedSortable = null;

  if (!window.Sortable || !app.classList.contains("visible")) {
    return;
  }

  const group = {
    name: "jrpgtop-ranking",
    pull: true,
    put: true
  };

  const options = {
    group,
    animation: 160,
    filter: "input, button, select, textarea",
    preventOnFilter: false,
    chosenClass: "chosen",
    ghostClass: "ghost",
    onEnd: () => {
      window.setTimeout(syncOrderFromDom, 0);
    }
  };

  rankedSortable = new Sortable(rankedGrid, options);
  unrankedSortable = new Sortable(unrankedGrid, options);
}

export function toggleFinalize() {
  const state = getState();

  if (state.finalized) {
    updateState(draft => {
      draft.finalized = false;
    });

    return;
  }

  if (getRankedKeysForCurrentLicense().length === 0) {
    window.alert(t("emptyTop"));
    return;
  }

  if (!window.confirm(t("confirmFinalize"))) {
    return;
  }

  updateState(draft => {
    draft.finalized = true;
  });
}

export function initRanking() {
  app.addEventListener("focusout", event => {
    if (event.target.matches(".rank-input")) {
      applyRankInput(event.target);
    }
  });

  app.addEventListener("keydown", event => {
    if (!event.target.matches(".rank-input")) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      applyRankInput(event.target);
      event.target.blur();
    }
  });
}
