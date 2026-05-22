/* ===================================================================
   CLOUD NETWORK SIMULATOR & TOPOLOGY VISUALIZER (Vanilla JS)
   =================================================================== */

let cpuChartInstance = null;
let perfChartInstance = null;
let networkIntervalId = null;
let decayIntervalId = null;

// Hozirgi ma'lumotlar massivlari (Grafiklar uchun)
const cpuDataPoints = Array(15).fill(10);
const timelineLabels = Array(15).fill('');
const latencyDataPoints = Array(15).fill(15);
const throughputDataPoints = Array(15).fill(0);

function initNetworkSimulator() {
    const API_NET = '/api/network';
    
    // DOM nodes
    const btnSendLoad = document.getElementById('btn-send-load');
    const btnPingTest = document.getElementById('btn-ping-test');
    const btnResetSim = document.getElementById('btn-reset-sim');
    const btnClearLogs = document.getElementById('btn-clear-logs-ui');
    const logBox = document.getElementById('log-monitor-box');
    
    const valLatency = document.getElementById('val-latency');
    const valReqRate = document.getElementById('val-reqrate');
    const valVpn = document.getElementById('val-vpn');
    const kpiActiveNodes = document.getElementById('kpi-active-nodes');
    const cpuBadge = document.getElementById('cpu-badge');

    // Reset old intervals if switching back tabs
    if (networkIntervalId) clearInterval(networkIntervalId);
    if (decayIntervalId) clearInterval(decayIntervalId);

    // ===================================================================
    // INITIALIZE REAL-TIME CHARTS
    // ===================================================================
    const ctxCpu = document.getElementById('realtimeCpuChart');
    if (ctxCpu) {
        if (cpuChartInstance) cpuChartInstance.destroy();
        cpuChartInstance = new Chart(ctxCpu.getContext('2d'), {
            type: 'line',
            data: {
                labels: timelineLabels,
                datasets: [{
                    label: 'CPU Usage (%)',
                    data: cpuDataPoints,
                    borderColor: '#38ef7d',
                    backgroundColor: 'rgba(56, 239, 125, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { min: 0, max: 100, ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.03)' } },
                    x: { display: false }
                }
            }
        });
    }

    const ctxPerf = document.getElementById('networkPerformanceChart');
    if (ctxPerf) {
        if (perfChartInstance) perfChartInstance.destroy();
        perfChartInstance = new Chart(ctxPerf.getContext('2d'), {
            type: 'line',
            data: {
                labels: timelineLabels,
                datasets: [
                    {
                        label: 'Throughput (req/sec)',
                        data: throughputDataPoints,
                        borderColor: '#00c6ff',
                        backgroundColor: 'rgba(0, 198, 255, 0.05)',
                        borderWidth: 2,
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Latency (ms)',
                        data: latencyDataPoints,
                        borderColor: '#8a2be2',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.3,
                        borderDash: [5, 5],
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        position: 'left',
                        title: { display: true, text: 'Throughput (req/s)', color: '#00c6ff' },
                        ticks: { color: '#9ca3af' },
                        grid: { color: 'rgba(255,255,255,0.03)' }
                    },
                    y1: {
                        position: 'right',
                        title: { display: true, text: 'Latency (ms)', color: '#8a2be2' },
                        ticks: { color: '#9ca3af' },
                        grid: { drawOnChartArea: false }
                    },
                    x: { display: false }
                },
                plugins: {
                    legend: {
                        labels: { color: '#f3f4f6' }
                    }
                }
            }
        });
    }

    // ===================================================================
    // METRIC POLLING & SVG INTERACTIVE MODIFICATIONS
    // ===================================================================
    function fetchAndUpdateMetrics() {
        fetch(`${API_NET}/status`)
            .then(res => res.json())
            .then(data => {
                // Update UI text values
                valLatency.textContent = `${data.latency} ms`;
                valReqRate.textContent = `${data.requestRate} req/sec`;
                valVpn.textContent = data.vpnStatus;
                
                if (kpiActiveNodes) {
                    kpiActiveNodes.textContent = `${data.activeInstances} Instance${data.activeInstances > 1 ? 's' : ''}`;
                }
                if (cpuBadge) {
                    cpuBadge.textContent = `${data.cpuUsage}% CPU`;
                    cpuBadge.className = data.cpuUsage > 75 ? 'badge badge-danger' : 'badge badge-success';
                }

                // Update charts data arrays
                cpuDataPoints.shift();
                cpuDataPoints.push(data.cpuUsage);
                
                latencyDataPoints.shift();
                latencyDataPoints.push(data.latency);

                throughputDataPoints.shift();
                throughputDataPoints.push(data.requestRate);

                if (cpuChartInstance) cpuChartInstance.update('none');
                if (perfChartInstance) perfChartInstance.update('none');

                // UPDATE SYSTEM LOGS
                renderLogs(data.logs);

                // DYNAMIC SVG TOPOLOGY MANIPULATION
                updateSvgTopology(data);
            })
            .catch(err => console.error("Tarmoq holatini yangilash xatosi:", err));
    }

    function renderLogs(logs) {
        logBox.innerHTML = '';
        logs.slice().reverse().forEach(log => {
            const line = document.createElement('div');
            line.className = 'log-line';
            
            // Format log with highlights
            let logText = log;
            if (log.includes('Auto-Scaling Trigger') || log.includes('Scale Up')) {
                logText = `<span style="color:#ffb300">${log}</span>`;
            } else if (log.includes('Scale Down')) {
                logText = `<span style="color:#ff4e50">${log}</span>`;
            } else if (log.includes('VPN Tunnel')) {
                logText = `<span style="color:#00c6ff">${log}</span>`;
            } else if (log.includes('VPC tarmog\'i')) {
                logText = `<span style="color:#4364f7">${log}</span>`;
            }
            
            line.innerHTML = logText;
            logBox.appendChild(line);
        });
    }

    function updateSvgTopology(data) {
        const activeInstances = data.activeInstances;
        const reqRate = data.requestRate;

        // Toggle Instance Nodes Class and Colors
        for (let i = 1; i <= 3; i++) {
            const srvNode = document.getElementById(`svg-srv-${i}`);
            if (srvNode) {
                const rect = srvNode.querySelector('rect');
                const text = srvNode.querySelector('text');
                const circle = srvNode.querySelector('circle');
                
                if (i <= activeInstances) {
                    srvNode.setAttribute('class', 'svg-node server-node active');
                    rect.setAttribute('stroke', '#38ef7d');
                    rect.setAttribute('stroke-width', '2.5');
                    rect.setAttribute('fill', 'rgba(56, 239, 125, 0.08)');
                    text.textContent = `CRM-Instance-${i}`;
                    text.setAttribute('fill', 'white');
                    circle.setAttribute('fill', '#38ef7d');
                    circle.setAttribute('class', 'pulse-dot');
                } else {
                    srvNode.setAttribute('class', 'svg-node server-node inactive');
                    rect.setAttribute('stroke', '#718096');
                    rect.setAttribute('stroke-width', '1.5');
                    rect.setAttribute('fill', 'rgba(30, 41, 67, 0.3)');
                    text.textContent = `CRM-Instance-${i}`;
                    text.setAttribute('fill', '#718096');
                    circle.setAttribute('fill', '#a0aec0');
                    circle.removeAttribute('class');
                }
            }
        }

        // Load Balancer Flow Lines and Speed
        const flowUserIgw = document.getElementById('flow-user-igw');
        const flowElbSrv1 = document.getElementById('flow-elb-srv1');
        
        // Speed up animation under high request rates
        if (reqRate > 0) {
            const dur = Math.max(0.4, 2.5 - (reqRate / 150)) + 's';
            if (flowUserIgw) flowUserIgw.querySelector('animateMotion').setAttribute('dur', dur);
            if (flowElbSrv1) flowElbSrv1.querySelector('animateMotion').setAttribute('dur', dur);
        } else {
            if (flowUserIgw) flowUserIgw.querySelector('animateMotion').setAttribute('dur', '2.5s');
            if (flowElbSrv1) flowElbSrv1.querySelector('animateMotion').setAttribute('dur', '3s');
        }

        // Active Load Balancing Lines to VM-2 and VM-3
        const pathElbSrv2 = document.getElementById('path-elb-srv2');
        const pathElbSrv3 = document.getElementById('path-elb-srv3');

        if (activeInstances >= 2) {
            pathElbSrv2.setAttribute('stroke', '#38ef7d');
            pathElbSrv2.setAttribute('stroke-width', '1.5');
            pathElbSrv2.removeAttribute('stroke-dasharray');
        } else {
            pathElbSrv2.setAttribute('stroke', '#a0aec0');
            pathElbSrv2.setAttribute('stroke-width', '1');
            pathElbSrv2.setAttribute('stroke-dasharray', '3 3');
        }

        if (activeInstances >= 3) {
            pathElbSrv3.setAttribute('stroke', '#38ef7d');
            pathElbSrv3.setAttribute('stroke-width', '1.5');
            pathElbSrv3.removeAttribute('stroke-dasharray');
        } else {
            pathElbSrv3.setAttribute('stroke', '#a0aec0');
            pathElbSrv3.setAttribute('stroke-width', '1');
            pathElbSrv3.setAttribute('stroke-dasharray', '3 3');
        }
    }

    // ===================================================================
    // SIMULATOR CONTROL HANDLERS
    // ===================================================================
    
    // 1. Send Load / Stress Test
    btnSendLoad.addEventListener('click', () => {
        // Pulse styling to button
        btnSendLoad.style.transform = 'scale(0.95)';
        setTimeout(() => btnSendLoad.style.transform = 'scale(1)', 100);

        fetch(`${API_NET}/load`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: 300 })
        })
        .then(res => res.json())
        .then(data => {
            fetchAndUpdateMetrics();
            
            // Show notification
            showNotification(`Tizimga +300 ta parallel so'rovlar yuborildi!`);
        })
        .catch(err => console.error(err));
    });

    // 2. Latency/Ping Test
    btnPingTest.addEventListener('click', () => {
        btnPingTest.disabled = true;
        btnPingTest.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Ping yuborilmoqda...`;
        
        // Simulating packet pulse along path
        const flowUserIgw = document.getElementById('flow-user-igw');
        if (flowUserIgw) {
            flowUserIgw.setAttribute('fill', '#ff007f');
            flowUserIgw.setAttribute('r', '6');
        }

        setTimeout(() => {
            fetch(`${API_NET}/status`)
                .then(res => res.json())
                .then(data => {
                    btnPingTest.disabled = false;
                    btnPingTest.innerHTML = `<i class="fa-solid fa-gauge-high"></i> Ping Testini Boshlash`;
                    
                    if (flowUserIgw) {
                        flowUserIgw.setAttribute('fill', '#ff007f');
                        flowUserIgw.setAttribute('r', '3');
                    }
                    
                    showNotification(`Ping testi tugadi: Latency = ${data.latency}ms (RTT). Paket yo'qotilishi = 0%.`, false);
                });
        }, 1200);
    });

    // 3. Reset Sim
    btnResetSim.addEventListener('click', () => {
        if (confirm("Infratuzilmani va simulyatsiya loglarini butunlay tozalab, boshlang'ich holatga qaytarasizmi?")) {
            fetch(`${API_NET}/reset`, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    fetchAndUpdateMetrics();
                    showNotification("Bulut tarmog'i parametrlari nollashtirildi.", false);
                });
        }
    });

    // 4. Clear UI Logs only
    if (btnClearLogs) {
        btnClearLogs.addEventListener('click', () => {
            logBox.innerHTML = '<div class="log-line"><span>Monitor tozalandi.</span></div>';
        });
    }

    // ===================================================================
    // LOOPS / AUTOMATIC DECAY & POLLING
    // ===================================================================
    
    // Fast Polling loop (every 2 sec)
    fetchAndUpdateMetrics(); // first call immediately
    networkIntervalId = setInterval(fetchAndUpdateMetrics, 2000);

    // Automatic Decay rate loop (every 2.5 sec) to scale down automatically
    decayIntervalId = setInterval(() => {
        fetch(`${API_NET}/decay`, { method: 'POST' })
            .then(res => res.json())
            .then(decayData => {
                // Asta sekin tinchlanishni grafikda aks ettirish
            })
            .catch(err => console.error(err));
    }, 2500);
}

// Global scope export for app.js tab navigation
window.initNetworkSimulator = initNetworkSimulator;

// Simple helper inside network.js for custom alert notifications
function showNotification(message, isError = false) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    if (isError) {
        toast.style.borderColor = 'var(--danger)';
        toast.querySelector('i').className = 'fa-solid fa-circle-xmark text-danger';
    } else {
        toast.style.borderColor = 'var(--success)';
        toast.querySelector('i').className = 'fa-solid fa-circle-check text-success';
    }
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
