const translations = {
  fr: {
    configSubtitle: "Configure l'affichage avant de commencer.",
    langTitle: "Langue",
    displayTitle: "Affichage",
    spoilerDesc: "Masquer les jaquettes",
    hideTitles: "Masquer les titres",
    start: "Commencer",

    options: "OPTIONS",
    language: "Langue",
    theme: "Thème",
    antiSpoiler: "Anti-spoiler",
    finalPreview: "Aperçu final",
    guide: "Guide",
    exportImage: "Exporter en PNG",
    finalizeTop: "Finaliser le top",
    editTop: "Revenir à l'édition",

    licenses: "LICENCES",
    chooseLicense: "Choisir une licence",
    gameCount: "{count} jeu(x)",

    unranked: "NON CLASSÉ(S)",
    noCover: "PAS D'IMAGE",
    rankedCount: "{ranked} classé(s) sur {total}",

    guideTitle: "Comment utiliser JRPGTop",
    guideStep1Title: "Choisis une licence",
    guideStep1Text:
      "Ouvre le menu de droite. Tous les jeux de la licence choisie sont chargés automatiquement.",
    guideStep2Title: "Choisis le thème",
    guideStep2Text:
      "Le menu de gauche propose uniquement les thèmes disponibles pour la licence actuelle.",
    guideStep3Title: "Classe ton top",
    guideStep3Text:
      "Fais glisser les cartes ou saisis directement leur numéro.",
    guideStep4Title: "Finalise",
    guideStep4Text:
      "Le mode final masque les jeux non classés et centre uniquement le top utilisé.",
    guideStep5Title: "Prévisualise et exporte",
    guideStep5Text:
      "L'aperçu final montre exactement le rendu exporté, y compris depuis un téléphone.",

    confirmFinalize:
      "Finaliser ce top ? Les jeux non classés seront masqués.",
    emptyTop:
      "Classe au moins un jeu avant de finaliser ou d'exporter.",
    exportFailed:
      "L'export a échoué. Vérifie la console du navigateur.",

    loadingError:
      "Impossible de charger le catalogue. Ouvre le projet avec GitHub Pages ou un serveur local, pas directement avec file://."
  },

  en: {
    configSubtitle: "Configure the display before you start.",
    langTitle: "Language",
    displayTitle: "Display",
    spoilerDesc: "Hide covers",
    hideTitles: "Hide titles",
    start: "Start",

    options: "OPTIONS",
    language: "Language",
    theme: "Theme",
    antiSpoiler: "Anti-spoiler",
    finalPreview: "Final preview",
    guide: "Guide",
    exportImage: "Export PNG",
    finalizeTop: "Finalize top",
    editTop: "Return to editing",

    licenses: "LICENCES",
    chooseLicense: "Choose a licence",
    gameCount: "{count} game(s)",

    unranked: "UNRANKED",
    noCover: "NO COVER",
    rankedCount: "{ranked} ranked out of {total}",

    guideTitle: "How to use JRPGTop",
    guideStep1Title: "Choose a licence",
    guideStep1Text:
      "Open the right menu. Every game from the chosen licence is loaded automatically.",
    guideStep2Title: "Choose the theme",
    guideStep2Text:
      "The left menu only shows themes available for the current licence.",
    guideStep3Title: "Rank your top",
    guideStep3Text:
      "Drag cards or directly enter their rank number.",
    guideStep4Title: "Finalize",
    guideStep4Text:
      "Final mode hides unranked games and centers only the used ranking.",
    guideStep5Title: "Preview and export",
    guideStep5Text:
      "Final preview shows the exact exported result, including on a phone.",

    confirmFinalize:
      "Finalize this top? Unranked games will be hidden.",
    emptyTop:
      "Rank at least one game before finalizing or exporting.",
    exportFailed:
      "Export failed. Check the browser console.",

    loadingError:
      "The catalog could not be loaded. Open the project with GitHub Pages or a local server, not directly with file://."
  }
};

let currentLanguage = "fr";

export function setLanguage(language) {
  currentLanguage = translations[language] ? language : "fr";
  document.documentElement.lang = currentLanguage;
}

export function getLanguage() {
  return currentLanguage;
}

export function t(key, variables = {}) {
  const table = translations[currentLanguage] || translations.fr;
  let value = table[key] ?? translations.fr[key] ?? key;

  for (const [name, replacement] of Object.entries(variables)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }

  return value;
}

export function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    element.textContent = t(key);
  });
}
