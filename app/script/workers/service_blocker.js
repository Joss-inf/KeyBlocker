
const searchWords = ["CESI","word2"];
const ignoredTags = new Set(["SCRIPT", "LINK", "INPUT", "HREF"]);

const graph = document.body
const lastNodeLength = 0
let nodeFound = []

const cooldownObs = 1
let isCooldown = false;

const observer = new MutationObserver(async mutations => {

    if (isCooldown) return;
    isCooldown = true;

    const nodes = bfsFilteredLeaves(graph, searchWords,ignoredTags,nodeFound,lastNodeLength)
    let result = [...new Set([...nodeFound, ...nodes])]

    for(let i = 0; i < result.length; i++){
        result[i].remove()
    }

    await wait(cooldownObs);
    isCooldown = false;
});

const config = {
    childList: true, 
    attributes: true, 
    subtree: true
};

observer.observe(document.body, config);

function wait(secondes) {
    return new Promise(resolve => setTimeout(resolve, secondes * 1000));
}

function bfsFilteredLeaves(root, searchWords,ignoredTags,nodeFound,l) {
    const queue = [root]; // Démarrer avec le nœud initial
    const visited = new Set(nodeFound);
    const leaves = []; // Liste des nœuds "feuilles" qui respectent la condition

    while (queue.length) {
        const node = queue.shift(); // Prendre le premier élément de la file

        // Vérifier si déjà visité
        if (visited.has(node)) {
            continue;
        }
        visited.add(node);

        // Vérifier si c'est une feuille (dernier nœud d'une branche)
        if (node.children.length === 0) {
            const text = (node.innerText || "").toLowerCase();

            // Vérifier la condition : balise ignorée OU aucun mot-clé trouvé
            if (!ignoredTags.has(node.tagName.toUpperCase()) && searchWords.some(word => text.includes(word.toLowerCase()))) {
                leaves.push(GoToLastNode(node,l)); // Ajouter aux résultats si valide
            }
        } else {
            // Ajouter les enfants à la file pour continuer le parcours
            for (const child of node.children) {
                const text = (node.innerText || "").toLowerCase();
                if (!ignoredTags.has(node.tagName.toUpperCase()) && searchWords.some(word => text.includes(word.toLowerCase()))) {
                    queue.push(child);// Ajouter aux résultats si valide
                }
            }
        }
    }
    return leaves;
}

function GoToLastNode(resultNodes,l){
    if(l == 0) return resultNodes
        for(let j = 0; j < l; j++){
            resultNodes[j] = resultNodes[j].parentNode
        }
    return resultNodes
}