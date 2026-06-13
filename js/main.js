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
    const savedTheme = localStorage.getItem('theme') || 'dark';
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
            if (appContainer) {
                if (window.innerWidth <= 768) {
                    appContainer.classList.toggle('show-sidebar');
                } else {
                    appContainer.classList.toggle('sidebar-collapsed');
                }
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
            alert("Synchronizing telemetry vectors to cloud database... (mocked)");
            break;

        case 'change-password':
            alert("Password change form loaded. (mocked)");
            break;

        case 'save-settings':
            alert("Configuration settings updated successfully. (mocked)");
            break;

        case 'delete-account':
            alert("Warning: Account deletion process initialized. (mocked)");
            break;

        case 'get-help':
            alert("Connecting to Farmspherica support systems... (mocked)");
            break;

        case 'submit-add':
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

    // --- Dashboard initialization ---
    if (page === 'dashboard') {
        updateDashboardCards();
        renderTelemetryChart();

        // Populate extended telemetry display cards
        const data = getTelemetry();
        if (data.length > 0) {
            const latest = data[data.length - 1];
            const airTempEl = document.getElementById('air-temp-display');
            const resTempEl = document.getElementById('res-temp-display');
            const doEl = document.getElementById('do-display');
            const luxEl = document.getElementById('lux-display');
            if (airTempEl) airTempEl.textContent = `${latest.airTemp}°C`;
            if (resTempEl) resTempEl.textContent = `${latest.resTemp}°C`;
            if (doEl) doEl.textContent = `${latest.dissolvedOxygen} mg/L`;
            if (luxEl) luxEl.textContent = `${latest.lux} lx`;
        }
    }

    // --- Logger page initialization ---
    if (page === 'nav-logger' || page === 'logger') {
        renderLoggerTable();
    }

    // --- Add-data form submission (add.html, form id="add-form") ---
    const addForm = document.getElementById('add-form');
    if (addForm) {
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const record = {
                id: crypto.randomUUID(),
                date: document.getElementById('date')?.value || new Date().toISOString().split('T')[0],
                ph: parseFloat(document.getElementById('ph').value),
                ec: parseFloat(document.getElementById('ec').value),
                airTemp: parseFloat(document.getElementById('airTemp').value),
                resTemp: parseFloat(document.getElementById('resTemp').value),
                dissolvedOxygen: parseFloat(document.getElementById('dissolvedOxygen').value),
                lux: parseInt(document.getElementById('lux').value)
            };

            // Biosecurity Alarm Logic: Threshold Validation
            const alarms = [];
            if (record.ph < 5.5 || record.ph > 6.5) alarms.push("pH out of bounds");
            if (record.ec < 1.2 || record.ec > 2.0) alarms.push("EC out of equilibrium");
            if (record.airTemp < 20 || record.airTemp > 26) alarms.push("Air Temp instability");
            if (record.resTemp < 18 || record.resTemp > 22) alarms.push("Reservoir Temp deviation");
            if (record.dissolvedOxygen < 6.0) alarms.push("Low Oxygenation");
            if (record.lux < 15000 || record.lux > 25000) alarms.push("Irradiance mismatch");

            if (alarms.length > 0) {
                console.warn("BIOSECURITY ALARM:", alarms.join(', '));
                alert("Vector Warning: " + alarms.join('. '));
            }

            addRecord(record);
            window.location.href = 'logger.html';
        });
    }

    // --- Ingest form submission (if a separate ingest-form exists) ---
    const ingestForm = document.getElementById('ingest-form');
    if (ingestForm) {
        ingestForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const record = {
                id: crypto.randomUUID(),
                date: new Date().toISOString().split('T')[0],
                ph: parseFloat(document.getElementById('ph').value),
                ec: parseFloat(document.getElementById('ec').value),
                airTemp: parseFloat(document.getElementById('airTemp').value),
                resTemp: parseFloat(document.getElementById('resTemp').value),
                dissolvedOxygen: parseFloat(document.getElementById('dissolvedOxygen').value),
                lux: parseInt(document.getElementById('lux').value)
            };

            // Biosecurity Alarm Logic: Threshold Validation
            const alarms = [];
            if (record.ph < 5.5 || record.ph > 6.5) alarms.push("pH out of bounds");
            if (record.ec < 1.2 || record.ec > 2.0) alarms.push("EC out of equilibrium");
            if (record.airTemp < 20 || record.airTemp > 26) alarms.push("Air Temp instability");
            if (record.resTemp < 18 || record.resTemp > 22) alarms.push("Reservoir Temp deviation");
            if (record.dissolvedOxygen < 6.0) alarms.push("Low Oxygenation");
            if (record.lux < 15000 || record.lux > 25000) alarms.push("Irradiance mismatch");

            if (alarms.length > 0) {
                console.warn("BIOSECURITY ALARM:", alarms.join(', '));
                alert("Vector Warning: " + alarms.join('. '));
            }

            addRecord(record);
            window.location.href = 'logger.html';
        });
    }
});

function renderLoggerTable() {
    const tbody = document.querySelector('tbody');
    const data = getTelemetry();
    if (!tbody) return;

    tbody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 10px;">${item.date}</td>
            <td style="padding: 10px;">${item.ph}</td>
            <td style="padding: 10px;">${item.ec}</td>
            <td style="padding: 10px;">${item.airTemp}°C</td>
            <td style="padding: 10px;">${item.resTemp}°C</td>
            <td style="padding: 10px;">${item.dissolvedOxygen}</td>
            <td style="padding: 10px;">${item.lux}</td>
            <td style="padding: 10px;">
                <button class="delete-btn-container" data-id="${item.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.delete-btn-container').forEach(btn => {
        btn.addEventListener('click', (e) => {
            removeRecord(e.currentTarget.dataset.id);
            renderLoggerTable();
        });
    });
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
    const airTempData = data.map(item => item.airTemp);
    const resTempData = data.map(item => item.resTemp);
    const doData = data.map(item => item.dissolvedOxygen);
    const luxData = data.map(item => item.lux);

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
                    backgroundColor: 'rgba(52,211,153,0.08)',
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y',
                },
                {
                    label: 'EC (mS)',
                    data: ecData,
                    borderColor: '#60A5FA',
                    backgroundColor: 'rgba(96,165,250,0.08)',
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y',
                },
                {
                    label: 'Air Temp (°C)',
                    data: airTempData,
                    borderColor: '#F472B6',
                    backgroundColor: 'rgba(244,114,182,0.08)',
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y',
                },
                {
                    label: 'Res Temp (°C)',
                    data: resTempData,
                    borderColor: '#FBBF24',
                    backgroundColor: 'rgba(251,191,36,0.08)',
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y',
                },
                {
                    label: 'DO (mg/L)',
                    data: doData,
                    borderColor: '#A78BFA',
                    backgroundColor: 'rgba(167,139,250,0.08)',
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y',
                },
                {
                    label: 'Lux',
                    data: luxData,
                    borderColor: '#FB923C',
                    backgroundColor: 'rgba(251,146,60,0.08)',
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y1',
                    borderDash: [5, 3],
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: {
                    display: true,
                    title: { display: true, text: 'Date' }
                },
                y: {
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'pH / EC / Temp / DO' },
                },
                y1: {
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Lux (lx)' },
                    grid: { drawOnChartArea: false },
                }
            }
        }
    });
}