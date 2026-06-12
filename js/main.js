import { initializeState, getTelemetry, addRecord, removeRecord, exportTelemetryBackup, importTelemetryBackup } from './storage.js';

export function updateDashboardCards() {
    const data = getTelemetry();
    if (data.length === 0) return;

    // Get the most recent entry
    const latest = data[data.length - 1];

    const phEl = document.getElementById('card-ph');
    const ecEl = document.getElementById('card-ec');
    const tempEl = document.getElementById('card-temp');

    if (phEl) phEl.textContent = latest.ph;
    if (ecEl) ecEl.textContent = latest.ec;
    if (tempEl) tempEl.textContent = latest.temp;
}

// Apply saved theme state globally as early as possible
const applySavedTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = savedTheme;
};
// Run theme initialization immediately if body is ready, or on DOMContentLoaded
if (document.body) {
    applySavedTheme();
} else {
    document.addEventListener('DOMContentLoaded', applySavedTheme);
}

// Centralized Event Controller using Global Event Delegation
document.addEventListener('click', (e) => {
    // Locate the closest interactive element with a data-action attribute
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;

    switch (action) {
        case 'toggle-theme':
            const currentTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
            document.body.dataset.theme = currentTheme;
            localStorage.setItem('theme', currentTheme);
            break;

        case 'toggle-sidebar':
            const appContainer = document.querySelector('.app-container');
            // Responsive CSS moved to styles.css (removed stray block)
            if (appContainer) {
                appContainer.classList.toggle('sidebar-collapsed');
            }
            break;

        case 'add-record':
            e.preventDefault();
            const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2);
            addRecord({ 
                id, 
                date: new Date().toISOString().split('T')[0],
                ph: 7.0, temp: 22.0, ec: 1.5 
            });
            renderLoggerTable();
            // Update dashboard cards in case the new data affects them
            updateDashboardCards();
            break;

        case 'delete-record':
            const recordId = actionEl.dataset.id;
            if (recordId) {
                removeRecord(recordId);
                renderLoggerTable();
            }
            break;

        case 'export-data':
            exportTelemetryBackup();
            break;

        case 'sync-data':
            alert("Synchronizing telemetry vectors to cloud database...");
            break;

        case 'change-password':
            alert("Password change form loaded.");
            break;

        case 'save-settings':
            alert("Configuration settings updated successfully.");
            break;

        case 'delete-account':
            alert("Warning: Account deletion process initialized.");
            break;

        case 'get-help':
            alert("Connecting to Farmspherica support systems...");
            break;

        default:
            console.warn(`Unhandled data-action: ${action}`);
    }
});

// Centralized change event listener for file import
document.addEventListener('change', async (e) => {
    if (e.target.id === 'import-data' && e.target.files?.length > 0) {
        try {
            await importTelemetryBackup(e.target.files[0]);
            alert("Telemetry vector injection complete.");
            
            // Re-render table if on logger page
            const page = document.body.dataset.page;
            if (page === 'nav-logger' || page === 'logger') {
                renderLoggerTable();
            }
        } catch (err) {
            alert("Corruption detected: " + err.message);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initializeState();
    const page = document.body.dataset.page;
    if (page === 'dashboard') {
        updateDashboardCards();
        renderTelemetryChart();
    }
    if (page === 'nav-logger' || page === 'logger') {
        renderLoggerTable();
    }
});

function renderLoggerTable() {
    const tbody = document.getElementById('logger-table-body');
    if (!tbody) return;
    
    const data = getTelemetry();
    tbody.innerHTML = data.map(item => `
        <tr>
            <td style="padding: 10px;">${item.date}</td>
            <td style="padding: 10px;">${item.ph}</td>
            <td style="padding: 10px;">${item.ec}</td>
            <td style="padding: 10px;">${item.temp}</td>
            <td style="padding: 10px;">
                <button class="delete-btn-container" data-action="delete-record" data-id="${item.id}">Delete</button>
            </td>
        </tr>
    `).join('');
}

let telemetryChart = null;

function renderTelemetryChart() {
    const canvas = document.getElementById('telemetry-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = getTelemetry();
    if (!data || data.length === 0) {
        // clear any existing chart
        if (telemetryChart) {
            telemetryChart.destroy();
            telemetryChart = null;
        }
        return;
    }
    const labels = data.map(item => item.date);
    const phData = data.map(item => item.ph);
    const ecData = data.map(item => item.ec);
    const tempData = data.map(item => item.temp);
    if (telemetryChart) telemetryChart.destroy();
    telemetryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'pH',
                    data: phData,
                    borderColor: '#34D399',
                    backgroundColor: 'rgba(52,211,153,0.1)',
                    tension: 0.3,
                    fill: true,
                },
                {
                    label: 'EC',
                    data: ecData,
                    borderColor: '#60A5FA',
                    backgroundColor: 'rgba(96,165,250,0.1)',
                    tension: 0.3,
                    fill: true,
                },
                {
                    label: 'Temp (°C)',
                    data: tempData,
                    borderColor: '#F472B6',
                    backgroundColor: 'rgba(244,114,182,0.1)',
                    tension: 0.3,
                    fill: true,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { display: true, title: { display: true, text: 'Date' } },
                y: { display: true, title: { display: true, text: 'Value' } }
            }
        }
    });
}