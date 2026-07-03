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

const CAPTURE_WIDTH = 1920;
const CAPTURE_HEIGHT = 1080;
const HTML_TO_IMAGE_URL =
  "https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.min.js";

const app = document.getElementById("app");
const previewModal = document.getElementById("preview-modal");
const previewMount = document.getElementById("preview-mount");

function escapeAttribute(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

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
        const timeout = window.setTimeout(resolve, 8000);

        const finish = () => {
          window.clearTimeout(timeout);
          resolve();
        };

        image.addEventListener("load", finish, { once: true });
        image.addEventListener("error", finish, { once: true });
      });

      if (image.naturalWidth > 0 && image.decode) {
        try {
          await image.decode();
        } catch {}
      }
    })
  );
}

function copyFormValues(sourceRoot, cloneRoot) {
  const sourceFields = sourceRoot.querySelectorAll(
    "input, textarea, select"
  );

  const cloneFields = cloneRoot.querySelectorAll(
    "input, textarea, select"
  );

  sourceFields.forEach((source, index) => {
    const clone = cloneFields[index];

    if (!clone) {
      return;
    }

    if (source instanceof HTMLInputElement) {
      clone.value = source.value;
      clone.setAttribute("value", source.value);

      if (source.checked) {
        clone.setAttribute("checked", "");
      } else {
        clone.removeAttribute("checked");
      }

      return;
    }

    if (source instanceof HTMLTextAreaElement) {
      clone.value = source.value;
      clone.textContent = source.value;
      return;
    }

    if (source instanceof HTMLSelectElement) {
      clone.value = source.value;

      [...clone.options].forEach(option => {
        option.selected = option.value === source.value;
      });
    }
  });
}

function getStylesheetLinks() {
  return [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map(
      link =>
        `<link rel="stylesheet" href="${escapeAttribute(link.href)}" />`
    )
    .join("\n");
}

function createCaptureFrame() {
  const iframe = document.createElement("iframe");

  iframe.title = "JRPGTop export";
  iframe.setAttribute("aria-hidden", "true");

  Object.assign(iframe.style, {
    position: "fixed",
    top: "0",
    left: "-20000px",
    width: `${CAPTURE_WIDTH}px`,
    height: `${CAPTURE_HEIGHT}px`,
    border: "0",
    pointerEvents: "none"
  });

  const rootInlineStyle =
    document.documentElement.getAttribute("style") || "";

  iframe.srcdoc = `
    <!DOCTYPE html>
    <html
      lang="${escapeAttribute(document.documentElement.lang || "fr")}"
      style="${escapeAttribute(rootInlineStyle)}"
    >
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=${CAPTURE_WIDTH}, initial-scale=1"
        />

        <base href="${escapeAttribute(document.baseURI)}" />

        ${getStylesheetLinks()}

        <style>
          html,
          body {
            width: ${CAPTURE_WIDTH}px !important;
            height: ${CAPTURE_HEIGHT}px !important;
            margin: 0 !important;
            overflow: hidden !important;
            background: #070a1b !important;
          }

          body {
            position: relative !important;
          }

          #capture-app {
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            width: ${CAPTURE_WIDTH}px !important;
            height: ${CAPTURE_HEIGHT}px !important;
            overflow: hidden !important;
          }

          #capture-app #divider,
          #capture-app #unranked-label,
          #capture-app #unranked-section {
            display: none !important;
          }

          #capture-app .grid-wrapper {
            justify-content: center !important;
            min-height: calc(100vh - 130px) !important;
          }
        </style>

        <script src="${HTML_TO_IMAGE_URL}"></script>
      </head>

      <body class="${escapeAttribute(document.body.className)}"></body>
    </html>
  `;

  document.body.appendChild(iframe);

  return iframe;
}

async function waitForFrameLoad(iframe) {
  await new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(
        new Error(
          "Le rendu d'export a mis trop de temps à se charger."
        )
      );
    }, 20000);

    iframe.addEventListener(
      "load",
      () => {
        window.clearTimeout(timeout);
        resolve();
      },
      { once: true }
    );
  });

  const frameWindow = iframe.contentWindow;
  const frameDocument = iframe.contentDocument;

  if (!frameWindow || !frameDocument) {
    throw new Error("Impossible d'initialiser la page d'export.");
  }

  const start = performance.now();

  while (!frameWindow.htmlToImage?.toPng) {
    if (performance.now() - start > 20000) {
      throw new Error(
        "La bibliothèque d'export ne s'est pas chargée."
      );
    }

    await new Promise(resolve =>
      window.setTimeout(resolve, 50)
    );
  }

  if (frameDocument.fonts?.ready) {
    try {
      await frameDocument.fonts.ready;
    } catch {}
  }

  return {
    frameWindow,
    frameDocument
  };
}

function createCaptureApp(frameDocument) {
  const clone = app.cloneNode(true);

  copyFormValues(app, clone);

  clone.id = "capture-app";
  clone.classList.add("visible", "finalized");
  clone.setAttribute("aria-hidden", "false");

  clone.querySelector("#divider")?.remove();
  clone.querySelector("#unranked-label")?.remove();
  clone.querySelector("#unranked-section")?.remove();

  frameDocument.body.appendChild(clone);

  return clone;
}

async function validateCaptureLayout(captureApp) {
  const card = captureApp.querySelector(".card");

  if (!card) {
    throw new Error("Aucune carte à exporter.");
  }

  const cardStyle =
    captureApp.ownerDocument.defaultView.getComputedStyle(card);

  if (
    cardStyle.position !== "relative" ||
    Number.parseFloat(cardStyle.width) < 50 ||
    Number.parseFloat(cardStyle.height) < 50
  ) {
    throw new Error(
      "Les styles de la page d'export ne sont pas chargés."
    );
  }
}

async function captureCurrentRanking() {
  const iframe = createCaptureFrame();

  try {
    const {
      frameWindow,
      frameDocument
    } = await waitForFrameLoad(iframe);

    const captureApp =
      createCaptureApp(frameDocument);

    await waitForImages(captureApp);

    await new Promise(resolve =>
      frameWindow.requestAnimationFrame(() =>
        frameWindow.requestAnimationFrame(resolve)
      )
    );

    await validateCaptureLayout(captureApp);

    return await frameWindow.htmlToImage.toPng(
      captureApp,
      {
        width: CAPTURE_WIDTH,
        height: CAPTURE_HEIGHT,
        canvasWidth: CAPTURE_WIDTH,
        canvasHeight: CAPTURE_HEIGHT,
        pixelRatio: 1,
        backgroundColor: "#070a1b",
        cacheBust: true,
        skipAutoScale: true
      }
    );
  } finally {
    iframe.remove();
  }
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

function showPreviewLoading() {
  previewMount.innerHTML = `
    <div class="preview-loading">…</div>
  `;
}

function showPreviewImage(dataUrl) {
  previewMount.innerHTML = "";

  const image = document.createElement("img");

  image.className = "preview-capture";
  image.src = dataUrl;
  image.alt = t("finalPreview");

  previewMount.appendChild(image);
}

export async function exportTop() {
  if (getRankedItemsForCurrentScope().length === 0) {
    window.alert(t("emptyTop"));
    return;
  }

  try {
    const dataUrl = await captureCurrentRanking();
    const link = document.createElement("a");

    link.download = getFileName();
    link.href = dataUrl;

    document.body.appendChild(link);
    link.click();
    link.remove();
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

  previewModal.hidden = false;
  showPreviewLoading();

  try {
    const dataUrl =
      await captureCurrentRanking();

    if (!previewModal.hidden) {
      showPreviewImage(dataUrl);
    }
  } catch (error) {
    console.error("Preview failed:", error);

    previewMount.innerHTML = `
      <div class="preview-loading">
        ${t("exportFailed")}
      </div>
    `;
  }
}

export function closePreview() {
  previewModal.hidden = true;
  previewMount.innerHTML = "";
}
