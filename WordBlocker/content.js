// ====================================================================
// =        WORD BLOCKER - CONTENT SCRIPT (AHO-CORASICK VERSION)      =
// ====================================================================

// --- Déclarations des variables globales et des constantes ---
let currentBlacklist = []; // Aho-Corasick prend un tableau de mots-clés
let currentParentDepth = 0;
const hiddenElements = new Set();
const FORBIDDEN_TAGS = ['HTML', 'BODY', 'HEAD', 'STYLE', 'SCRIPT', 'MAIN', 'CANVAS', 'IFRAME', 'NOSCRIPT'];

// La machine de recherche. Sera initialisée après le chargement des paramètres.
let searcher = null;

// --- Définitions des Fonctions ---

function hideElement(element) {
    if (!element || hiddenElements.has(element) || FORBIDDEN_TAGS.includes(element.tagName)) {
        if (element && FORBIDDEN_TAGS.includes(element.tagName)) {
            console.warn(`WordBlocker: Tentative de masquer une balise interdite <${element.tagName}> a été ignorée.`);
        }
        return false;
    }
    element.style.display = 'none';
    hiddenElements.add(element);
    return true;
}

function buildSearcher() {
    if (currentBlacklist && currentBlacklist.length > 0) {
        // Crée une nouvelle instance de la classe AhoCorasick (définie dans aho-corasick.js)
        searcher = new AhoCorasick(currentBlacklist);
        console.log("WordBlocker: Automate de recherche Aho-Corasick construit.");
    } else {
        searcher = null;
    }
}

async function getSettings() {
    try {
        const result = await browser.storage.local.get(['blacklistedWords', 'parentDepth']);
        currentBlacklist = result.blacklistedWords || [];
        currentParentDepth = result.parentDepth !== undefined ? parseInt(result.parentDepth, 10) : 0;
        buildSearcher();
    } catch (error) {
        console.error('WordBlocker: Erreur lors du chargement des paramètres:', error);
    }
}

function getTargetElementToHide(startElement, depth) {
    let target = startElement;
    for (let i = 0; i < depth; i++) {
        if (target.parentElement && !FORBIDDEN_TAGS.includes(target.parentElement.tagName)) {
            target = target.parentElement;
        } else {
            break;
        }
    }
    return target;
}

function scanTextNodeParent(textNode) {
    // Si l'automate n'est pas prêt ou si le texte est vide, on ne fait rien
    if (!searcher || !textNode || !textNode.textContent.trim()) return;

    let immediateParent = textNode.parentElement;
    let ancestor = immediateParent;
    while (ancestor) {
        if (hiddenElements.has(ancestor)) return;
        ancestor = ancestor.parentElement;
    }

    if (!immediateParent || FORBIDDEN_TAGS.includes(immediateParent.tagName)) return;

    const textContent = textNode.textContent.toLowerCase();

    // Utiliser notre automate pour rechercher dans le texte
    const results = searcher.search(textContent);

    if (results.length > 0) {
        const foundWord = results[0][1][0]; 
        const elementToHide = getTargetElementToHide(immediateParent, currentParentDepth);
        if (hideElement(elementToHide)) {
            console.log(`WordBlocker: Élément masqué (profondeur ${currentParentDepth}) contenant "${foundWord}"`, elementToHide);
        }
    }
}

function scanElementAndChildren(rootElement) {
    if (!rootElement || rootElement.nodeType !== Node.ELEMENT_NODE || hiddenElements.has(rootElement)) return;
    const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
        scanTextNodeParent(node);
    }
}

// <<< RÉINTRODUIT: La fonction pour le MutationObserver >>>
function processMutations(mutations) {
    if (!searcher) return;
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            for (const addedNode of mutation.addedNodes) scanElementAndChildren(addedNode);
        } else if (mutation.type === 'characterData') {
            scanTextNodeParent(mutation.target);
        }
    }
}

function resetAndScan() {
    for (const element of hiddenElements) {
        element.style.display = '';
    }
    hiddenElements.clear();
    if (searcher) {
        scanElementAndChildren(document.body);
    }
}

// --- Event Listeners & Initialization ---

// <<< RÉINTRODUIT: L'écouteur de messages du popup >>>
browser.runtime.onMessage.addListener(async (request) => {

    if (request.action === 'updateWords') {
        console.log('WordBlocker: Liste de mots mise à jour reçue.');
        currentBlacklist = request.words || [];
        
        // C'est SEULEMENT ici qu'on reconstruit l'automate de recherche
        buildSearcher(); 
        resetAndScan();

    } else if (request.action === 'updateDepth') {
        console.log('WordBlocker: Profondeur mise à jour reçue.');
        currentParentDepth = request.depth || 0;

        // Pas besoin de reconstruire l'automate, on re-scanne juste la page
        resetAndScan();

    } else if (request.action === 'pageNavigated') {
        console.log('WordBlocker: Navigation détectée, re-scan...');
        // On pourrait recharger les settings au cas où ils auraient changé dans un autre onglet
        await getSettings();
        setTimeout(resetAndScan, 250);
    }
});

// --- Point d'Entrée Principal ---
async function main() {
    console.log("WordBlocker: Initialisation...");

    await getSettings();

    if (searcher) {
        console.log('WordBlocker: Scan initial de la page...');
        scanElementAndChildren(document.body);
    } else {
        console.log('WordBlocker: Liste noire vide, scan initial ignoré.');
    }

    const observer = new MutationObserver(processMutations);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
    console.log('WordBlocker: MutationObserver initialisé.');
}

// Lancer l'exécution
main();