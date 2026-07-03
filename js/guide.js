const guideModal = document.getElementById("guide-modal");

export function openGuide() {
  guideModal.hidden = false;
}

export function closeGuide() {
  guideModal.hidden = true;
}

export function initGuide() {
  document.querySelectorAll('[data-close-modal="guide"]').forEach(element => {
    element.addEventListener("click", closeGuide);
  });
}
