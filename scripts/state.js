// APPLICATION STATE 

// data
let allEssays = [];
let essayContent = null; // essay content loaded on page load

// search state
let searchQuery = '';
let idfScores = {}; // pre-computed IDF scores for all terms
let invertedIndex = {}; // maps terms to essay IDs containing them (for fast search)
let searchDebounceTimer = null; // timer for debounced search

// filter state
let selectedTopicPaths = []; // tracks multiple selected topic paths [[topic, category, item], ...]
let selectedEssayTypes = []; // tracks multiple selected essay types
let selectedAudiences = []; // tracks multiple selected audiences

// range filter state
let yearMin = 1996;
let yearMax = 2025;
let timeMin = 0;
let timeMax = 60;

// sort state
let primarySort = 'date-desc'; // primary sort criterion
let secondarySort = null; // secondary sort criterion
let userHasSelectedSort = false; // track if user explicitly selected a sort option

// UI state
let currentlySelectedEssay = null;
