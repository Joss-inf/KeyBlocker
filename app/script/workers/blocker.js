
function bfsFilteredLeaves(root, searchWords,ignoredTags) {
    const queue = [root]; // Démarrer avec le nœud initial
    const visited = new Set();
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
                leaves.push(node); // Ajouter aux résultats si valide
            }
        } else {
            // Ajouter les enfants à la file pour continuer le parcours
            for (const child of node.children) {
                queue.push(child);
            }
        }
    }
    return leaves;
}

function removeNode(resultNodes,l){
    for(let i = 0; i < resultNodes.length; i++){
        for(let j = 0; j < l; j++){
            resultNodes[i] = resultNodes[i].parentNode
        }
        resultNodes[i].remove()
    }
}

const searchWords = ["CESI","ISCOD"];
const ignoredTags = new Set(["SCRIPT", "LINK", "INPUT", "HREF"]);

removeNode(bfsFilteredLeaves(document.body, searchWords,ignoredTags),2)


// //  Afficher les résultats
// console.log(` ${resultNodes.length} nœud(s) trouvé(s) respectant la condition :`);
// resultNodes.forEach((node, index) => {
//     console.log(` Résultat ${index + 1}:`);
//     console.log("    ID:", node.parentNode.id || "Pas d'ID");
//     console.log("    Balise:", node.parentNode.tagName);
//     console.log("    Contenu:", node.parentNode.innerText.trim().slice(0, 100), "...");
// });
