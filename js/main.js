import { initializeState, getTelemetry, addRecord, removeRecord, exportTelemetryBackup, importTelemetryBackup } from './storage.js';

export function updateDashboardCards() {
    const data = getTelemetry();
    if (data.length === 0) return;

    // Get the most recent entry
    const latest = data[data.length - 1];

    // Assuming you have elements with these IDs in index.html
    const phEl = document.getElementById('card-ph');
    const ecEl = document.getElementById('card-ec');
    const tempEl = document.getElementById('card-temp');

    if (phEl) phEl.textContent = latest.ph;
    if (ecEl) ecEl.textContent = latest.ec;
    if (tempEl) tempEl.textContent = latest.temp;
}

document.addEventListener('DOMContentLoaded', () => {
    initializeState();
    setupThemeToggle();

    // Logger page: Add button and Table rendering
    if (document.body.dataset.page === 'logger') {
        renderLoggerTable();
    }

    // Settings page: Export/Import and Theme
    if (document.body.dataset.page === 'settings') {
        const exportBtn = document.getElementById('export-data');
        const importInput = document.getElementById('import-data');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                exportTelemetryBackup();
            });
        }
        
        if (importInput) {
            importInput.addEventListener('change', async (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    await importTelemetryBackup(e.target.files[0]);
                    alert("Telemetry vector injection complete.");
                }
            });
        }
    }
});

function renderLoggerTable() {
    const tbody = document.querySelector('.logger-table-body');
    if (!tbody) return;
    
    const data = getTelemetry();
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 10px;">${item.date}</td>
            <td style="padding: 10px;">${item.ph}</td>
            <td style="padding: 10px;">${item.ec}</td>
            <td style="padding: 10px;">
                <button class="delete-btn-container" data-id="${item.id}">
                    <svg class="bin-icon" viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="M3 6h18v2H3V6zm2 3h14l-1 13H6L5 9zm3 0h2v10H8V9zm4 0h2v10h-2V9zM7 3h10v2H7V3z"/></svg>
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.delete-btn-container').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            removeRecord(id);
            renderLoggerTable();
        });
    });
}

export function setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        document.body.dataset.theme = currentTheme;
        localStorage.setItem('theme', currentTheme);
    });
}