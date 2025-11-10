// Ce script s'exécute en arrière-plan et surveille la navigation.

browser.webNavigation.onHistoryStateUpdated.addListener(
    (details) => {
        // Cet événement se déclenche lorsque l'URL change sans rechargement de page (ex: sur YouTube, GitHub...).
        // On vérifie que la transition est bien terminée et que ce n'est pas un simple clic sur une ancre.
        if (details.frameId === 0) { // S'assurer que c'est bien la frame principale et non un iframe.
            console.log(`[Background Script] Navigation (SPA) détectée sur l'onglet ${details.tabId}. URL: ${details.url}`);
            
            // Envoyer un message au content.js de cet onglet pour lui dire de se réactiver.
            browser.tabs.sendMessage(details.tabId, { action: "pageNavigated" })
                .catch(error => {
                    // Cette erreur peut arriver si le content script n'est pas encore injecté ou si la page est protégée. C'est normal.
                    console.log(`Impossible d'envoyer le message de navigation : ${error}`);
                });
        }
    },
    {
        // On filtre pour ne s'activer que sur les pages web standards.
        url: [{ schemes: ["http", "https"] }]
    }
);