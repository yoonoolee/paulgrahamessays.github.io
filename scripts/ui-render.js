// UI RENDERING FUNCTIONS

// helper function to sort array by custom order or alphabetically
function sortByCustomOrder(items, customOrder) {
    if (!customOrder) {
        return items.sort();
    }
    return items.sort((a, b) => {
        const indexA = customOrder.indexOf(a);
        const indexB = customOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });
}

// build topic hierarchy from essay data - nested category handling 
function buildTopicHierarchy() {
    const topicHierarchy = {};

    allEssays.forEach(essay => {
        essay.Topics.forEach(t => {
            const topicName = t.topic;

            if (!topicHierarchy[topicName]) {
                topicHierarchy[topicName] = { count: 0, categories: {}, directItems: {} };
            }
            topicHierarchy[topicName].count++;

            if (t.subtopics) {
                t.subtopics.forEach(subObj => {
                    if (subObj.category && subObj.items) {
                        // has category - three level nested structure
                        const categoryName = subObj.category;

                        if (!topicHierarchy[topicName].categories[categoryName]) {
                            topicHierarchy[topicName].categories[categoryName] = { count: 0, items: {} };
                        }
                        topicHierarchy[topicName].categories[categoryName].count++;

                        subObj.items.forEach(item => {
                            if (!topicHierarchy[topicName].categories[categoryName].items[item]) {
                                topicHierarchy[topicName].categories[categoryName].items[item] = 0;
                            }
                            topicHierarchy[topicName].categories[categoryName].items[item]++;
                        });
                    } else if (subObj.items) {
                        // no category - two level nested structure (direct items under topic)
                        subObj.items.forEach(item => {
                            if (!topicHierarchy[topicName].directItems[item]) {
                                topicHierarchy[topicName].directItems[item] = 0;
                            }
                            topicHierarchy[topicName].directItems[item]++;
                        });
                    }
                });
            }
        });
    });

    return topicHierarchy;
}

// create a tree item element
function createTreeItem(label, count, level, onClick, dataKey = null) {
    const item = document.createElement('div');
    item.className = 'tree-item';
    if (level > 1) {
        item.classList.add(`tree-level-${level}`);
    }

    // add data attribute for easier lookup
    if (dataKey) {
        item.setAttribute('data-filter-key', dataKey);
    }

    const labelSpan = document.createElement('span');
    labelSpan.className = 'tree-item-label';
    labelSpan.textContent = label;

    const badge = document.createElement('span');
    badge.className = 'count-badge';
    badge.textContent = count;

    item.appendChild(labelSpan);
    item.appendChild(badge);
    item.onclick = (e) => {
        e.stopPropagation();
        onClick();
    };

    return item;
}

// render topic tree UI from hierarchy data
function renderTopicTree(topicHierarchy) {
    const topicTree = document.getElementById('topicTree');
    topicTree.innerHTML = '';

    // sort topics by count (descending)
    Object.keys(topicHierarchy).sort((a, b) => topicHierarchy[b].count - topicHierarchy[a].count).forEach(topicName => {
        const topicData = topicHierarchy[topicName];
        const topicItem = createTreeItem(topicName, topicData.count, 1, () => handleTopicClick(topicName), topicName);
        topicTree.appendChild(topicItem);

        // create children container
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-children';
        childrenContainer.id = `children-${topicName}`;

        // add direct items (two-level structure)
        const directItemKeys = Object.keys(topicData.directItems);
        sortByCustomOrder(directItemKeys, CUSTOM_SORT_ORDERS[topicName]);

        directItemKeys.forEach(itemName => {
            const itemCount = topicData.directItems[itemName];
            const itemElement = createTreeItem(itemName, itemCount, 2, () => handleDirectItemClick(topicName, itemName), `${topicName}|${itemName}`);
            childrenContainer.appendChild(itemElement);
        });

        // add categories (three-level structure)
        const categoryKeys = Object.keys(topicData.categories);
        const categoryOrder = CUSTOM_SORT_ORDERS[topicName]?.categories;
        sortByCustomOrder(categoryKeys, categoryOrder);

        categoryKeys.forEach(categoryName => {
            const categoryData = topicData.categories[categoryName];
            const categoryItem = createTreeItem(categoryName, categoryData.count, 2, () => handleCategoryClick(topicName, categoryName), `${topicName}|${categoryName}`);
            childrenContainer.appendChild(categoryItem);

            // create children container for items under category
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'tree-children';
            itemsContainer.id = `children-${topicName}-${categoryName}`;

            // sort items with custom order if available
            const itemKeys = Object.keys(categoryData.items);
            const itemOrder = CUSTOM_SORT_ORDERS[topicName]?.items?.[categoryName];
            sortByCustomOrder(itemKeys, itemOrder);

            itemKeys.forEach(itemName => {
                const itemCount = categoryData.items[itemName];
                const itemElement = createTreeItem(itemName, itemCount, 3, () => handleItemClick(topicName, categoryName, itemName), `${topicName}|${categoryName}|${itemName}`);
                itemsContainer.appendChild(itemElement);
            });

            childrenContainer.appendChild(itemsContainer);
        });

        topicTree.appendChild(childrenContainer);
    });
}

// populate essay type filter UI
function populateEssayTypes() {
    const essayTypeCounts = {};
    allEssays.forEach(essay => {
        if (essay.EssayType) {
            essay.EssayType.forEach(type => {
                if (!essayTypeCounts[type]) {
                    essayTypeCounts[type] = 0;
                }
                essayTypeCounts[type]++;
            });
        }
    });

    const essayTypeTree = document.getElementById('essayTypeTree');
    essayTypeTree.innerHTML = '';
    // sort essay types by count (descending)
    Object.keys(essayTypeCounts).sort((a, b) => essayTypeCounts[b] - essayTypeCounts[a]).forEach(type => {
        const count = essayTypeCounts[type];
        const item = createTreeItem(type, count, 1, () => handleEssayTypeClick(type), `type:${type}`);
        essayTypeTree.appendChild(item);
    });
}

// populate audience filter UI
function populateAudiences() {
    const audienceCounts = {};
    allEssays.forEach(essay => {
        if (essay.Audience) {
            essay.Audience.forEach(aud => {
                if (!audienceCounts[aud]) {
                    audienceCounts[aud] = 0;
                }
                audienceCounts[aud]++;
            });
        }
    });

    const audienceTree = document.getElementById('audienceTree');
    audienceTree.innerHTML = '';
    // sort audiences by custom order
    const audienceKeys = Object.keys(audienceCounts);
    sortByCustomOrder(audienceKeys, AUDIENCE_ORDER);
    audienceKeys.forEach(audience => {
        const count = audienceCounts[audience];
        const item = createTreeItem(audience, count, 1, () => handleAudienceClick(audience), `audience:${audience}`);
        audienceTree.appendChild(item);
    });
}

// main function to populate all filter UI elements
function populateFilters() {
    const topicHierarchy = buildTopicHierarchy();
    renderTopicTree(topicHierarchy);
    populateEssayTypes();
    populateAudiences();
}

// render the list of essays
function renderList(essays) {
    const container = document.getElementById('essayList');
    const countDiv = document.getElementById('essayCount');

    countDiv.innerHTML = `Showing ${essays.length} essays`;

    if (essays.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #718096;">No essays found matching your filters.</p>';
        return;
    }

    container.innerHTML = '';

    essays.forEach(essay => {
        const item = document.createElement('div');
        item.className = 'essay-item';

        // apply selected class if this is the currently selected essay
        if (currentlySelectedEssay && currentlySelectedEssay.Title === essay.Title) {
            item.classList.add('selected');
        }

        // create title
        const title = document.createElement('div');
        title.className = 'essay-title';

        const titleText = document.createElement('span');
        titleText.textContent = essay.Title;
        title.appendChild(titleText);

        // create meta info container (date and reading time)
        const metaInfo = document.createElement('div');
        metaInfo.className = 'essay-meta-info';

        // create date info (plain text with calendar icon)
        const dateInfo = document.createElement('div');
        dateInfo.className = 'essay-date-info';
        dateInfo.innerHTML = `
            <svg class="calendar-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span class="date-text">${essay.Date}</span>
        `;

        // create reading time info (plain text with clock icon)
        const timeInfo = document.createElement('div');
        timeInfo.className = 'essay-time-info';
        timeInfo.innerHTML = `
            <svg class="clock-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span class="time-text">${essay.ReadingTime} min</span>
        `;

        // create audience info (with icon)
        const audienceInfo = document.createElement('div');
        audienceInfo.className = 'essay-audience-info';
        if (essay.Audience && essay.Audience.length > 0) {
            audienceInfo.innerHTML = `
                <svg class="audience-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span class="audience-text">${essay.Audience.join(', ')}</span>
            `;
        }

        // create essay type info (with icon)
        const typeInfo = document.createElement('div');
        typeInfo.className = 'essay-type-info';
        if (essay.EssayType && essay.EssayType.length > 0) {
            typeInfo.innerHTML = `
                <svg class="type-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span class="type-text">${essay.EssayType.join(', ')}</span>
            `;
        }

        // add all items to metaInfo
        metaInfo.appendChild(dateInfo);
        metaInfo.appendChild(timeInfo);
        if (essay.Audience && essay.Audience.length > 0) {
            metaInfo.appendChild(audienceInfo);
        }
        if (essay.EssayType && essay.EssayType.length > 0) {
            metaInfo.appendChild(typeInfo);
        }

        // create tags container for topic tags only
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'essay-tags';

        // add topic tags (grouped by topic) with color coding
        essay.Topics.forEach(topic => {
            if (topic.subtopics && topic.subtopics.length > 0) {
                // collect all subtopic items for this topic
                const allItems = [];
                topic.subtopics.forEach(subObj => {
                    if (subObj.items && subObj.items.length > 0) {
                        allItems.push(...subObj.items);
                    }
                });

                // create a single tag with all items
                if (allItems.length > 0) {
                    const topicTag = document.createElement('span');
                    topicTag.className = `tag topic-tag topic-${topic.topic.toLowerCase().replace(/\s+/g, '-')}`;
                    topicTag.textContent = `${topic.topic}: ${allItems.join(', ')}`;
                    tagsContainer.appendChild(topicTag);
                }
            } else {
                // no subtopics, just show the topic
                const topicTag = document.createElement('span');
                topicTag.className = `tag topic-tag topic-${topic.topic.toLowerCase().replace(/\s+/g, '-')}`;
                topicTag.textContent = topic.topic;
                tagsContainer.appendChild(topicTag);
            }
        });

        // create content wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'essay-content';
        contentWrapper.appendChild(title);
        contentWrapper.appendChild(metaInfo);
        contentWrapper.appendChild(tagsContainer);

        // assemble the item
        item.appendChild(contentWrapper);

        // add click handler to toggle preview
        item.onclick = () => {
            togglePreview(essay, title);
        };

        container.appendChild(item);
    });
}
