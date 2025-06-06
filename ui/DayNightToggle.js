// ui/DayNightToggle.js

/**
 * Initializes the day/night toggle button UI and handles its events.
 * @param {function} getIsDaytime - Function returning current isDaytime boolean.
 * @param {function} onToggle - Callback to execute when toggling day/night.
 */
export function initDayNightToggle({ getIsDaytime, onToggle }) {
    const dayNightToggle = document.getElementById('day-night-toggle');
    if (!dayNightToggle) return;
    // Set initial button text
    dayNightToggle.textContent = getIsDaytime() ? 'Switch to Night' : 'Switch to Day';
    dayNightToggle.addEventListener('click', () => {
        onToggle();
        dayNightToggle.textContent = getIsDaytime() ? 'Switch to Night' : 'Switch to Day';
    });
} 