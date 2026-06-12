/**
 * Local Telemetry Storage Manager
 * Handles persistent browser-side data caching.
 */

const LOCAL_STORAGE_KEY = 'telemetry';

/**
 * Retrieves all telemetry records.
 * @returns {Array} Array of log records.
 */
export function getTelemetry() {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
}

/**
 * Persists telemetry data to localStorage.
 * @param {Array} data - The dataset to save.
 */
export function saveTelemetry(data) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Initializes the local storage schema if it does not exist.
 */
export function initializeState() {
    if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    }
}

/**
 * Adds a new telemetry record.
 * @param {Object} record 
 */
export function addRecord(record) {
    const data = getTelemetry();
    data.push(record);
    saveTelemetry(data);
}

/**
 * Removes a record by ID.
 * @param {string} id 
 */
export function removeRecord(id) {
    let data = getTelemetry();
    data = data.filter(item => item.id !== id);
    saveTelemetry(data);
}