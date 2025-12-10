// FILTER AND SORT LOGIC 

// helper function to check if an essay matches the selected topic paths
function essayMatchesTopicPaths(essay, paths) {
    // check if the essay matches ANY of the selected paths
    return paths.some(selectedPath => {
        return essay.Topics.some(t => {
            const [topic, secondLevel, thirdLevel] = selectedPath; // destructure the path

            // first level: topic must match
            if (t.topic !== topic) return false;
            if (!secondLevel) return true; // if only topic selected, we have a match

            // second level: check for category or direct item
            if (!thirdLevel) {
                if (t.subtopics) {
                    return t.subtopics.some(subObj => {
                        // two-level structure: topic -> item
                        if (!subObj.category && subObj.items && subObj.items.includes(secondLevel)) {
                            return true;
                        }
                        // three-level structure: topic -> category (all items)
                        if (subObj.category === secondLevel) {
                            return true;
                        }
                        return false;
                    });
                }
                return false;
            } else {
                // third level: topic -> category -> specific item
                if (t.subtopics) {
                    return t.subtopics.some(subObj => {
                        return subObj.category === secondLevel &&
                               subObj.items &&
                               subObj.items.includes(thirdLevel);
                    });
                }
                return false;
            }
        });
    });
}

// helper function to apply filters excluding a specific filter type
function applyFiltersExcluding(excludeFilter) {
    let essays = [...allEssays];

    // apply topic filters (unless excluded)
    if (excludeFilter !== 'topics' && selectedTopicPaths.length > 0) {
        essays = essays.filter(essay => essayMatchesTopicPaths(essay, selectedTopicPaths));
    }

    // apply essay type filters (unless excluded)
    if (excludeFilter !== 'types' && selectedEssayTypes.length > 0) {
        essays = essays.filter(essay =>
            essay.EssayType && selectedEssayTypes.some(type => essay.EssayType.includes(type))
        );
    }

    // apply audience filters (unless excluded)
    if (excludeFilter !== 'audiences' && selectedAudiences.length > 0) {
        essays = essays.filter(essay =>
            essay.Audience && selectedAudiences.some(aud => essay.Audience.includes(aud))
        );
    }

    // apply year and reading time filters (always applied)
    essays = essays.filter(essay =>
        essay.Year >= yearMin && essay.Year <= yearMax &&
        essay.ReadingTime >= timeMin && essay.ReadingTime <= timeMax
    );

    // apply search filter (always applied)
    if (searchQuery.trim() !== '') {
        const candidates = getCandidateEssays(searchQuery, essays);
        essays = candidates.filter(essay => computeTFIDF(searchQuery, essay) > 0);
    }

    return essays;
}

// main function to apply all filters and sorting
function applySortAndFilter() {
    let essays = [...allEssays];

    // filter by topic tree selection - match ANY selected path
    if (selectedTopicPaths.length > 0) {
        essays = essays.filter(essay => essayMatchesTopicPaths(essay, selectedTopicPaths));
    }

    // filter by essay type - match ANY selected type
    if (selectedEssayTypes.length > 0) {
        essays = essays.filter(essay =>
            essay.EssayType && selectedEssayTypes.some(type => essay.EssayType.includes(type))
        );
    }

    // filter by audience - match ANY selected audience
    if (selectedAudiences.length > 0) {
        essays = essays.filter(essay =>
            essay.Audience && selectedAudiences.some(aud => essay.Audience.includes(aud))
        );
    }

    // filter by year range
    essays = essays.filter(essay => essay.Year >= yearMin && essay.Year <= yearMax);

    // filter by reading time range
    essays = essays.filter(essay => essay.ReadingTime >= timeMin && essay.ReadingTime <= timeMax);

    // filter by search query and compute TF-IDF scores
    const hasSearchQuery = searchQuery.trim() !== '';
    if (hasSearchQuery) {
        // use inverted index to get only candidate essays (essays containing query terms)
        const candidates = getCandidateEssays(searchQuery, essays);

        // compute TF-IDF scores only for candidates
        const scoredEssays = candidates.map(essay => {
            const score = computeTFIDF(searchQuery, essay);
            essay._tfidfScore = score;
            return essay;
        }).filter(essay => essay._tfidfScore > 0);

        essays = scoredEssays;
    }

    // sort - with primary and secondary criteria
    essays.sort((a, b) => {
        // if there's a search query and no manual sort selected, sort by TF-IDF score
        if (hasSearchQuery && !userHasSelectedSort) {
            const scoreA = a._tfidfScore || 0;
            const scoreB = b._tfidfScore || 0;
            if (scoreB !== scoreA) {
                return scoreB - scoreA; // higher scores first (best matches at top)
            }
            // if TF-IDF scores are equal, fall through to default date sorting
        }

        // apply primary sort
        let primaryResult = 0;
        switch(primarySort) {
            case 'date-desc':
                primaryResult = b.Year - a.Year; // newer years first
                // if same year, sort by month
                if (primaryResult === 0) {
                    primaryResult = (b.Month || 0) - (a.Month || 0); // later months first
                }
                break;
            case 'date-asc':
                primaryResult = a.Year - b.Year; // older years first
                // if same year, sort by month
                if (primaryResult === 0) {
                    primaryResult = (a.Month || 0) - (b.Month || 0); // earlier months first
                }
                break;
            case 'length-desc':
                primaryResult = b.WordCount - a.WordCount; // longer essays first
                break;
            case 'length-asc':
                primaryResult = a.WordCount - b.WordCount; // shorter essays first
                break;
        }

        // if primary sort values are equal and there's a secondary sort, apply it
        if (primaryResult === 0 && secondarySort) {
            switch(secondarySort) {
                case 'date-desc':
                    const yearDiff = b.Year - a.Year;
                    if (yearDiff === 0) {
                        return (b.Month || 0) - (a.Month || 0);
                    }
                    return yearDiff;
                case 'date-asc':
                    const yearDiffAsc = a.Year - b.Year;
                    if (yearDiffAsc === 0) {
                        return (a.Month || 0) - (b.Month || 0);
                    }
                    return yearDiffAsc;
                case 'length-desc':
                    return b.WordCount - a.WordCount;
                case 'length-asc':
                    return a.WordCount - b.WordCount;
            }
        }

        return primaryResult;
    });

    renderList(essays);
    updateFilterCounts(essays);
}

// update count badges in the filter UI
function updateFilterCounts(filteredEssays) {
    // for topic counts: exclude topic filters, include everything else
    const essaysForTopicCounts = applyFiltersExcluding('topics');

    // count essays for each topic/category/item
    // use a Set to ensure each essay is only counted once per filter key
    const topicCounts = {};
    essaysForTopicCounts.forEach(essay => {
        const countedKeys = new Set(); // track what we've counted for this essay

        essay.Topics.forEach(t => {
            const topicName = t.topic;

            // only count each essay once per topic
            if (!countedKeys.has(topicName)) {
                topicCounts[topicName] = (topicCounts[topicName] || 0) + 1;
                countedKeys.add(topicName);
            }

            if (t.subtopics) {
                t.subtopics.forEach(subObj => {
                    if (subObj.category && subObj.items) {
                        const categoryKey = `${topicName}|${subObj.category}`;

                        // only count each essay once per category
                        if (!countedKeys.has(categoryKey)) {
                            topicCounts[categoryKey] = (topicCounts[categoryKey] || 0) + 1;
                            countedKeys.add(categoryKey);
                        }

                        subObj.items.forEach(item => {
                            const itemKey = `${topicName}|${subObj.category}|${item}`;

                            // only count each essay once per item
                            if (!countedKeys.has(itemKey)) {
                                topicCounts[itemKey] = (topicCounts[itemKey] || 0) + 1;
                                countedKeys.add(itemKey);
                            }
                        });
                    } else if (subObj.items) {
                        subObj.items.forEach(item => {
                            const itemKey = `${topicName}|${item}`;

                            // only count each essay once per item
                            if (!countedKeys.has(itemKey)) {
                                topicCounts[itemKey] = (topicCounts[itemKey] || 0) + 1;
                                countedKeys.add(itemKey);
                            }
                        });
                    }
                });
            }
        });
    });

    // update topic tree badges
    document.querySelectorAll('#topicTree .tree-item[data-filter-key]').forEach(item => {
        const filterKey = item.getAttribute('data-filter-key');
        const badge = item.querySelector('.count-badge');
        if (filterKey && badge) {
            badge.textContent = topicCounts[filterKey] || 0;
        }
    });

    // for essay type counts: exclude essay type filters, include everything else
    const essaysForTypeCounts = applyFiltersExcluding('types');

    // count essays for each essay type
    // use a Set to ensure each essay is only counted once per type
    const typeCounts = {};
    essaysForTypeCounts.forEach(essay => {
        if (essay.EssayType) {
            const countedTypes = new Set();
            essay.EssayType.forEach(type => {
                const typeKey = `type:${type}`;
                if (!countedTypes.has(typeKey)) {
                    typeCounts[typeKey] = (typeCounts[typeKey] || 0) + 1;
                    countedTypes.add(typeKey);
                }
            });
        }
    });

    // update essay type badges
    document.querySelectorAll('#essayTypeTree .tree-item[data-filter-key]').forEach(item => {
        const filterKey = item.getAttribute('data-filter-key');
        const badge = item.querySelector('.count-badge');
        if (filterKey && badge) {
            badge.textContent = typeCounts[filterKey] || 0;
        }
    });

    // for audience counts: exclude audience filters, include everything else
    const essaysForAudienceCounts = applyFiltersExcluding('audiences');

    // count essays for each audience
    // use a Set to ensure each essay is only counted once per audience
    const audienceCounts = {};
    essaysForAudienceCounts.forEach(essay => {
        if (essay.Audience) {
            const countedAudiences = new Set();
            essay.Audience.forEach(aud => {
                const audKey = `audience:${aud}`;
                if (!countedAudiences.has(audKey)) {
                    audienceCounts[audKey] = (audienceCounts[audKey] || 0) + 1;
                    countedAudiences.add(audKey);
                }
            });
        }
    });

    // update audience badges
    document.querySelectorAll('#audienceTree .tree-item[data-filter-key]').forEach(item => {
        const filterKey = item.getAttribute('data-filter-key');
        const badge = item.querySelector('.count-badge');
        if (filterKey && badge) {
            badge.textContent = audienceCounts[filterKey] || 0;
        }
    });
}
