/**
 * Local Telemetry Storage Manager
 * Handles persistent browser-side data caching and backup/restore functionality.
 */

const LOCAL_STORAGE_KEY = 'telemetry';
const SETTINGS_KEY = 'farmspherica_settings';

const DEFAULT_SETTINGS = {
    phMin: 5.5, phMax: 6.5,
    ecMin: 1.2, ecMax: 2.0,
    airTempMin: 20.0, airTempMax: 26.0,
    resTempMin: 18.0, resTempMax: 22.0,
    doMin: 6.0,
    luxMin: 15000, luxMax: 25000,
    units: 'metric',
    emailAlerts: true,
    smsAlerts: true
};

export function getSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
}

export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

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
            { id: '1', date: '2026-06-11 08:00', ph: 6.4, ec: 1.8, airTemp: 22.5, resTemp: 19.5, dissolvedOxygen: 7.2, lux: 18000 },
            { id: '2', date: '2026-06-11 16:00', ph: 6.2, ec: 1.5, airTemp: 23.0, resTemp: 20.0, dissolvedOxygen: 6.8, lux: 22000 },
            { id: '3', date: '2026-06-12 08:00', ph: 5.8, ec: 1.4, airTemp: 21.8, resTemp: 19.2, dissolvedOxygen: 7.5, lux: 16500 },
            { id: '4', date: '2026-06-12 16:00', ph: 6.1, ec: 1.6, airTemp: 22.1, resTemp: 19.8, dissolvedOxygen: 7.0, lux: 21000 }
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