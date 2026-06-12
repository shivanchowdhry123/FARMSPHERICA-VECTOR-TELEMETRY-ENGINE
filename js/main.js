import { initializeState, getTelemetry, addRecord, removeRecord } from './storage.js';

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
    
    // Render table only if we are on the logger page
    if (document.body.dataset.page === 'nav-logger') {
        renderLoggerTable();
        
        // Add Record Event
        document.getElementById('add-data-link').addEventListener('click', (e) => {
            e.preventDefault();
            const newData = { 
                id: crypto.randomUUID(), 
                timestamp: new Date().toLocaleString(), 
                ph: '7.0', 
                status: 'Manual Entry' 
            };
            addRecord(newData);
            renderLoggerTable();
        });
    }
});

function renderLoggerTable() {
    const tbody = document.querySelector('tbody');
    const data = getTelemetry();
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 10px;">${item.timestamp}</td>
            <td style="padding: 10px;">${item.ph}</td>
            <td style="padding: 10px;">${item.status}</td>
            <td style="padding: 10px;">
                <button class="delete-btn-container" data-id="${item.id}">
                    <svg class="bin-icon" viewBox="0 0 24 24"><path d="M3 6h18v2H3V6zm2 3h14l-1 13H6L5 9zm3 0h2v10H8V9zm4 0h2v10h-2V9zM7 3h10v2H7V3z"/></svg>
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Hook up delete buttons using the new removeRecord function
    document.querySelectorAll('.delete-btn-container').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            removeRecord(id);
            renderLoggerTable();
        });
    });
}