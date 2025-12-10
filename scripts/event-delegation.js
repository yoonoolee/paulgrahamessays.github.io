// EVENT DELEGATION 
// centralized event handling using data-action attributes

document.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (!actionElement) return;

    const action = actionElement.dataset.action;

    switch (action) {
        // expand/collapse filter sections (topics, essay types, audience, year, reading time)
        case 'toggle-section':
            toggleFilterSection(actionElement);
            break;

        // reset all filter selections and range sliders to defaults
        case 'reset-filters':
            resetFilters();
            break;

        // reset sort selections back to default (newest first)
        case 'reset-sort':
            resetSort();
            break;

        // clear the search input and reset search state
        case 'clear-search':
            clearSearch();
            break;

        // handle sort option clicks (date or length, ascending or descending)
        case 'sort':
            const sortType = actionElement.dataset.sort;
            if (sortType) {
                setSortOption(sortType);
            }
            break;

        // log warning for any unrecognized action attributes
        default:
            console.warn('Unknown action:', action);
    }
});
