const keywords = [
    "Cette entreprise souhaite rester anonyme","formation","school","ecole","l'ecole", "l'ecole numerique",
    "campus","livecampus","schoolcampus","academy","factory", "certification",
    "iscod","iscom","h3","cfa", "iron", "hack", "ironhack", "AB", 
    "XEFI", "ACADEMY","livecampus","DIGINAMIC","IRIS Paris","Aureïs","ESAM",
    "Ecole ESAM PARIS","iscpa",'studi','cfa'
];

// Préparer une seule regex optimisée
const cleanKeywords = keywords.map(removeAccents); // Supprime les accents
const regex = new RegExp(`\\b(${cleanKeywords.join("|")})\\b|(${cleanKeywords.join("|")})\\w*`, "i");
// Utiliser un `Map` pour éviter les recherches inutiles (cache des éléments déjà filtrés)
const filteredElements = new Map();
// Dictionnaire des sélecteurs en fonction du domaine
let dict = {
    "indeed": "li",  // Si c'est un <li> sur Indeed
    "hellowork": "li",  // Si c'est un <li> sur Hellowork
    "welcometothejungle": "li[data-testid]",  // Cibler les <li> avec un data-testid sur Welcome to the Jungle
    "pmejob": "div",  // Sur PMEJob
    "gouv": "li"  // Sur Gouv
}
// Fonction pour retirer les accents
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
}
//todo: indexed db 
function removeTrainingOffers() {
    const url = window.location.hostname;
    const parts = url.split('.');  // Sépare l'URL par les points "."
    const domain = parts[parts.length - 2]; 

    // Si le domaine n'est pas dans le dictionnaire, on quitte la fonction
    if (!dict[domain]) {
        console.log("Site inconnu!", "site: ", domain);
        return;
    }
    console.log("Site reconnu!", "site: ", domain);
    // Sélectionner les éléments en fonction du domaine
    const elements = document.querySelectorAll(dict[domain]);
    if(!elements){
        console.log("Erreur Éléments non trouvés "); 
        return
    }
    console.log("Éléments trouvés");
elements.forEach(el => {
    const text = removeAccents(el.innerText.toLowerCase());
    if (regex.test(text)) {
        console.log("Offre de formation trouvée, elle sera supprimée.");
        el.style.display = "none";
        filteredElements.set(el, true); // Ajouter au cache pour éviter de le traiter deux fois
    }
});
}

// Appeler la fonction pour tester
removeTrainingOffers();
// Lancer la vérification toutes les 5 secondes
