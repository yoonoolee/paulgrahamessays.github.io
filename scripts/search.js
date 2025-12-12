// TF-IDF SEARCH FUNCTIONS 

// tokenize text: lowercase, split on non-alphanumeric, filter empty
function tokenize(text) {
    return text
        .toLowerCase() // convert everything to lowercase for case-insensitive matching
        .split(/[^a-z0-9]+/) // split on any non-alphanumeric characters
        .filter(token => token.length > 0); // remove empty strings from the result
}

// compute IDF scores for all terms in the corpus
// IDF(term) = log(N / (1 + df)) where N = total docs, df = docs containing term
// adding 1 to denominator prevents division by zero and smooths rare terms
// uses title + content
function computeIDF(essays) {
    const N = essays.length; // total number of documents
    const termDocFreq = {}; // term -> number of documents containing it

    // count document frequency for each term
    essays.forEach(essay => {
        let allTokens = new Set(tokenize(essay.Title)); // start with title tokens

        // include content if available
        if (essayContent) {
            const contentEntry = essayContent.find(c => c.ID === essay.ID);
            if (contentEntry && contentEntry.Content) {
                const contentTokens = tokenize(contentEntry.Content);
                contentTokens.forEach(token => allTokens.add(token)); // add content tokens to the set
            }
        }

        // use Set to count each term once per doc (prevents duplicate counting)
        allTokens.forEach(token => {
            termDocFreq[token] = (termDocFreq[token] || 0) + 1;
        });
    });

    // compute IDF for each term using logarithmic scale with smoothing
    const idf = {};
    for (const term in termDocFreq) {
        idf[term] = Math.log(N / (termDocFreq[term] + 1)); // rarer terms get higher scores
    }

    return idf;
}

// build inverted index: maps each term to list of essay IDs containing it
// this allows us to quickly find which essays contain query terms
function buildInvertedIndex(essays) {
    const index = {};

    essays.forEach(essay => {
        const titleTokens = new Set(tokenize(essay.Title));

        // add content tokens if available
        if (essayContent) {
            const contentEntry = essayContent.find(c => c.ID === essay.ID);
            if (contentEntry && contentEntry.Content) {
                const contentTokens = tokenize(contentEntry.Content);
                contentTokens.forEach(token => titleTokens.add(token));
            }
        }

        // for each unique token in this essay, add essay ID to index
        titleTokens.forEach(token => {
            if (!index[token]) {
                index[token] = [];
            }
            index[token].push(essay.ID);
        });
    });

    return index;
}

// compute TF-IDF score for a query against a document
// returns weighted sum of (TF * IDF) for title and content
// title matches are weighted more than content matches
function computeTFIDF(query, essay) {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return 0; // no query = no score

    // compute TF for title
    const titleTokens = tokenize(essay.Title);
    const titleTF = {}; // term frequency map for title
    titleTokens.forEach(token => {
        titleTF[token] = (titleTF[token] || 0) + 1; // count how many times each term appears
    });

    // compute TF-IDF score for title
    let titleScore = 0;
    queryTokens.forEach(queryTerm => {
        const termFreq = titleTF[queryTerm] || 0; // how often the term appears in title
        const idf = idfScores[queryTerm] || 0; // how rare the term is across all docs
        titleScore += termFreq * idf; // multiply frequency by importance
    });

    // also search content
    let contentScore = 0;
    if (essayContent) {
        const contentEntry = essayContent.find(c => c.ID === essay.ID);
        if (contentEntry && contentEntry.Content) {
            const contentTokens = tokenize(contentEntry.Content);
            const contentTF = {}; // term frequency map for content
            contentTokens.forEach(token => {
                contentTF[token] = (contentTF[token] || 0) + 1;
            });

            queryTokens.forEach(queryTerm => {
                const termFreq = contentTF[queryTerm] || 0;
                const idf = idfScores[queryTerm] || 0;
                contentScore += termFreq * idf;
            });
        }
    }

    // return weighted score: title matches are much more important than content matches
    return (titleScore * TFIDF_TITLE_WEIGHT) + contentScore;
}

// get candidate essays that might match the query using inverted index
// only searches essays that contain at least one query term
function getCandidateEssays(query, allEssays) {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    // get all essay IDs that contain at least one query term
    const candidateIDs = new Set();
    queryTokens.forEach(token => {
        const essayIDs = invertedIndex[token] || [];
        essayIDs.forEach(id => candidateIDs.add(id));
    });

    // return only essays with matching IDs
    return allEssays.filter(essay => candidateIDs.has(essay.ID));
}
