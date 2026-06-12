import { initializeState, getTelemetry, addRecord, removeRecord } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeState();
    
    // Render table only if we are on the logger page
    if (document.body.dataset.page === 'nav-logger') {
        renderLoggerTable();
        
        // Add Record Event
        document.getElementById('add-data-link').addEventListener('click', (e) => {
            e.preventDefault();
            // Unified Schema as per firebase_studio_brief.md
            const newData = { 
                id: crypto.randomUUID(), 
                date: new Date().toISOString().split('T')[0],
                ph: 7.0, 
                temp: 22.0,
                ec: 1.5,
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
            <td style="padding: 10px;">${item.date}</td>
            <td style="padding: 10px;">${item.ph}</td>
            <td style="padding: 10px;">${item.ec}</td>
            <td style="padding: 10px;">
                <button class="delete-btn-container" data-id="${item.id}">
                    <svg class="bin-icon" viewBox="0 0 24 24"><path d="M3 6h18v2H3V6zm2 3h14l-1 13H6L5 9zm3 0h2v10H8V9zm4 0h2v10h-2V9zM7 3h10v2H7V3z"/></svg>
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Hook up delete buttons
    document.querySelectorAll('.delete-btn-container').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            removeRecord(id);
            renderLoggerTable();
        });
    });
}