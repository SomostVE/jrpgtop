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

    unranked: "NON CLASSÉ(S)",
    noCover: "PAS D'IMAGE",
    rankedCount: "{ranked} classé(s) sur {total}",

    guideTitle: "Comment utiliser JRPGTop",
    guideStep1Title: "Choisis le type de classement",
    guideStep1Text:
      "Le menu de droite permet de classer toutes les licences, tous les jeux ou seulement les jeux d'une licence.",
    guideStep2Title: "Choisis le thème",
    guideStep2Text:
      "Pour une licence précise, le menu de gauche affiche ses thèmes. Pour Toutes les licences et Tous les jeux, il affiche tous les thèmes du catalogue.",
    guideStep3Title: "Classe ton top",
    guideStep3Text:
      "Fais glisser les cartes ou saisis directement leur numéro.",
    guideStep4Title: "Finalise",
    guideStep4Text:
      "Le mode final masque les éléments non classés et centre uniquement le top utilisé.",
    guideStep5Title: "Prévisualise et exporte",
    guideStep5Text:
      "L'aperçu final montre exactement le rendu exporté, y compris depuis un téléphone.",

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

    unranked: "UNRANKED",
    noCover: "NO COVER",
    rankedCount: "{ranked} ranked out of {total}",

    guideTitle: "How to use JRPGTop",
    guideStep1Title: "Choose the ranking type",
    guideStep1Text:
      "The right menu lets you rank all licences, all games, or only the games from one licence.",
    guideStep2Title: "Choose the theme",
    guideStep2Text:
      "For one specific licence, the left menu shows its themes. For All licences and All games, it shows every theme in the catalog.",
    guideStep3Title: "Rank your top",
    guideStep3Text:
      "Drag cards or directly enter their rank number.",
    guideStep4Title: "Finalize",
    guideStep4Text:
      "Final mode hides unranked items and centers only the used ranking.",
    guideStep5Title: "Preview and export",
    guideStep5Text:
      "Final preview shows the exact exported result, including on a phone.",

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
}
