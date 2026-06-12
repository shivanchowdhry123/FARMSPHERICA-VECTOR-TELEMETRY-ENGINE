import { getTelemetry } from './storage.js';

/**
 * Renders the telemetry trend chart on the analytics dashboard.
 * Requires <canvas id="telemetryChart"></canvas> in the DOM.
 */
export function initializeChart() {
    const canvas = document.getElementById('telemetryChart');
    if (!canvas) return;

    const data = getTelemetry();
    if (data.length === 0) {
        console.warn("No telemetry data to plot. The chart is effectively a void.");
        return;
    }

    // Mapping telemetry records to chart data
    const labels = data.map(item => item.date);
    const phValues = data.map(item => item.ph);
    const ecValues = data.map(item => item.ec);

    new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'pH Levels', data: phValues, borderColor: '#2e4f3c', fill: false },
                { label: 'EC (mS/cm)', data: ecValues, borderColor: '#3b82f6', fill: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: false } }
        }
    });
}