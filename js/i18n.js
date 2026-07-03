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
    notAvailable: "—",
    antiSpoiler: "Anti-spoiler",
    finalPreview: "Aperçu final",
    guide: "Guide",
    exportImage: "Exporter en PNG",
    finalizeTop: "Finaliser le top",
    editTop: "Revenir à l'édition",

    licenses: "CLASSEMENTS",
    chooseRanking: "Choisir un classement",
    allLicenses: "Toutes les licences",
    allGames: "Tous les jeux",
    licenseCount: "{count} licence(s)",
    gameCount: "{count} jeu(x)",
    searchLicensePlaceholder: "Rechercher une licence...",
    clearSearch: "Effacer la recherche",
    noLicenseFound: "Aucune licence trouvée",
    tryAnotherSearch: "Essaie une autre recherche.",
    requestContent: "Proposer un ajout",

    unranked: "NON CLASSÉ(S)",
    noCover: "PAS D'IMAGE",
    rankedCount: "{ranked} classé(s) sur {total}",

    guideTitle: "Comment utiliser JRPGTop",
    guideStep1Title: "Choisis le classement",
    guideStep1Start: "Dans le menu de droite, choisis",
    guideStep1Or: "ou",
    guideStep1End: "ou sélectionne directement une licence.",

    guideStep2Title: "Choisis le thème",
    guideStep2Start: "Dans le menu de gauche, utilise",
    guideStep2End:
      "pour choisir le fond et les couleurs du classement.",

    guideStep3Title: "Classe ton top",
    guideStep3Text:
      "Fais glisser les cartes ou saisis directement leur numéro de classement.",

    guideStep4Title: "Finalise et exporte",
    guideStep4Start: "Utilise",
    guideStep4AfterFinalize:
      "pour masquer les éléments non classés. Ouvre",
    guideStep4BeforeExport: "puis choisis",
    guideStep4End: "pour enregistrer l’image.",

    understood: "Compris",

    confirmFinalize:
      "Finaliser ce top ? Les éléments non classés seront masqués.",
    emptyTop:
      "Classe au moins un élément avant de finaliser ou d'exporter.",
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
    notAvailable: "—",
    antiSpoiler: "Anti-spoiler",
    finalPreview: "Final preview",
    guide: "Guide",
    exportImage: "Export PNG",
    finalizeTop: "Finalize top",
    editTop: "Return to editing",

    licenses: "RANKINGS",
    chooseRanking: "Choose a ranking",
    allLicenses: "All licences",
    allGames: "All games",
    licenseCount: "{count} licence(s)",
    gameCount: "{count} game(s)",
    searchLicensePlaceholder: "Search for a licence...",
    clearSearch: "Clear search",
    noLicenseFound: "No licence found",
    tryAnotherSearch: "Try another search.",
    requestContent: "Request content",

    unranked: "UNRANKED",
    noCover: "NO COVER",
    rankedCount: "{ranked} ranked out of {total}",

    guideTitle: "How to use JRPGTop",
    guideStep1Title: "Choose the ranking",
    guideStep1Start: "In the right menu, choose",
    guideStep1Or: "or",
    guideStep1End: "or select a specific licence.",

    guideStep2Title: "Choose the theme",
    guideStep2Start: "In the left menu, use",
    guideStep2End:
      "to choose the ranking background and colors.",

    guideStep3Title: "Rank your top",
    guideStep3Text:
      "Drag the cards or directly enter their ranking number.",

    guideStep4Title: "Finalize and export",
    guideStep4Start: "Use",
    guideStep4AfterFinalize:
      "to hide unranked items. Open",
    guideStep4BeforeExport: "then choose",
    guideStep4End: "to save the image.",

    understood: "Got it",

    confirmFinalize:
      "Finalize this top? Unranked items will be hidden.",
    emptyTop:
      "Rank at least one item before finalizing or exporting.",
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

  root.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
    const key = element.dataset.i18nPlaceholder;
    element.setAttribute("placeholder", t(key));
  });

  root.querySelectorAll("[data-i18n-aria-label]").forEach(element => {
    const key = element.dataset.i18nAriaLabel;
    element.setAttribute("aria-label", t(key));
  });
}
