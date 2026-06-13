import { initializeState, getTelemetry, addRecord, removeRecord, exportTelemetryBackup, importTelemetryBackup } from './storage.js';
import { initAnalyticsCharts, calculateRecordDeviation } from './chart.js';

export function calculateFVI(record) {
    if (!record) return 0;
    const metrics = [
        { val: record.ph, target: 6.0, span: 0.5 },
        { val: record.ec, target: 1.6, span: 0.4 },
        { val: record.airTemp, target: 23.0, span: 3.0 },
        { val: record.resTemp, target: 20.0, span: 2.0 },
        { val: record.dissolvedOxygen, target: 8.0, span: 2.0, isAtLeast: true },
        { val: record.lux, target: 20000, span: 5000 }
    ];

    let totalDeviation = 0;
    metrics.forEach(m => {
        let dev = 0;
        if (m.isAtLeast) {
            if (m.val < 6.0) {
                dev = (6.0 - m.val) / 2.0 + 1.0;
            } else if (m.val < m.target) {
                dev = (m.target - m.val) / m.span;
            }
        } else {
            dev = Math.abs(m.val - m.target) / m.span;
        }
        totalDeviation += Math.min(Math.max(dev, 0), 1.5);
    });

    const fvi = 100 * (1 - (totalDeviation / 6));
    return Math.round(Math.max(Math.min(fvi, 100), 0) * 10) / 10;
}

export function checkTelemetryThresholds(record) {
    if (!record) return { active: false, alarms: [], remediation: [] };
    const alarms = [];
    const remediation = [];

    if (record.ph < 5.5) {
        alarms.push("pH level too low");
        remediation.push("Inject Potassium Hydroxide (pH Up) buffer injection system.");
    } else if (record.ph > 6.5) {
        alarms.push("pH level too high");
        remediation.push("Inject Phosphoric Acid (pH Down) buffering agent.");
    }

    if (record.ec < 1.2) {
        alarms.push("Electrical Conductivity (EC) nutrient depletion");
        remediation.push("Increase secondary dosing line concentration target (+10%).");
    } else if (record.ec > 2.0) {
        alarms.push("EC nutrient saturation");
        remediation.push("Dilute reservoir with clean RO water recirculation feed.");
    }

    if (record.airTemp < 20) {
        alarms.push("Air Temperature below comfort zone");
        remediation.push("Enable HVAC stage-1 heat pump cycles.");
    } else if (record.airTemp > 26) {
        alarms.push("Air Temperature exceeds comfort threshold");
        remediation.push("Initiate secondary extractor fan arrays and intake cooling valves.");
    }

    if (record.resTemp < 18) {
        alarms.push("Nutrient reservoir water temperature too low");
        remediation.push("Activate in-line reservoir heating elements.");
    } else if (record.resTemp > 22) {
        alarms.push("Nutrient reservoir temperature exceeds stable limits");
        remediation.push("Engage chiller loop pump system stage-2.");
    }

    if (record.dissolvedOxygen < 6.0) {
        alarms.push("Critical Low Oxygenation (Dissolved Oxygen)");
        remediation.push("Increase venturi nozzle pressure and activate backup oxygen pump.");
    }

    if (record.lux < 15000) {
        alarms.push("Irradiance deficiency (Lux)");
        remediation.push("Increase overhead LED lighting intensity cycle (+15%).");
    } else if (record.lux > 25000) {
        alarms.push("Irradiance overload (Lux)");
        remediation.push("Dim overhead LED light racks to safe absorption ceiling.");
    }

    return {
        active: alarms.length > 0,
        alarms: alarms,
        remediation: remediation
    };
}

export function triggerBiosecurityBanner(alarmDetails) {
    let banner = document.getElementById('biosecurity-banner-alert');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'biosecurity-banner-alert';
        banner.className = 'biosecurity-banner';
        document.body.appendChild(banner);
    }

    if (!alarmDetails || !alarmDetails.active) {
        banner.classList.remove('show');
        return;
    }

    banner.innerHTML = `
        <div class="biosecurity-banner-header">
            <span>⚠️ Biosecurity Warning</span>
            <button class="biosecurity-banner-close" onclick="document.getElementById('biosecurity-banner-alert').classList.remove('show')">×</button>
        </div>
        <div class="biosecurity-banner-body">
            <strong>Active Deviations:</strong>
            <ul style="margin-top: 5px; margin-left: 15px; font-size: 0.82rem; list-style-type: square;">
                ${alarmDetails.alarms.map(a => `<li>${a}</li>`).join('')}
            </ul>
            <div style="margin-top: 8px; font-size: 0.82rem; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 5px;">
                <strong>Protocols:</strong> ${alarmDetails.remediation.join(' · ')}
            </div>
        </div>
    `;

    setTimeout(() => {
        banner.classList.add('show');
    }, 100);
}

export function updateDashboardCards() {
    const data = getTelemetry();
    if (data.length === 0) return;

    // Get the most recent entry
    const latest = data[data.length - 1];

    const fviEl = document.getElementById('card-fvi');
    const phEl = document.getElementById('card-ph');
    const ecEl = document.getElementById('card-ec');
    const airTempEl = document.getElementById('card-air-temp');
    const resTempEl = document.getElementById('card-res-temp');
    const doEl = document.getElementById('card-do');
    const luxEl = document.getElementById('card-lux');

    if (fviEl) fviEl.textContent = `${calculateFVI(latest)}%`;
    if (phEl) phEl.textContent = latest.ph;
    if (ecEl) ecEl.textContent = `${latest.ec} mS`;
    if (airTempEl) airTempEl.textContent = `${latest.airTemp} °C`;
    if (resTempEl) resTempEl.textContent = `${latest.resTemp} °C`;
    if (doEl) doEl.textContent = `${latest.dissolvedOxygen} mg/L`;
    if (luxEl) luxEl.textContent = `${latest.lux.toLocaleString()} lx`;
}

export function updateTerminalLogs() {
    const terminalBody = document.getElementById('terminal-body');
    if (!terminalBody) return;

    const data = getTelemetry();
    let logsHTML = '';

    if (data.length === 0) {
        logsHTML = `<div style="color: var(--text-secondary);">[${new Date().toISOString().replace('T', ' ').slice(0, 19)}] SYSTEM: Database is empty. Ready for diagnostic telemetry ingestion.</div>`;
        terminalBody.innerHTML = logsHTML;
        return;
    }

    let warningActive = false;

    data.forEach((item) => {
        const timestamp = item.date;
        
        // Ingestion Log
        logsHTML += `<div style="color: var(--text-secondary);">[${timestamp}] INFO: Ingested telemetry vector (ID: ${item.id.slice(0, 8)}...) from Bio-Grid Rack A.</div>`;
        
        // Data readout Log
        logsHTML += `<div style="color: var(--sidebar-text-inactive);">[${timestamp}] DATA: pH: ${item.ph} · EC: ${item.ec} mS · AirT: ${item.airTemp}°C · ResT: ${item.resTemp}°C · DO: ${item.dissolvedOxygen} mg/L · Lux: ${item.lux.toLocaleString()} lx</div>`;

        // Check outliers
        const status = checkTelemetryThresholds(item);
        if (status.active) {
            warningActive = true;
            logsHTML += `<div style="color: var(--danger); font-weight: bold;">[${timestamp}] WARNING: Biosecurity threshold breached! Active alarms: [${status.alarms.join(', ')}]</div>`;
            logsHTML += `<div style="color: var(--warning);">[${timestamp}] ALARM: Remediation Protocol: ${status.remediation.join(' · ')}</div>`;
        } else if (warningActive) {
            warningActive = false;
            logsHTML += `<div style="color: var(--success); font-weight: bold;">[${timestamp}] SUCCESS: All parameters restored to normal. Alarms resolved.</div>`;
        }
    });

    terminalBody.innerHTML = logsHTML;
    // Auto-scroll to bottom
    terminalBody.scrollTop = terminalBody.scrollHeight;
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

        case 'export-selected':
            exportSelectedTelemetry();
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

    // --- Global Biosecurity Banner Check ---
    const data = getTelemetry();
    if (data.length > 0) {
        const latest = data[data.length - 1];
        const alarms = checkTelemetryThresholds(latest);
        triggerBiosecurityBanner(alarms);
    }

    // --- Dashboard initialization ---
    if (page === 'dashboard') {
        updateDashboardCards();
        updateTerminalLogs();
        renderTelemetryChart();
    }

    // --- Analytics page initialization ---
    if (page === 'analytics') {
        const fviEl = document.getElementById('analytics-fvi');
        if (fviEl && data.length > 0) {
            const latest = data[data.length - 1];
            const totalDeviation = calculateRecordDeviation(latest);
            const fvi = Math.max(Math.min(100 * (1 - (totalDeviation / 6)), 100), 0);
            fviEl.textContent = `${fvi.toFixed(1)}%`;
        }
        initAnalyticsCharts();
    }

    // --- Logger page initialization ---
    if (page === 'nav-logger' || page === 'logger') {
        renderLoggerTable();
    }

    // --- Nodes page initialization ---
    if (page === 'nodes') {
        if (data.length > 0) {
            const latest = data[data.length - 1];
            const alarms = checkTelemetryThresholds(latest);
            if (alarms.active) {
                const nodesToWarn = ['Alpha', 'Delta', 'Eta', 'Kappa'];
                nodesToWarn.forEach(nodeId => {
                    const card = document.querySelector(`.node-card[data-node="${nodeId}"]`);
                    if (card) {
                        card.dataset.status = 'warning';
                        const statusEl = card.querySelector('.node-status');
                        if (statusEl) statusEl.textContent = 'Warning Alarm';
                    }
                });
            }
        }
    }

    // --- Add-data form submission (add.html, form id="add-form") ---
    const addForm = document.getElementById('add-form');
    if (addForm) {
        // Set today's date as default
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
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

            addRecord(record);
            window.location.href = 'logger.html';
        });
    }

    // --- Ingest form submission ---
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

            addRecord(record);
            window.location.href = 'logger.html';
        });
    }
});

export function updateExportButtonVisibility() {
    const exportBtn = document.getElementById('export-selected-btn');
    if (!exportBtn) return;
    const checkedCount = document.querySelectorAll('.row-checkbox:checked').length;
    if (checkedCount > 0) {
        exportBtn.style.display = 'inline-flex';
    } else {
        exportBtn.style.display = 'none';
    }
}

export function exportSelectedTelemetry() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkedBoxes.length === 0) return;

    const selectedIds = Array.from(checkedBoxes).map(cb => cb.dataset.id);
    const allTelemetry = getTelemetry();
    const filteredTelemetry = allTelemetry.filter(item => selectedIds.includes(item.id));

    const blob = new Blob([JSON.stringify(filteredTelemetry, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `farmspherica_selected_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function renderLoggerTable() {
    const tbody = document.querySelector('tbody');
    const data = getTelemetry();
    if (!tbody) return;

    // Update global biosecurity banner if data changed
    const latest = data[data.length - 1];
    const alarms = checkTelemetryThresholds(latest);
    triggerBiosecurityBanner(alarms);

    tbody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 10px; text-align: center;">
                <input type="checkbox" class="row-checkbox" data-id="${item.id}">
            </td>
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

    // Reset select-all and export button states
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.onchange = (e) => {
            const checkboxes = document.querySelectorAll('.row-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateExportButtonVisibility();
        };
    }
    updateExportButtonVisibility();

    // Bind change listener to each row checkbox
    document.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.onchange = () => {
            updateExportButtonVisibility();
            if (selectAllCheckbox) {
                const total = document.querySelectorAll('.row-checkbox').length;
                const checked = document.querySelectorAll('.row-checkbox:checked').length;
                selectAllCheckbox.checked = (total === checked && total > 0);
            }
        };
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