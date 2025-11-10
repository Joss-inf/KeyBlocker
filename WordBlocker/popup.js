document.addEventListener('DOMContentLoaded', loadSettings);

// HTML Element References
const newWordInput = document.getElementById('newWordInput');
const addWordButton = document.getElementById('addWordButton');
const wordList = document.getElementById('wordList');
const parentDepthSlider = document.getElementById('parentDepthSlider');
const parentDepthValue = document.getElementById('parentDepthValue');

// State Variables
let blacklistedWords = new Set();
let parentDepth = 0;

// Event Listeners
parentDepthSlider.addEventListener('input', handleSliderInput);
addWordButton.addEventListener('click', addWord);
newWordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addWord(); });

// --- Functions ---

async function loadSettings() {
    try {
        const result = await browser.storage.local.get(['blacklistedWords', 'parentDepth']);
        const wordsArray = result.blacklistedWords || [];
        blacklistedWords = new Set(wordsArray);
        parentDepth = result.parentDepth !== undefined ? result.parentDepth : 0;
        
        parentDepthSlider.value = parentDepth;
        parentDepthValue.textContent = parentDepth;
        renderWordList();
    } catch (error) {
        console.error('WordBlocker Popup: Error loading settings:', error);
    }
}

function saveAndSendWords() {
    const wordsToSave = Array.from(blacklistedWords);
    browser.storage.local.set({ blacklistedWords: wordsToSave })
        .then(() => {
            console.log('WordBlocker Popup: Word list saved.');
            sendMessage({ action: 'updateWords', words: wordsToSave });
        })
        .catch((error) => console.error('Error saving words:', error));
}

function saveAndSendDepth() {
    browser.storage.local.set({ parentDepth })
        .then(() => {
            console.log('WordBlocker Popup: Depth saved.');
            sendMessage({ action: 'updateDepth', depth: parentDepth });
        })
        .catch((error) => console.error('Error saving depth:', error));
}

function sendMessage(message) {
    browser.tabs.query({ active: true, currentWindow: true })
        .then((tabs) => {
            if (tabs[0] && tabs[0].id) {
                browser.tabs.sendMessage(tabs[0].id, message)
                    .catch(error => console.warn("Could not send message to content script:", error));
            }
        });
}

function handleSliderInput() {
    const value = parentDepthSlider.value;
    parentDepthValue.textContent = value;
    parentDepth = parseInt(value, 10);
    saveAndSendDepth();
}

// MODIFIÉ: addWord
function addWord() {
    const word = newWordInput.value.trim().toLowerCase();
    if (word && !blacklistedWords.has(word)) {
        blacklistedWords.add(word);
        newWordInput.value = '';
        
        // On passe le mot à animer à renderWordList
        renderWordList(word); 
        
        saveAndSendWords(); // On n'appelle qu'une seule fonction de sauvegarde
    } else if (word && blacklistedWords.has(word)) {
        alert('Le mot est déjà dans la liste noire !');
    }
}

// MODIFIÉ: removeWord
function removeWord(wordToRemove, event) {
    const liToRemove = event.target.closest('li');
    
    if (liToRemove) {
        liToRemove.classList.add('item-exit');

        setTimeout(() => {
            blacklistedWords.delete(wordToRemove);
            renderWordList();
            saveAndSendWords();
        }, 150); // Durée de l'animation
    }
}

// MODIFIÉ: renderWordList accepte maintenant un paramètre optionnel
function renderWordList(wordToAnimate = null) {
    wordList.replaceChildren();
    if (blacklistedWords.size === 0) {
        const li = document.createElement('li');
        li.textContent = 'Aucun mot dans la liste noire.';
        li.style.boxShadow = 'none';
        li.style.justifyContent = 'center';
        wordList.appendChild(li);
        return;
    }
    
    const sortedWords = Array.from(blacklistedWords).sort();

    sortedWords.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        
        // Si ce mot est celui qu'on vient d'ajouter, on lui met la classe d'animation
        if (word === wordToAnimate) {
            li.classList.add('item-enter');
        }
        
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Supprimer';
        removeButton.className = 'remove-button';
        // MODIFIÉ: On passe l'événement à removeWord
        removeButton.addEventListener('click', (event) => removeWord(word, event));
        li.appendChild(removeButton);
        wordList.appendChild(li);
    });
}




