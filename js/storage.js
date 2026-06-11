export function initializeState() {
    if (!localStorage.getItem('telemetry')) {
        localStorage.setItem('telemetry', JSON.stringify([]));
    }
}