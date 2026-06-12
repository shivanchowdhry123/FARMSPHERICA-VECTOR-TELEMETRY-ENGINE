/**
 * Local Telemetry Storage Manager
 * Handles persistent browser-side data caching and backup/restore functionality.
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
        const initialData = [
            { id: '1', date: '2026-06-11 08:00', ph: 6.4, ec: 1.8, status: 'Buffer High' },
            { id: '2', date: '2026-06-11 09:00', ph: 6.2, ec: 1.5, status: 'Stable' }
        ];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialData));
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

/**
 * Generate a backup file of the current state.
 */
export function exportTelemetryBackup() {
    const data = getTelemetry();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `farmspherica_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Process an imported backup file.
 */
export async function importTelemetryBackup(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                saveTelemetry(importedData);
                resolve(importedData);
            } catch (err) {
                reject(new Error("Invalid backup file format."));
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsText(file);
    });
}