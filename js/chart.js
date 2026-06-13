import { getTelemetry } from './storage.js';

// Custom zero-dependency Canvas charts

export function initAnalyticsCharts() {
    const radarCanvas = document.getElementById('radar-canvas');
    const heatmapCanvas = document.getElementById('heatmap-canvas');
    if (!radarCanvas && !heatmapCanvas) return;

    const dataset = getTelemetry();

    if (radarCanvas) {
        drawRadarChart(radarCanvas, dataset);
        window.addEventListener('resize', () => drawRadarChart(radarCanvas, getTelemetry()));
    }
    if (heatmapCanvas) {
        drawHeatmap(heatmapCanvas, dataset);
        window.addEventListener('resize', () => drawHeatmap(heatmapCanvas, getTelemetry()));
    }
}

// Helper to calculate record deviation for FVI
export function calculateRecordDeviation(record) {
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
    return totalDeviation;
}

// 1. Radar Chart Drawing Logic
function drawRadarChart(canvas, dataset) {
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    // Scale for High-DPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (dataset.length === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NO TELEMETRY RECORDED', width / 2, height / 2);
        return;
    }

    const latest = dataset[dataset.length - 1];
    
    // Parameters configuration
    const labels = ['pH', 'EC', 'Air Temp', 'Res Temp', 'D.O.', 'Lux'];
    const nominal = [6.0, 1.6, 23.0, 20.0, 8.0, 20000];
    const halfSpan = [0.5, 0.4, 3.0, 2.0, 2.0, 5000];
    
    // Ensure properties are loaded correctly
    const actuals = [
        latest.ph || 6.0,
        latest.ec || 1.5,
        latest.airTemp || 22.0,
        latest.resTemp || 20.0,
        latest.dissolvedOxygen || 7.0,
        latest.lux || 18000
    ];

    // Center and Max Radius
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 35;

    // Helper to calculate radar radius for a given actual value
    function getNormalizedRadius(val, nom, span, isDO = false) {
        let deviation = 0;
        if (isDO) {
            if (val < 6.0) {
                deviation = (6.0 - val) / 2.0 + 1.0;
            } else if (val < nom) {
                deviation = (nom - val) / span;
            }
        } else {
            deviation = (val - nom) / span;
        }
        // deviation of 0 maps to radius 0.6. Deviation of +1 maps to 0.85, -1 maps to 0.35.
        let rRatio = 0.6 + (deviation * 0.25);
        return Math.max(Math.min(rRatio, 1.1), 0.1) * maxRadius;
    }

    // Colors based on body theme
    const theme = document.body.dataset.theme || 'dark';
    const isDark = theme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const labelColor = isDark ? '#f1f5f9' : '#0f172a';

    // 1. Draw web grid (concentric hexagons)
    const numWebs = 5;
    for (let w = 1; w <= numWebs; w++) {
        const r = (w / numWebs) * maxRadius * 1.1;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 - Math.PI / 2;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // 2. Draw axis lines
    ctx.strokeStyle = gridColor;
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2;
        const x = centerX + maxRadius * 1.1 * Math.cos(angle);
        const y = centerY + maxRadius * 1.1 * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    // 3. Draw safe comfort zone band (0.35 to 0.85 R)
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2;
        const rOpt = 0.85 * maxRadius;
        const x = centerX + rOpt * Math.cos(angle);
        const y = centerY + rOpt * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2;
        const rOptMin = 0.35 * maxRadius;
        const x = centerX + rOptMin * Math.cos(angle);
        const y = centerY + rOptMin * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    // Clear inner hexagon
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Draw dashed limits
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.setLineDash([4, 4]);
    
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2;
        const rOpt = 0.85 * maxRadius;
        const x = centerX + rOpt * Math.cos(angle);
        const y = centerY + rOpt * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2;
        const rOptMin = 0.35 * maxRadius;
        const x = centerX + rOptMin * Math.cos(angle);
        const y = centerY + rOptMin * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.setLineDash([]); // reset

    // 4. Plot actual telemetry polygon
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2;
        const r = getNormalizedRadius(actuals[i], nominal[i], halfSpan[i], i === 4);
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        points.push({ x, y });
    }

    ctx.beginPath();
    points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, maxRadius);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vertices dots
    points.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#030712' : '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });

    // 5. Draw text labels
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillStyle = labelColor;

    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 2;
        const r = maxRadius * 1.25;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        
        let align = 'center';
        if (Math.cos(angle) > 0.1) align = 'left';
        else if (Math.cos(angle) < -0.1) align = 'right';
        ctx.textAlign = align;

        const valText = i === 5 ? `${actuals[i].toLocaleString()}` : `${actuals[i]}`;
        ctx.fillText(labels[i], x, y - 5);
        
        ctx.fillStyle = textColor;
        ctx.font = '9px monospace';
        ctx.fillText(valText, x, y + 6);
        ctx.fillStyle = labelColor;
        ctx.font = 'bold 10px Inter, sans-serif';
    }
}

// 2. Stacked stability heatmap rendering
function drawHeatmap(canvas, dataset) {
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (dataset.length === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NO TELEMETRY RECORDED', width / 2, height / 2);
        return;
    }

    const theme = document.body.dataset.theme || 'dark';
    const isDark = theme === 'dark';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    const rowNames = ['pH', 'EC', 'Air T', 'Res T', 'D.O.', 'Lux'];
    const rowCount = 6;
    const paddingLeft = 55;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    const rowHeight = chartHeight / rowCount;

    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'right';
    
    rowNames.forEach((name, i) => {
        const y = paddingTop + i * rowHeight + rowHeight / 2 + 3;
        ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
        ctx.fillText(name, paddingLeft - 10, y);

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, paddingTop + i * rowHeight);
        ctx.lineTo(width - paddingRight, paddingTop + i * rowHeight);
        ctx.stroke();
    });
    
    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop + chartHeight);
    ctx.lineTo(width - paddingRight, paddingTop + chartHeight);
    ctx.stroke();

    function getCellColor(val, i) {
        const nominal = [6.0, 1.6, 23.0, 20.0, 8.0, 20000];
        const span = [0.5, 0.4, 3.0, 2.0, 2.0, 5000];
        
        let deviation = 0;
        if (i === 4) { // DO
            if (val < 6.0) {
                deviation = (6.0 - val) / 2.0 + 1.0;
            } else if (val < nominal[i]) {
                deviation = (nominal[i] - val) / span[i];
            }
        } else {
            deviation = Math.abs(val - nominal[i]) / span[i];
        }

        if (deviation <= 1.0) {
            return 'rgba(16, 185, 129, 0.75)'; // green
        } else if (deviation <= 1.2) {
            return 'rgba(245, 158, 11, 0.8)';  // amber
        } else {
            return 'rgba(239, 68, 68, 0.85)';  // red
        }
    }

    const colCount = dataset.length;
    const colWidth = chartWidth / colCount;

    dataset.forEach((record, cIdx) => {
        const recordValues = [
            record.ph || 6.0,
            record.ec || 1.5,
            record.airTemp || 22.0,
            record.resTemp || 20.0,
            record.dissolvedOxygen || 7.0,
            record.lux || 18000
        ];

        const x = paddingLeft + cIdx * colWidth;

        recordValues.forEach((val, rIdx) => {
            const y = paddingTop + rIdx * rowHeight;
            ctx.fillStyle = getCellColor(val, rIdx);
            ctx.fillRect(x + 2, y + 2, colWidth - 4, rowHeight - 4);
        });

        ctx.fillStyle = textColor;
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        
        if (colCount <= 6 || cIdx === 0 || cIdx === colCount - 1 || cIdx % Math.floor(colCount / 4) === 0) {
            const timeStr = record.date.split(' ')[1] || record.date;
            ctx.fillText(timeStr, x + colWidth / 2, paddingTop + chartHeight + 15);
        }
    });

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop);
    ctx.lineTo(paddingLeft, paddingTop + chartHeight);
    ctx.moveTo(width - paddingRight, paddingTop);
    ctx.lineTo(width - paddingRight, paddingTop + chartHeight);
    ctx.stroke();
}