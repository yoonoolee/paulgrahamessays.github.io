// MAIN INITIALIZATION 

// load both essays.json and essay-content.json in parallel
Promise.all([
    fetch('./essays.json').then(r => r.json()),
    fetch('./essay-content.json').then(r => r.json())
])
    .then(([essaysData, contentData]) => {
        // store the loaded data in global variables
        allEssays = essaysData.essays;
        essayContent = contentData.content;

        console.log('Building search index...');

        // pre-compute IDF scores with full content
        // this is done once at startup for better search performance
        idfScores = computeIDF(allEssays);

        // build inverted index for fast search
        // allows us to quickly find essays containing specific terms
        invertedIndex = buildInvertedIndex(allEssays);

        console.log('Search index ready!');

        // initialize the UI
        populateFilters(); // build the filter trees (topics, types, audiences)
        initRangeSliders(); // initialize year and reading time sliders from data
        updateSortBadges(); // show initial sort badge (none by default)
        applySortAndFilter(); // render initial essay list

        // setup search functionality with debouncing
        setupSearch();
    })
    .catch(error => {
        // handle any errors during data loading
        console.error('Error loading data:', error);
        document.getElementById('essayList').innerHTML =
            '<p style="text-align: center; padding: 2rem; color: #e53e3e;">Error loading essays. Please refresh the page.</p>';
    });

// setup search input handlers
function setupSearch() {
    const searchBar = document.querySelector('.search-bar');
    const searchClear = document.querySelector('.search-clear');

    searchBar.addEventListener('input', (e) => {
        const newQuery = e.target.value;
        const queryChanged = newQuery !== searchQuery;
        searchQuery = newQuery;

        // show/hide clear button based on whether there's text
        if (searchQuery.trim() !== '') {
            searchClear.classList.add('visible');

            // reset sort selection when search query changes
            // this allows TF-IDF relevance sorting to take over
            if (queryChanged && userHasSelectedSort) {
                userHasSelectedSort = false;
                primarySort = 'date-desc';
                secondarySort = null;
                updateSortBadges();
            }
        } else {
            searchClear.classList.remove('visible');
        }

        // debounce: wait before applying search
        // prevents excessive filtering while user is still typing
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            applySortAndFilter(); // execute search after user stops typing
        }, SEARCH_DEBOUNCE_MS);
    });
}
