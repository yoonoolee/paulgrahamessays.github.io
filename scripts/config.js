// CONSTANTS AND CONFIGURATIONS 

// custom ordering for filter categories
const CUSTOM_SORT_ORDERS = {
    'Society': ['Social Commentary', 'Philosophy', 'Economics and Policy', 'Education'],
    'Communication': ['Writing', 'Media'],
    'Startups': {
        categories: ['The Startup World', 'Getting Started', 'Running a Startup', 'Funding & Finance'],
        items: {
            'The Startup World': ['Y Combinator', 'Founder Life', 'Startup Landscape', 'Startup Hubs'],
            'Getting Started': ['Starting a Company', 'Ideas'],
            'Running a Startup': ['Founder Life', 'Strategy and Growth', 'Failure'],
            'Funding & Finance': ['Funding and Investing', 'Runway', 'Exits']
        }
    }
};

const AUDIENCE_ORDER = ['General', 'Founders', 'Hackers and Makers', 'Investors', 'Writers'];

// TF-IDF search configuration
const TFIDF_TITLE_WEIGHT = 30; // how much more important title matches are vs content matches
const SEARCH_DEBOUNCE_MS = 300; // milliseconds to wait before searching
