import { getLicenseById } from "./data-loader.js";
import { getState } from "./state.js";
import { t } from "./i18n.js";
import { getRankedItemsForCurrentScope } from "./render-grid.js";

const exportStage = document.getElementById("export-stage");
const previewModal = document.getElementById("preview-modal");
const previewImage = document.getElementById("preview-image");
const previewLoading = document.getElementById("preview-loading");

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

async function captureExportCanvas(scale = 1) {
  if (!window.html2canvas) {
    throw new Error("html2canvas n'est pas chargé.");
  }

  await waitForImages(exportStage);

  return window.html2canvas(exportStage, {
    backgroundColor: "#070a1b",
    useCORS: true,
    allowTaint: false,
    logging: false,
    width: 1920,
    height: 1080,
    scale
  });
}

function getFileName() {
  const state = getState();

  const scopeName =
    state.rankingScope === "all"
      ? "All"
      : getLicenseById(state.rankingScope)?.name || state.rankingScope;

  const safeScope = scopeName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `JRPGTop-${safeScope || "Ranking"}.png`;
}

export async function exportTop() {
  if (getRankedItemsForCurrentScope().length === 0) {
    window.alert(t("emptyTop"));
    return;
  }

  try {
    const canvas = await captureExportCanvas(1);
    const link = document.createElement("a");

    link.download = getFileName();
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error("Export failed:", error);
    window.alert(t("exportFailed"));
  }
}

export async function openPreview() {
  if (getRankedItemsForCurrentScope().length === 0) {
    window.alert(t("emptyTop"));
    return;
  }

  previewImage.removeAttribute("src");
  previewImage.hidden = true;
  previewLoading.hidden = false;
  previewModal.hidden = false;

  try {
    const canvas = await captureExportCanvas(0.5);

    previewImage.src = canvas.toDataURL("image/png");
    previewImage.hidden = false;
    previewLoading.hidden = true;
  } catch (error) {
    console.error("Preview failed:", error);
    previewLoading.textContent = t("previewFailed");
  }
}

export function closePreview() {
  previewModal.hidden = true;
}
