// RANGE SLIDER FUNCTIONS 

// helper function to setup a single range slider with event listeners
function setupRangeSlider(sliderId, type, isMin, globalMin, globalMax) {
    const slider = document.getElementById(sliderId);
    // determine which value display element to update based on slider type
    const valueDisplayId = type === 'year'
        ? (isMin ? 'yearMinValue' : 'yearMaxValue')
        : (isMin ? 'timeMinValue' : 'timeMaxValue');

    slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);

        if (isMin) {
            // handling minimum slider
            const currentMax = type === 'year' ? yearMax : timeMax;
            if (value <= currentMax) { // prevent min from exceeding max
                if (type === 'year') {
                    yearMin = value;
                } else {
                    timeMin = value;
                }
                document.getElementById(valueDisplayId).textContent = value; // update display
                updateRangeFill(type, globalMin, globalMax); // update visual fill
                applySortAndFilter(); // re-filter essays with new range
            } else {
                e.target.value = currentMax; // reset if user tries to exceed max
            }
        } else {
            // handling maximum slider
            const currentMin = type === 'year' ? yearMin : timeMin;
            if (value >= currentMin) { // prevent max from going below min
                if (type === 'year') {
                    yearMax = value;
                } else {
                    timeMax = value;
                }
                document.getElementById(valueDisplayId).textContent = value;
                updateRangeFill(type, globalMin, globalMax);
                applySortAndFilter();
            } else {
                e.target.value = currentMin; // reset if user tries to go below min
            }
        }
    });
}

// initialize range sliders with data-driven min/max values
function initRangeSliders() {
    // calculate min and max from the data
    const years = allEssays.map(e => e.Year);
    const times = allEssays.map(e => e.ReadingTime);

    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // update slider attributes
    document.getElementById('yearMinSlider').min = minYear;
    document.getElementById('yearMinSlider').max = maxYear;
    document.getElementById('yearMinSlider').value = minYear;
    document.getElementById('yearMaxSlider').min = minYear;
    document.getElementById('yearMaxSlider').max = maxYear;
    document.getElementById('yearMaxSlider').value = maxYear;

    document.getElementById('timeMinSlider').min = minTime;
    document.getElementById('timeMinSlider').max = maxTime;
    document.getElementById('timeMinSlider').value = minTime;
    document.getElementById('timeMaxSlider').min = minTime;
    document.getElementById('timeMaxSlider').max = maxTime;
    document.getElementById('timeMaxSlider').value = maxTime;

    // update global variables
    yearMin = minYear;
    yearMax = maxYear;
    timeMin = minTime;
    timeMax = maxTime;

    // update displayed values
    document.getElementById('yearMinValue').textContent = minYear;
    document.getElementById('yearMaxValue').textContent = maxYear;
    document.getElementById('timeMinValue').textContent = minTime;
    document.getElementById('timeMaxValue').textContent = maxTime;

    // setup event listeners using helper function
    setupRangeSlider('yearMinSlider', 'year', true, minYear, maxYear);
    setupRangeSlider('yearMaxSlider', 'year', false, minYear, maxYear);
    setupRangeSlider('timeMinSlider', 'time', true, minTime, maxTime);
    setupRangeSlider('timeMaxSlider', 'time', false, minTime, maxTime);

    // initial fill update
    updateRangeFill('year', minYear, maxYear);
    updateRangeFill('time', minTime, maxTime);
}

// update the visual fill of the range track
function updateRangeFill(type, min, max) {
    const trackFill = document.getElementById(type === 'year' ? 'yearRangeTrack' : 'timeRangeTrack');
    const currentMin = type === 'year' ? yearMin : timeMin;
    const currentMax = type === 'year' ? yearMax : timeMax;

    const range = max - min;
    const leftPercent = ((currentMin - min) / range) * 100;
    const rightPercent = ((currentMax - min) / range) * 100;

    trackFill.style.left = leftPercent + '%';
    trackFill.style.width = (rightPercent - leftPercent) + '%';
}
