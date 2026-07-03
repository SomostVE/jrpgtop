import {
  getLicenseById,
  SCOPE_ALL_GAMES,
  SCOPE_ALL_LICENSES
} from "./data-loader.js";
import { getState } from "./state.js";
import { t } from "./i18n.js";
import {
  getCurrentScopeTitle,
  getRankedItemsForCurrentScope
} from "./render-grid.js";

const exportStage = document.getElementById("export-stage");
const previewModal = document.getElementById("preview-modal");
const previewViewport = document.getElementById("preview-viewport");
const previewMount = document.getElementById("preview-mount");

let previewResizeHandler = null;

async function waitForImages(root) {
  const images = [...root.querySelectorAll("img")];

  await Promise.all(
    images.map(async image => {
      if (image.complete) {
        if (image.naturalWidth > 0 && image.decode) {
          try {
            await image.decode();
          } catch {}
        }

        return;
      }

      await new Promise(resolve => {
        const timeout = window.setTimeout(resolve, 5000);

        image.addEventListener(
          "load",
          () => {
            window.clearTimeout(timeout);
            resolve();
          },
          { once: true }
        );

        image.addEventListener(
          "error",
          () => {
            window.clearTimeout(timeout);
            resolve();
          },
          { once: true }
        );
      });
    })
  );
}

/**
 * Récupère la position et le style de chaque numéro avant la capture.
 * Les coordonnées sont calculées relativement à la scène 1920 × 1080.
 */
function getExportRankLabels() {
  const stageRect = exportStage.getBoundingClientRect();

  const accent =
    exportStage.style
      .getPropertyValue("--export-accent")
      .trim() || "#ffd369";

  return [...exportStage.querySelectorAll(".export-card-rank")].map(badge => {
    const rect = badge.getBoundingClientRect();

    return {
      text: badge.textContent.trim(),

      x:
        rect.left -
        stageRect.left +
        rect.width / 2,

      y:
        rect.top -
        stageRect.top +
        rect.height / 2 -
        1,

      color: accent,
      fontSize: 15,
      fontWeight: "900",
      fontFamily: '"Segoe UI", Arial, sans-serif'
    };
  });
}

/**
 * Redessine les numéros sur le Canvas après html2canvas.
 * Cela évite le mauvais alignement vertical produit par html2canvas.
 */
function drawRankLabels(canvas, labels) {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Impossible d'obtenir le contexte 2D du Canvas.");
  }

  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (const label of labels) {
    context.font =
      `${label.fontWeight} ${label.fontSize}px ${label.fontFamily}`;

    context.fillStyle = label.color;

    context.fillText(
      label.text,
      label.x,
      label.y
    );
  }

  context.restore();
}

async function captureExportCanvas() {
  if (!window.html2canvas) {
    throw new Error("html2canvas n'est pas chargé.");
  }

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  await waitForImages(exportStage);

  const rankLabels = getExportRankLabels();

  const canvas = await window.html2canvas(exportStage, {
    backgroundColor: "#070a1b",
    useCORS: true,
    allowTaint: false,
    logging: false,

    width: 1920,
    height: 1080,
    scale: 1,

    scrollX: 0,
    scrollY: 0,

    onclone: clonedDocument => {
      /*
       * On garde les capsules sombres, mais on masque leur texte
       * dans la copie utilisée par html2canvas.
       */
      clonedDocument
        .querySelectorAll(".export-card-rank-text")
        .forEach(label => {
          label.style.visibility = "hidden";
        });
    }
  });

  drawRankLabels(canvas, rankLabels);

  return canvas;
}

function getFileName() {
  const state = getState();

  let rawName = getCurrentScopeTitle();

  if (state.rankingScope === SCOPE_ALL_LICENSES) {
    rawName = t("allLicenses");
  } else if (state.rankingScope === SCOPE_ALL_GAMES) {
    rawName = t("allGames");
  } else {
    rawName =
      getLicenseById(state.rankingScope)?.name ||
      rawName;
  }

  const safeName = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `JRPGTop-${safeName || "Ranking"}.png`;
}

function fitPreview() {
  const stage = previewMount.firstElementChild;

  if (!stage) {
    return;
  }

  const width = previewViewport.clientWidth;
  const scale = width / 1920;

  previewViewport.style.height = `${1080 * scale}px`;
  stage.style.transform = `scale(${scale})`;
}

export async function exportTop() {
  if (getRankedItemsForCurrentScope().length === 0) {
    window.alert(t("emptyTop"));
    return;
  }

  try {
    const canvas = await captureExportCanvas();
    const link = document.createElement("a");

    link.download = getFileName();
    link.href = canvas.toDataURL("image/png");

    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Export failed:", error);
    window.alert(t("exportFailed"));
  }
}

export function openPreview() {
  if (getRankedItemsForCurrentScope().length === 0) {
    window.alert(t("emptyTop"));
    return;
  }

  if (previewResizeHandler) {
    window.removeEventListener(
      "resize",
      previewResizeHandler
    );

    previewResizeHandler = null;
  }

  previewMount.innerHTML = "";

  const clone = exportStage.cloneNode(true);

  clone.removeAttribute("id");
  clone.classList.remove("export-stage");
  clone.classList.add("preview-stage");
  clone.setAttribute("aria-hidden", "true");

  previewMount.appendChild(clone);
  previewModal.hidden = false;

  window.requestAnimationFrame(fitPreview);

  previewResizeHandler = fitPreview;

  window.addEventListener(
    "resize",
    previewResizeHandler
  );
}

export function closePreview() {
  previewModal.hidden = true;
  previewMount.innerHTML = "";

  if (previewResizeHandler) {
    window.removeEventListener(
      "resize",
      previewResizeHandler
    );

    previewResizeHandler = null;
  }
}
