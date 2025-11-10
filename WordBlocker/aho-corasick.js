/**
 * Aho-Corasick String Search Algorithm Implementation
 * 
 * This class builds a finite state machine from a set of keywords (the "dictionary")
 * and can then search for all occurrences of these keywords in a given text in a single pass.
 * 
 * Inspired by the logic from: https://cp-algorithms.com/string/aho_corasick.html
 */
class AhoCorasick {
    /**
     * @param {string[]} keywords The list of words to search for.
     */
    constructor(keywords) {
        // We ensure there are no empty keywords, as they can cause infinite loops.
        this.keywords = keywords.filter(k => k.length > 0);
        this.root = this.createNode();
        this.buildTrie();
        this.buildFailureLinks();
    }

    /**
     * Creates a new node for the Trie.
     * Each node represents a state in the automaton.
     * @private
     */
    createNode() {
        return {
            children: {},      // Transitions to next states (e.g., {'a': node, 'b': node})
            failLink: null,    // The "failure link" to follow when a character doesn't match
            output: [],        // List of keywords that end at this node
            outputLink: null   // "Dictionary link" to find other matches ending at this suffix
        };
    }

    /**
     * Builds the initial Trie structure from the provided keywords.
     * This is the first step of building the automaton.
     * @private
     */
    buildTrie() {
        for (const keyword of this.keywords) {
            let node = this.root;
            for (const char of keyword) {
                if (!node.children[char]) {
                    node.children[char] = this.createNode();
                }
                node = node.children[char];
            }
            node.output.push(keyword);
        }
    }

    /**
     * Builds the failure links for each node in the Trie.
     * This is the core of the Aho-Corasick algorithm, turning the Trie into a true automaton.
     * It uses a Breadth-First Search (BFS) approach.
     * @private
     */
    buildFailureLinks() {
        this.root.failLink = this.root; // The root's failure link points to itself.
        const queue = [];

        // Start the BFS with the direct children of the root.
        for (const char in this.root.children) {
            const childNode = this.root.children[char];
            childNode.failLink = this.root; // Children of the root always fail back to the root.
            queue.push(childNode);
        }

        while (queue.length > 0) {
            const currentNode = queue.shift();

            for (const char in currentNode.children) {
                const childNode = currentNode.children[char];
                let failNode = currentNode.failLink;

                // Find the failure link for the child node.
                // We traverse up the failure links until we find a node that has a transition for the current character.
                while (failNode !== this.root && !failNode.children[char]) {
                    failNode = failNode.failLink;
                }

                if (failNode.children[char]) {
                    childNode.failLink = failNode.children[char];
                } else {
                    childNode.failLink = this.root;
                }
                
                // Build the dictionary links (output links)
                // This allows us to find all matches, even if one word is a suffix of another (e.g., "he" in "she").
                let outputFailNode = childNode.failLink;
                if (outputFailNode.output.length > 0) {
                     childNode.outputLink = outputFailNode;
                } else {
                     childNode.outputLink = outputFailNode.outputLink;
                }
                
                queue.push(childNode);
            }
        }
    }

    /**
     * Follows a transition from a given node for a specific character.
     * If a direct transition doesn't exist, it follows the failure links.
     * @param {object} node The current node (state).
     * @param {string} char The character to transition on.
     * @returns {object} The next node (state).
     * @private
     */
    go(node, char) {
        while (node !== this.root && !node.children[char]) {
            node = node.failLink;
        }
        if (node.children[char]) {
            return node.children[char];
        }
        return this.root;
    }

    /**
     * Searches a given text for all occurrences of the keywords.
     * @param {string} text The text to search within.
     * @returns {Array<[number, string[]]>} An array of results. Each result is a tuple
     * containing the end index of the match and an array of the keywords found at that index.
     * Example: [[8, ["word1", "word2"]], [15, ["word3"]]]
     */
    search(text) {
        let node = this.root;
        const results = [];

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            node = this.go(node, char);

            const allFoundKeywords = [];

            // Check if the current node is a match
            if (node.output.length > 0) {
                allFoundKeywords.push(...node.output);
            }

            // Follow the dictionary links to find other matches that are suffixes
            let tempNode = node;
            while (tempNode.outputLink) {
                tempNode = tempNode.outputLink;
                allFoundKeywords.push(...tempNode.output);
            }

            if (allFoundKeywords.length > 0) {
                results.push([i, allFoundKeywords]);
            }
        }
        return results;
    }
}