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
    rankingScope: "Classement",
    allGames: "Tous les jeux",
    antiSpoiler: "Anti-spoiler",
    preview: "Aperçu 1920×1080",
    guide: "Guide",
    exportImage: "Exporter en PNG",
    finalizeTop: "Finaliser le top",
    editTop: "Revenir à l'édition",

    selectContent: "SÉLECTION",
    search: "Rechercher",
    searchPlaceholder: "Rechercher un jeu...",
    themes: "Thèmes",
    games: "Jeux",
    selectAll: "Tout ajouter",
    clearLicense: "Tout retirer",
    noResults: "Aucun jeu trouvé.",

    unranked: "NON CLASSÉ(S)",
    noCover: "PAS D'IMAGE",
    selectedCount: "{selected} sélectionné(s)",
    rankedCount: "{ranked} classé(s) sur {selected}",

    emptySelectionTitle: "Aucun jeu sélectionné",
    emptySelectionText:
      "Ouvre le menu de droite pour choisir des licences et des jeux.",

    guideTitle: "Comment utiliser JRPGTop",
    guideStep1Title: "Choisis les jeux",
    guideStep1Text:
      "Ouvre le menu de droite, sélectionne une licence puis les jeux ou variantes OG/Remake.",
    guideStep2Title: "Classe ton top",
    guideStep2Text:
      "Fais glisser les cartes ou saisis directement leur numéro.",
    guideStep3Title: "Change de portée",
    guideStep3Text:
      "Fais un classement général ou un classement indépendant pour une licence.",
    guideStep4Title: "Finalise",
    guideStep4Text:
      "Le mode final masque les jeux non classés et centre uniquement le top utilisé.",
    guideStep5Title: "Prévisualise et exporte",
    guideStep5Text:
      "L'export est toujours généré en 1920×1080, même depuis un téléphone.",

    previewTitle: "Aperçu de l'export",
    generatingPreview: "Génération de l'aperçu...",

    confirmFinalize:
      "Finaliser ce top ? Les jeux non classés seront masqués.",
    emptyTop:
      "Classe au moins un jeu avant de finaliser ou d'exporter.",
    exportFailed:
      "L'export a échoué. Vérifie la console du navigateur.",
    previewFailed:
      "La génération de l'aperçu a échoué.",

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
    rankingScope: "Ranking",
    allGames: "All games",
    antiSpoiler: "Anti-spoiler",
    preview: "1920×1080 preview",
    guide: "Guide",
    exportImage: "Export PNG",
    finalizeTop: "Finalize top",
    editTop: "Return to editing",

    selectContent: "SELECTION",
    search: "Search",
    searchPlaceholder: "Search for a game...",
    themes: "Themes",
    games: "Games",
    selectAll: "Add all",
    clearLicense: "Remove all",
    noResults: "No game found.",

    unranked: "UNRANKED",
    noCover: "NO COVER",
    selectedCount: "{selected} selected",
    rankedCount: "{ranked} ranked out of {selected}",

    emptySelectionTitle: "No game selected",
    emptySelectionText:
      "Open the right menu to choose licences and games.",

    guideTitle: "How to use JRPGTop",
    guideStep1Title: "Choose games",
    guideStep1Text:
      "Open the right menu, select a licence, then choose games or OG/Remake variants.",
    guideStep2Title: "Rank your top",
    guideStep2Text:
      "Drag cards or directly enter their rank number.",
    guideStep3Title: "Change scope",
    guideStep3Text:
      "Create an overall ranking or an independent ranking for one licence.",
    guideStep4Title: "Finalize",
    guideStep4Text:
      "Final mode hides unranked games and centers only the used ranking.",
    guideStep5Title: "Preview and export",
    guideStep5Text:
      "The export is always generated in 1920×1080, even from a phone.",

    previewTitle: "Export preview",
    generatingPreview: "Generating preview...",

    confirmFinalize:
      "Finalize this top? Unranked games will be hidden.",
    emptyTop:
      "Rank at least one game before finalizing or exporting.",
    exportFailed:
      "Export failed. Check the browser console.",
    previewFailed:
      "Preview generation failed.",

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
}
