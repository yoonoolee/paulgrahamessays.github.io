// UI INTERACTIONS AND EVENT HANDLERS 

// toggle preview pane for an essay
function togglePreview(essay, titleElement) {
    const rightPane = document.getElementById('rightPane');
    const previewHeader = document.getElementById('previewHeader');
    const previewContainer = document.getElementById('previewContainer');

    // if clicking the same essay, close the preview
    if (currentlySelectedEssay && currentlySelectedEssay.Title === essay.Title) {
        rightPane.classList.remove('visible');
        currentlySelectedEssay = null;
        previewHeader.innerHTML = '';
        // remove selected class from all essay items
        document.querySelectorAll('.essay-item').forEach(item => item.classList.remove('selected'));
    } else {
        // remove selected class from all essay items
        document.querySelectorAll('.essay-item').forEach(item => item.classList.remove('selected'));
        // add selected class to clicked item45
        if (titleElement) {
            const essayItem = titleElement.closest('.essay-item');
            if (essayItem) {
                essayItem.classList.add('selected');
            }
        }

        // add "Go to Original Essay" button in header
        previewHeader.innerHTML = `
            <a href="${essay.URL}" target="_blank" class="go-to-original-btn">
                Go to Original Essay
            </a>
        `;

        // open preview with new essay
        // only apply left offset for paulgraham.com URLs
        const isPaulGrahamSite = essay.URL.includes('paulgraham.com');
        const iframeClass = isPaulGrahamSite ? 'preview-iframe' : 'preview-iframe-no-offset';
        previewContainer.innerHTML = `<iframe class="${iframeClass}" src="${essay.URL}"></iframe>`;

        // listen for iframe navigation to block it and show a message
        const iframe = previewContainer.querySelector('iframe');
        let isInitialLoad = true;

        iframe.addEventListener('load', function() {
            // skip the initial load
            if (isInitialLoad) {
                isInitialLoad = false;
                return;
            }

            // user clicked a link - replace iframe with message
            previewContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f9fafb; color: #6b7280; font-size: 1.1rem; padding: 2rem; text-align: center;">
                    To navigate to other links, please open the original essay in a new tab.
                </div>
            `;
        });

        rightPane.classList.add('visible');
        currentlySelectedEssay = essay;
    }
}

// close preview pane
function closePreview() {
    const rightPane = document.getElementById('rightPane');
    const previewHeader = document.getElementById('previewHeader');
    rightPane.classList.remove('visible');
    currentlySelectedEssay = null;
    previewHeader.innerHTML = '';
    // remove selected class from all essay items
    document.querySelectorAll('.essay-item').forEach(item => item.classList.remove('selected'));
}

// toggle filter section collapse
function toggleFilterSection(labelElement) {
    const content = labelElement.nextElementSibling;
    labelElement.classList.toggle('collapsed');
    content.classList.toggle('collapsed');
}

// set sort option
function setSortOption(sortType) {
    const sortCategory = sortType.startsWith('date') ? 'date' : 'length';

    // check if clicking on already selected sort to deselect it
    if (sortType === primarySort && userHasSelectedSort) {
        // deselecting primary (only if it was already explicitly selected)
        if (secondarySort) {
            // promote secondary to primary
            primarySort = secondarySort;
            secondarySort = null;
        } else {
            // no secondary, reset to default and mark as not user-selected
            primarySort = 'date-desc';
            userHasSelectedSort = false;
        }
    } else if (sortType === secondarySort) {
        // deselecting secondary - just remove it
        secondarySort = null;
    } else {
        // selecting a new sort option
        const wasUserSelected = userHasSelectedSort;
        userHasSelectedSort = true; // mark that user has now made a selection

        // determine if this becomes primary or secondary
        const primaryCategory = primarySort.startsWith('date') ? 'date' : 'length';

        if (!wasUserSelected || sortCategory === primaryCategory) {
            // first explicit selection or clicking within same category - make it primary
            primarySort = sortType;
        } else {
            // clicking different category - make it secondary (allows multi-sort)
            secondarySort = sortType;
        }
    }

    // update the UI
    updateSortBadges();
    applySortAndFilter();
}

// update sort badges in the UI
function updateSortBadges() {
    // remove all badges and selected states
    document.querySelectorAll('#dateSortTree .tree-item, #lengthSortTree .tree-item').forEach(item => {
        item.classList.remove('selected');
        const existingBadge = item.querySelector('.sort-number');
        if (existingBadge) {
            existingBadge.remove();
        }
    });

    // only show badges if user has explicitly selected a sort option
    if (!userHasSelectedSort) {
        return;
    }

    // add badge to primary sort
    if (primarySort) {
        const primaryItem = findSortItem(primarySort);
        if (primaryItem) {
            primaryItem.classList.add('selected');
            const badge = document.createElement('span');
            badge.className = 'sort-number';
            badge.textContent = '1';
            primaryItem.querySelector('.tree-item-label').appendChild(badge);
        }
    }

    // add badge to secondary sort
    if (secondarySort) {
        const secondaryItem = findSortItem(secondarySort);
        if (secondaryItem) {
            secondaryItem.classList.add('selected');
            const badge = document.createElement('span');
            badge.className = 'sort-number';
            badge.textContent = '2';
            secondaryItem.querySelector('.tree-item-label').appendChild(badge);
        }
    }
}

// find sort item in the DOM
function findSortItem(sortType) {
    const allSortItems = document.querySelectorAll('#dateSortTree .tree-item, #lengthSortTree .tree-item');
    for (let item of allSortItems) {
        if (item.getAttribute('data-sort')  === sortType) {
            return item;
        }
    }
    return null;
}

// PATH HELPER FUNCTIONS 

function pathsEqual(path1, path2) {
    return path1.length === path2.length &&
           path1.every((item, i) => item === path2[i]);
}

function isAncestor(ancestorPath, childPath) {
    // an ancestor is shorter and matches the beginning of the child
    return childPath.length > ancestorPath.length &&
           ancestorPath.every((item, i) => item === childPath[i]);
}

function isDescendant(descendantPath, parentPath) {
    // a descendant is longer and the parent matches its beginning
    return descendantPath.length > parentPath.length &&
           parentPath.every((item, i) => item === descendantPath[i]);
}

// TOPIC SELECTION HEADERS

function handleTopicClick(topicName) {
    // toggle expansion
    const childrenContainer = document.getElementById(`children-${topicName}`);
    childrenContainer.classList.toggle('expanded');

    // toggle selection
    const path = [topicName];
    toggleTopicSelection(path);
}

function handleCategoryClick(topicName, categoryName) {
    // toggle expansion
    const childrenContainer = document.getElementById(`children-${topicName}-${categoryName}`);
    childrenContainer.classList.toggle('expanded');

    // toggle selection
    const path = [topicName, categoryName];
    toggleTopicSelection(path);
}

function handleDirectItemClick(topicName, itemName) {
    // for two-level structure (no category) - toggle selection
    const path = [topicName, itemName];
    toggleTopicSelection(path);
}

function handleItemClick(topicName, categoryName, itemName) {
    // for three-level structure (with category) - toggle selection
    const path = [topicName, categoryName, itemName];
    toggleTopicSelection(path);
}

function toggleTopicSelection(path) {
    const isSelected = selectedTopicPaths.some(p => pathsEqual(p, path));
    const hasDescendants = selectedTopicPaths.some(p => isDescendant(p, path));

    if (isSelected || hasDescendants) {
        // DESELECTING: remove this path and all its descendants
        selectedTopicPaths = selectedTopicPaths.filter(p =>
            !pathsEqual(p, path) && !isDescendant(p, path)
        );

        // collapse all children containers under this path
        collapseChildrenContainers(path);

        // if this path has a parent and no other children remain under that parent,
        // re-select the parent (maintains filter hierarchy)
        if (path.length > 1) {
            const parentPath = path.slice(0, -1); // get parent by removing last element
            const hasOtherChildren = selectedTopicPaths.some(p => isDescendant(p, parentPath));

            if (!hasOtherChildren) {
                selectedTopicPaths.push(parentPath); // revert to parent selection
            }
        }
    } else {
        // SELECTING: remove any ancestors or descendants first, then add this path
        // this prevents redundant selections (e.g., both "Startups" and "Startups > Ideas")
        selectedTopicPaths = selectedTopicPaths.filter(p =>
            !isAncestor(p, path) && !isDescendant(p, path)
        );
        selectedTopicPaths.push(path);
    }

    updateTreeSelection();
    applySortAndFilter();
}

function collapseChildrenContainers(path) {
    // collapse the children container for this path and all descendants
    if (path.length === 1) {
        // topic level: collapse children-{topicName}
        const container = document.getElementById(`children-${path[0]}`);
        if (container) {
            container.classList.remove('expanded');
        }
        // also collapse all nested children under this topic
        const allContainers = document.querySelectorAll(`[id^="children-${path[0]}-"]`);
        allContainers.forEach(c => c.classList.remove('expanded'));
    } else if (path.length === 2) {
        // category level: collapse children-{topicName}-{categoryName}
        const container = document.getElementById(`children-${path[0]}-${path[1]}`);
        if (container) {
            container.classList.remove('expanded');
        }
    }
    // for item level (length === 3), there are no children to collapse
}

function updateTreeSelection() {
    // remove all selected states from filter items only (not sort items)
    document.querySelectorAll('#topicTree .tree-item, #essayTypeTree .tree-item, #audienceTree .tree-item').forEach(el => {
        el.classList.remove('selected');
    });

    // add selected state to topic items
    if (selectedTopicPaths.length > 0) {
        const topicItems = document.querySelectorAll('#topicTree .tree-item');
        topicItems.forEach(item => {
            const label = item.querySelector('.tree-item-label').textContent;
            // check if this label is in any of the selected paths
            const isSelected = selectedTopicPaths.some(path => path.includes(label));
            if (isSelected) {
                item.classList.add('selected');
            }
        });
    }

    // update essay type selection
    if (selectedEssayTypes.length > 0) {
        const essayTypeItems = document.querySelectorAll('#essayTypeTree .tree-item');
        essayTypeItems.forEach(item => {
            const label = item.querySelector('.tree-item-label').textContent;
            if (selectedEssayTypes.includes(label)) {
                item.classList.add('selected');
            }
        });
    }

    // update audience selection
    if (selectedAudiences.length > 0) {
        const audienceItems = document.querySelectorAll('#audienceTree .tree-item');
        audienceItems.forEach(item => {
            const label = item.querySelector('.tree-item-label').textContent;
            if (selectedAudiences.includes(label)) {
                item.classList.add('selected');
            }
        });
    }
}

function handleEssayTypeClick(essayType) {
    // toggle selection
    const index = selectedEssayTypes.indexOf(essayType);
    if (index >= 0) {
        selectedEssayTypes.splice(index, 1);
    } else {
        selectedEssayTypes.push(essayType);
    }
    updateTreeSelection();
    applySortAndFilter();
}

function handleAudienceClick(audience) {
    // toggle selection
    const index = selectedAudiences.indexOf(audience);
    if (index >= 0) {
        selectedAudiences.splice(index, 1);
    } else {
        selectedAudiences.push(audience);
    }
    updateTreeSelection();
    applySortAndFilter();
}

// RESET FUNCTIONS 

function resetFilters() {
    // clear all selections
    selectedTopicPaths = [];
    selectedEssayTypes = [];
    selectedAudiences = [];

    // reset range sliders to full range
    const yearMinSlider = document.getElementById('yearMinSlider');
    const yearMaxSlider = document.getElementById('yearMaxSlider');
    const timeMinSlider = document.getElementById('timeMinSlider');
    const timeMaxSlider = document.getElementById('timeMaxSlider');

    if (yearMinSlider) {
        const minYear = parseInt(yearMinSlider.min);
        const maxYear = parseInt(yearMaxSlider.max);
        yearMin = minYear;
        yearMax = maxYear;
        yearMinSlider.value = yearMin;
        yearMaxSlider.value = yearMax;
        document.getElementById('yearMinValue').textContent = yearMin;
        document.getElementById('yearMaxValue').textContent = yearMax;
        updateRangeFill('year', minYear, maxYear);
    }

    if (timeMinSlider) {
        const minTime = parseInt(timeMinSlider.min);
        const maxTime = parseInt(timeMaxSlider.max);
        timeMin = minTime;
        timeMax = maxTime;
        timeMinSlider.value = timeMin;
        timeMaxSlider.value = timeMax;
        document.getElementById('timeMinValue').textContent = timeMin;
        document.getElementById('timeMaxValue').textContent = timeMax;
        updateRangeFill('time', minTime, maxTime);
    }

    // collapse only filter sections (not sort sections)
    document.querySelectorAll('.filter-section .filter-label').forEach(label => {
        label.classList.add('collapsed');
        label.nextElementSibling.classList.add('collapsed');
    });

    // collapse all expanded categories in the topic tree
    document.querySelectorAll('[id^="children-"]').forEach(container => {
        container.classList.remove('expanded');
    });

    // update UI and apply filters
    updateTreeSelection();
    applySortAndFilter();
}

function resetSort() {
    // reset to default sort (newest first)
    primarySort = 'date-desc';
    secondarySort = null;
    userHasSelectedSort = false; // mark as not user-selected

    // collapse only sort sections (not filter sections)
    document.querySelectorAll('.sort-section .filter-label').forEach(label => {
        label.classList.add('collapsed');
        label.nextElementSibling.classList.add('collapsed');
    });

    // update UI and apply sort
    updateSortBadges();
    applySortAndFilter();
}

function clearSearch() {
    // clear the search input
    const searchBar = document.querySelector('.search-bar');
    const searchClear = document.querySelector('.search-clear');

    searchBar.value = '';
    searchQuery = '';
    searchClear.classList.remove('visible');

    // reset sort selection when clearing search
    if (userHasSelectedSort) {
        userHasSelectedSort = false;
        primarySort = 'date-desc';
        secondarySort = null;
        updateSortBadges();
    }

    // re-apply filters without search
    applySortAndFilter();
}
