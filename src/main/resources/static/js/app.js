/* ===================================================================
   CRM & PORTAL CORE CONTROLLER (Vanilla JS)
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // API endpoints
    const API_CUSTOMERS = '/api/customers';
    const API_USERS = '/api/users';
    
    // Auth State
    let currentUser = null;
    let crmChart = null;

    // UI elements
    const loginSection = document.getElementById('login-section');
    const appWorkspace = document.getElementById('app-workspace');
    const loginForm = document.getElementById('login-form');
    
    const tabItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    // Toast
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');

    // ===================================================================
    // SECURITY & AUTH CHECK LOGIC
    // ===================================================================
    function checkSession() {
        fetch(`${API_USERS}/me`)
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Autentifikatsiya o'tilmagan");
            })
            .then(user => {
                currentUser = user;
                setupWorkspaceForRole();
            })
            .catch(() => {
                showLoginScreen();
            });
    }

    function showLoginScreen() {
        loginSection.style.display = 'flex';
        appWorkspace.style.display = 'none';
        currentUser = null;
    }

    // Login Form Submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        fetch(`${API_USERS}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => {
            if (res.ok) return res.json();
            throw new Error("Login yoki parol xato!");
        })
        .then(data => {
            currentUser = { username: data.username, fullName: data.fullName, role: data.role };
            loginForm.reset();
            showNotification(`Tizimga muvaffaqiyatli kirildi! Xush kelibsiz, ${currentUser.fullName}.`);
            setupWorkspaceForRole();
        })
        .catch(err => {
            showNotification(err.message, true);
        });
    });

    // Logout Action
    document.getElementById('btn-logout').addEventListener('click', () => {
        if (confirm("Tizimdan chiqmoqchimisiz?")) {
            fetch(`${API_USERS}/logout`, { method: 'POST' })
                .then(() => {
                    showNotification("Sessiya yopildi.");
                    showLoginScreen();
                })
                .catch(() => showLoginScreen());
        }
    });

    // ===================================================================
    // ROLE-BASED ACCESS CONTROL (RBAC) - FRONTEND FILTERS
    // ===================================================================
    function setupWorkspaceForRole() {
        loginSection.style.display = 'none';
        appWorkspace.style.display = 'flex';

        // Update Header profiles
        document.getElementById('user-display-name').textContent = currentUser.fullName;
        document.getElementById('user-display-role').textContent = currentUser.role;
        
        const roleIcon = document.getElementById('user-role-icon');
        const roleUpper = currentUser.role?.toUpperCase();
        if (roleUpper === 'SUPER_ADMIN') {
            roleIcon.className = 'fa-solid fa-user-shield text-success';
        } else if (roleUpper === 'CEO') {
            roleIcon.className = 'fa-solid fa-user-tie text-secondary';
        } else {
            roleIcon.className = 'fa-solid fa-user-gear text-secondary';
        }

        // Hide/Show tab items based on roles
        const tabNetwork = document.getElementById('nav-tab-network');
        const tabStaff = document.getElementById('nav-tab-staff');
        
        const cardInfra = document.getElementById('kpi-card-infra');
        const chartCpu = document.getElementById('dashboard-cpu-card');
        const btnGoNetwork = document.getElementById('btn-goto-network');
        
        // Reset defaults
        tabNetwork.style.display = 'flex';
        tabStaff.style.display = 'flex';
        cardInfra.style.display = 'flex';
        chartCpu.style.display = 'flex';
        if (btnGoNetwork) btnGoNetwork.style.display = 'inline-flex';

        // 1. CEO Filter: No networking, No database changes, View only!
        if ((currentUser && currentUser.role && currentUser.role.toUpperCase()) === 'CEO') {
            tabNetwork.style.display = 'none'; // No cloud simulator!
            cardInfra.style.display = 'none';
            chartCpu.style.display = 'none';
            if (btnGoNetwork) btnGoNetwork.style.display = 'none';
            
            // Hide customer modifications
            document.getElementById('btn-add-customer').style.display = 'none';
            document.getElementById('btn-quick-add').style.display = 'none';
            
            // Staff management for CEO: View only, no add button
            document.getElementById('staff-header-actions').querySelector('button').style.display = 'none';
        } 
        // 2. MANAGER Filter: No networking, No staff management, Can CRUD Customers!
        else if (roleUpper === 'MANAGER') {
            tabNetwork.style.display = 'none'; // No cloud simulator!
            tabStaff.style.display = 'none'; // No staff manager!
            cardInfra.style.display = 'none';
            chartCpu.style.display = 'none';
            if (btnGoNetwork) btnGoNetwork.style.display = 'none';
            
            // Customers
            document.getElementById('btn-add-customer').style.display = 'inline-flex';
            document.getElementById('btn-quick-add').style.display = 'inline-flex';
        }
        // 3. SUPER_ADMIN Filter: Full Access
        else {
            document.getElementById('btn-add-customer').style.display = 'inline-flex';
            document.getElementById('btn-quick-add').style.display = 'inline-flex';
            document.getElementById('staff-header-actions').querySelector('button').style.display = 'inline-flex';
        }

        // Return to dashboard first
        document.querySelector('[data-tab="dashboard"]').click();
    }

    // ===================================================================
    // TAB NAVIGATION
    // ===================================================================
    tabItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            
            // Switch active tab item
            tabItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Switch active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            const activeContent = document.getElementById(`tab-${targetTab}`);
            if (activeContent) activeContent.classList.add('active');
            
            // Update Headers dynamic
            if (targetTab === 'dashboard') {
                pageTitle.textContent = "Boshqaruv Paneli";
                pageSubtitle.textContent = "Biznes tizimlari va xodimlar unumdorligi real-vaqt statistikasi";
                loadDashboardStats();
            } else if (targetTab === 'customers') {
                pageTitle.textContent = "Mijozlar Bazasi";
                pageSubtitle.textContent = "Kompaniya mijozlari ro'yxati va ular bilan ishlash boshqaruvi";
                loadCustomers();
            } else if (targetTab === 'staff') {
                pageTitle.textContent = "Xodimlar Boshqaruvi";
                pageSubtitle.textContent = "Tizim foydalanuvchilari, mas'uliyatlar va rollarni boshqarish";
                loadStaff();
            } else if (targetTab === 'network') {
                pageTitle.textContent = "Bulutli Tarmoq Monitori";
                pageSubtitle.textContent = "VPC tarmoq topologiyasi, yuklamalarni taqsimlash va auto-scaling simulyatsiyasi (Faqat Admin)";
                if (typeof initNetworkSimulator === 'function') {
                    initNetworkSimulator();
                }
            }
        });
    });

    // ===================================================================
    // TOAST NOTIFICATIONS
    // ===================================================================
    function showNotification(message, isError = false) {
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

    // ===================================================================
    // TAB 1: CEO & ADMIN DASHBOARD METRICS AND CHARTS
    // ===================================================================
    function loadDashboardStats() {
        fetch(`${API_CUSTOMERS}/stats`)
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Xatolik");
            })
            .then(stats => {
                // KPIs
                document.getElementById('kpi-total-customers').textContent = stats.total || 0;
                document.getElementById('kpi-active-customers').textContent = stats.active || 0;
                document.getElementById('kpi-pending-customers').textContent = (stats.lead + stats.contacted + stats.proposal) || 0;
                
                // Active Ratio
                document.getElementById('kpi-active-ratio').textContent = `<i class="fa-solid fa-arrow-trend-up"></i> ${stats.activeRatio}% Active Hamkorlar`;

                // Render Chart.js
                renderCrmChart(stats);

                // CEO: Performance Table (Kim nechta mijoz, nechta suhbat)
                renderCeoPerformanceTable(stats.staffPerformance, stats.staffCustomers);

                // CEO: Recent interaction audit log
                renderCeoAuditLogs(stats.recentInteractions);
            })
            .catch(err => {
                console.error("Dashboard yuklashda xatolik:", err);
                showNotification("Statistikalarni yuklashda xatolik yuz berdi.", true);
            });
    }

    function renderCrmChart(stats) {
        const ctx = document.getElementById('crmStatsChart').getContext('2d');
        if (crmChart) crmChart.destroy();

        crmChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Yangi (Lead)', 'Bog\'lanilgan', 'Taklif (Proposal)', 'Faol (Active)', 'Faol Emas (Inactive)'],
                datasets: [{
                    data: [stats.lead || 0, stats.contacted || 0, stats.proposal || 0, stats.active || 0, stats.inactive || 0],
                    backgroundColor: [
                        'rgba(67, 100, 247, 0.65)',
                        'rgba(255, 179, 0, 0.65)',
                        'rgba(138, 43, 226, 0.65)',
                        'rgba(56, 239, 125, 0.65)',
                        'rgba(255, 78, 80, 0.65)'
                    ],
                    borderColor: [
                        '#4364f7',
                        '#ffb300',
                        '#8a2be2',
                        '#38ef7d',
                        '#ff4e50'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#f3f4f6', font: { family: 'Inter', size: 12 } }
                    }
                },
                cutout: '65%'
            }
        });
    }

    function renderCeoPerformanceTable(perf, assigned) {
        const body = document.getElementById('ceo-performance-body');
        body.innerHTML = '';

        // Collect all staff names
        const allNames = new Set([...Object.keys(perf || {}), ...Object.keys(assigned || {})]);

        if (allNames.size === 0) {
            body.innerHTML = '<tr><td colspan="3" class="text-center">Xodimlar faoliyati topilmadi.</td></tr>';
            return;
        }

        allNames.forEach(name => {
            const row = document.createElement('tr');
            const talksCount = perf[name] || 0;
            const custCount = assigned[name] || 0;

            row.innerHTML = `
                <td><strong>${name}</strong></td>
                <td><span class="text-success" style="font-weight:600;"><i class="fa-solid fa-comments"></i> ${talksCount} ta suhbat</span></td>
                <td><span class="text-success" style="font-weight:600;"><i class="fa-solid fa-users"></i> ${custCount} ta mijoz</span></td>
            `;
            body.appendChild(row);
        });
    }

    function renderCeoAuditLogs(interactions) {
        const container = document.getElementById('dashboard-audit-logs');
        container.innerHTML = '';

        if (!interactions || interactions.length === 0) {
            container.innerHTML = '<div class="log-line"><span>Muloqotlar tarixi mavjud emas.</span></div>';
            return;
        }

        interactions.forEach(i => {
            const line = document.createElement('div');
            line.className = 'log-line';
            
            const date = new Date(i.time);
            const timeStr = date.toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'});

            line.innerHTML = `
                <span>[${timeStr}]</span> <strong>${i.staffName}</strong> -> 
                <span style="color:var(--secondary)">${i.customerName} (${i.customerCompany || 'Alohida'})</span> bilan 
                <strong style="color:var(--warning)">${i.type}</strong> orqali bog'landi: "${i.notes}"
            `;
            container.appendChild(line);
        });
    }

    // ===================================================================
    // TAB 2: CUSTOMERS CRUD & INTERACTIONS HISTORY (CORE BUSINESS)
    // ===================================================================
    function loadCustomers(search = '') {
        const url = search ? `${API_CUSTOMERS}?search=${encodeURIComponent(search)}` : API_CUSTOMERS;
        
        fetch(url)
            .then(res => res.json())
            .then(customers => {
                const body = document.getElementById('customers-list-body');
                body.innerHTML = '';
                
                if (customers.length === 0) {
                    body.innerHTML = '<tr><td colspan="8" class="text-center">Hech qanday mijoz topilmadi.</td></tr>';
                    return;
                }

                customers.forEach(c => {
                    const row = document.createElement('tr');
                    
                    const date = new Date(c.createdAt);
                    const formattedDate = date.toLocaleDateString('uz-UZ') + ' ' + date.toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'});

                    let statusClass = 'status-lead';
                    let statusText = 'Lead';
                    switch(c.status.toLowerCase()) {
                        case 'lead': statusClass = 'status-lead'; statusText = 'Yangi (Lead)'; break;
                        case 'contacted': statusClass = 'status-contacted'; statusText = 'Bog\'lanilgan'; break;
                        case 'proposal': statusClass = 'status-proposal'; statusText = 'Taklif'; break;
                        case 'active': statusClass = 'status-active'; statusText = 'Hamkor (Active)'; break;
                        case 'inactive': statusClass = 'status-inactive'; statusText = 'Faol Emas'; break;
                    }

                    const staffName = c.assignedTo ? c.assignedTo.fullName : '<span style="color:var(--text-muted)">Biriktirilmagan</span>';

                    // CEO check for read only action buttons
                    let actionButtons = `
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn-icon edit" style="background:rgba(0,198,255,0.15); color:var(--secondary);" data-id="${c.id}" title="Muloqotlar Tarixi / Yangi yozish"><i class="fa-solid fa-comments"></i> Tarix</button>
                    `;
                    
                    if ((currentUser && currentUser.role && currentUser.role.toUpperCase()) !== 'CEO') {
                        actionButtons += `
                            <button class="btn-icon edit" data-id="${c.id}" title="Tahrirlash"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-icon delete" data-id="${c.id}" title="O'chirish"><i class="fa-solid fa-trash-can"></i></button>
                        `;
                    } else {
                        // CEO read only Interactions view
                        actionButtons += `
                            <button class="btn-icon edit" style="border-color:rgba(255,255,255,0.05);" data-id="${c.id}" title="Muloqotlar Tarixi (Ko'rish)"><i class="fa-solid fa-eye"></i> Ko'rish</button>
                        `;
                    }
                    actionButtons += `</div>`;

                    row.innerHTML = `
                        <td><strong>#${c.id}</strong></td>
                        <td><span style="font-weight: 500;">${c.name}</span></td>
                        <td>${c.company || '<span style="color:var(--text-muted)">Kiritilmagan</span>'}</td>
                        <td>${c.email}</td>
                        <td>${c.phone || '<span style="color:var(--text-muted)">Kiritilmagan</span>'}</td>
                        <td><span class="status-pill ${statusClass}">${statusText}</span></td>
                        <td><strong style="color:var(--secondary); font-size:0.85rem;">${staffName}</strong></td>
                        <td>${actionButtons}</td>
                    `;
                    body.appendChild(row);
                });

                attachCustomerTableActionListeners();
            })
            .catch(err => {
                console.error(err);
                showNotification("Mijozlarni yuklashda xatolik.", true);
            });
    }

    if (document.getElementById('customer-search-input')) {
        document.getElementById('customer-search-input').addEventListener('input', (e) => {
            loadCustomers(e.target.value);
        });
    }

    // Customer Form Dialog logic
    const customerModal = document.getElementById('customer-modal');
    const customerForm = document.getElementById('customer-form');

    function openCustomerModal(id = null) {
        customerForm.reset();
        document.getElementById('customer-id').value = '';
        
        // Load Staff lists to dropdown
        const assignSelect = document.getElementById('cust-assign');
        assignSelect.innerHTML = '';

        fetch(API_USERS)
            .then(res => res.json())
            .then(users => {
                users.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = u.id;
                    opt.textContent = `${u.fullName} (${u.role})`;
                    assignSelect.appendChild(opt);
                });

                if (id) {
                    document.getElementById('modal-title').textContent = "Mijoz ma'lumotlarini tahrirlash";
                    fetch(`${API_CUSTOMERS}/${id}`)
                        .then(res => res.json())
                        .then(c => {
                            document.getElementById('customer-id').value = c.id;
                            document.getElementById('cust-name').value = c.name;
                            document.getElementById('cust-company').value = c.company || '';
                            document.getElementById('cust-email').value = c.email;
                            document.getElementById('cust-phone').value = c.phone || '';
                            document.getElementById('cust-status').value = c.status;
                            document.getElementById('cust-notes').value = c.notes || '';
                            if (c.assignedTo) assignSelect.value = c.assignedTo.id;
                            
                            customerModal.classList.add('active');
                        });
                } else {
                    document.getElementById('modal-title').textContent = "Yangi Mijoz Qo'shish";
                    customerModal.classList.add('active');
                }
            });
    }

    document.getElementById('btn-add-customer').addEventListener('click', () => openCustomerModal());
    document.getElementById('btn-quick-add').addEventListener('click', () => openCustomerModal());
    document.getElementById('btn-close-modal').addEventListener('click', () => customerModal.classList.remove('active'));
    document.getElementById('btn-cancel-modal').addEventListener('click', () => customerModal.classList.remove('active'));

    customerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('customer-id').value;
        const customerData = {
            name: document.getElementById('cust-name').value,
            company: document.getElementById('cust-company').value,
            email: document.getElementById('cust-email').value,
            phone: document.getElementById('cust-phone').value,
            status: document.getElementById('cust-status').value,
            notes: document.getElementById('cust-notes').value,
            assignedTo: { id: document.getElementById('cust-assign').value }
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_CUSTOMERS}/${id}` : API_CUSTOMERS;

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerData)
        })
        .then(res => {
            if (res.ok) {
                customerModal.classList.remove('active');
                loadCustomers();
                loadDashboardStats();
                showNotification(id ? "Mijoz tahrirlandi!" : "Yangi mijoz qo'shildi!");
            } else {
                showNotification("Xatolik yuz berdi. Email takrorlanmas bo'lishi lozim.", true);
            }
        });
    });

    function attachCustomerTableActionListeners() {
        // Edit / History Button Handlers
        document.querySelectorAll('.btn-icon.edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const isHistoryBtn = btn.textContent.includes('Tarix') || btn.textContent.includes('Ko\'rish');

                if (isHistoryBtn) {
                    openInteractionsModal(id);
                } else {
                    openCustomerModal(id);
                }
            });
        });

        // Delete Handler
        document.querySelectorAll('.btn-icon.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm("Mijozni va u bilan bog'liq barcha muloqotlar tarixini butunlay o'chirasizmi?")) {
                    fetch(`${API_CUSTOMERS}/${id}`, { method: 'DELETE' })
                        .then(res => {
                            if (res.ok) {
                                loadCustomers();
                                loadDashboardStats();
                                showNotification("Mijoz o'chirildi.");
                            } else {
                                showNotification("Mijozni o'chirish taqiqlangan.", true);
                            }
                        });
                }
            });
        });
    }

    // ===================================================================
    // INTERACTIONS HISTORY & TIMELINE MODAL LOGIC
    // ===================================================================
    const interModal = document.getElementById('interactions-modal');
    const interForm = document.getElementById('interaction-form');
    const interTimelineBox = document.getElementById('interactions-timeline-box');
    const newInteractionSection = document.getElementById('new-interaction-section');

    function openInteractionsModal(customerId) {
        interForm.reset();
        document.getElementById('inter-customer-id').value = customerId;
        
        // Hide new interaction form if CEO (Read-only)
        if (currentUser && currentUser.role && currentUser.role.toUpperCase() === 'CEO') {
            newInteractionSection.style.display = 'none';
        } else {
            newInteractionSection.style.display = 'block';
        }

        // Get customer profile to set titles
        fetch(`${API_CUSTOMERS}/${customerId}`)
            .then(res => res.json())
            .then(c => {
                document.getElementById('inter-modal-title').textContent = `${c.name} - Muloqotlar Auditi`;
                document.getElementById('inter-modal-subtitle').textContent = `${c.company || 'Alohidaga'} biriktirilgan xodim: ${c.assignedTo ? c.assignedTo.fullName : 'Biriktirilmagan'}`;
                
                // Fetch timeline logs
                loadInteractionsTimeline(customerId);
                interModal.classList.add('active');
            });
    }

    function loadInteractionsTimeline(customerId) {
        fetch(`${API_CUSTOMERS}/${customerId}/interactions`)
            .then(res => res.json())
            .then(list => {
                interTimelineBox.innerHTML = '';
                
                if (list.length === 0) {
                    interTimelineBox.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 2rem;">Boshlang\'ich muloqot tarixi mavjud emas.</div>';
                    return;
                }

                list.forEach(i => {
                    const item = document.createElement('div');
                    item.className = 'timeline-item';
                    
                    const date = new Date(i.createdAt);
                    const dateStr = date.toLocaleDateString('uz-UZ') + ' ' + date.toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'});

                    let badgeClass = 'badge-system';
                    let iconClass = 'fa-solid fa-server';

                    switch (i.type.toLowerCase()) {
                        case 'telefon': badgeClass = 'badge-phone'; iconClass = 'fa-solid fa-phone'; break;
                        case 'email': badgeClass = 'badge-email'; iconClass = 'fa-solid fa-envelope'; break;
                        case 'uchrashuv': badgeClass = 'badge-meeting'; iconClass = 'fa-solid fa-handshake'; break;
                        case 'taklif': badgeClass = 'badge-proposal'; iconClass = 'fa-solid fa-file-invoice-dollar'; break;
                        case 'tizim': badgeClass = 'badge-system'; iconClass = 'fa-solid fa-gears'; break;
                    }

                    item.innerHTML = `
                        <div class="timeline-badge ${badgeClass}"><i class="${iconClass}"></i></div>
                        <div class="timeline-content">
                            <h4>${i.type} <span class="timeline-time">${dateStr}</span></h4>
                            <p>${i.notes}</p>
                            <span class="timeline-staff"><i class="fa-solid fa-user-pen"></i> Qayd etdi: ${i.user.fullName} (${i.user.role})</span>
                        </div>
                    `;
                    interTimelineBox.appendChild(item);
                });
            });
    }

    document.getElementById('btn-close-inter-modal').addEventListener('click', () => interModal.classList.remove('active'));

    // Submit new Interaction Form
    interForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const customerId = document.getElementById('inter-customer-id').value;
        const interData = {
            type: document.getElementById('inter-type').value,
            notes: document.getElementById('inter-notes').value
        };

        fetch(`${API_CUSTOMERS}/${customerId}/interactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(interData)
        })
        .then(res => {
            if (res.ok) {
                interForm.reset();
                loadInteractionsTimeline(customerId);
                loadDashboardStats();
                showNotification("Yangi muloqot tarixi saqlandi.");
            } else {
                showNotification("Muloqotni yozib bo'lmadi.", true);
            }
        });
    });

    // ===================================================================
    // TAB 4: STAFF MANAGEMENT (Faqat SUPER_ADMIN va CEO uchun)
    // ===================================================================
    const staffModal = document.getElementById('staff-modal');
    const staffForm = document.getElementById('staff-form');

    function loadStaff() {
        fetch(API_USERS)
            .then(res => res.json())
            .then(users => {
                const body = document.getElementById('staff-list-body');
                body.innerHTML = '';
                
                users.forEach(u => {
                    const row = document.createElement('tr');
                    
                    const date = new Date(u.createdAt);
                    const dateStr = date.toLocaleDateString('uz-UZ');

                    let roleClass = 'status-lead';
                    if (u.role === 'SUPER_ADMIN') roleClass = 'status-active';
                    else if (u.role === 'CEO') roleClass = 'status-proposal';
                    else roleClass = 'status-contacted';

                    let actions = '<span style="color:var(--text-muted);">Taqiqlangan</span>';
                    
                    // Only SUPER_ADMIN can delete other users
                    if (currentUser.role === 'SUPER_ADMIN') {
                        if (u.username !== currentUser.username) {
                            actions = `<button class="btn-icon delete" data-id="${u.id}" title="Xodimni o'chirish"><i class="fa-solid fa-trash-can"></i></button>`;
                        } else {
                            actions = `<span style="color:var(--success);">Siz (Active)</span>`;
                        }
                    }

                    row.innerHTML = `
                        <td><strong>#${u.id}</strong></td>
                        <td><span style="font-weight:600;">${u.fullName}</span></td>
                        <td><code>${u.username}</code></td>
                        <td><span class="status-pill ${roleClass}">${u.role}</span></td>
                        <td style="font-size:0.8rem; color:var(--text-muted);">${dateStr}</td>
                        <td>${actions}</td>
                    `;
                    body.appendChild(row);
                });

                attachStaffActionListeners();
            });
    }

    if (document.getElementById('btn-add-staff')) {
        document.getElementById('btn-add-staff').addEventListener('click', () => {
            staffForm.reset();
            staffModal.classList.add('active');
        });
    }
    
    document.getElementById('btn-close-staff-modal').addEventListener('click', () => staffModal.classList.remove('active'));
    document.getElementById('btn-cancel-staff-modal').addEventListener('click', () => staffModal.classList.remove('active'));

    // Staff Form submission
    staffForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const staffData = {
            fullName: document.getElementById('staff-name').value,
            username: document.getElementById('staff-username').value,
            password: document.getElementById('staff-password').value,
            role: document.getElementById('staff-role').value
        };

        fetch(API_USERS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staffData)
        })
        .then(res => {
            if (res.status === 201) {
                staffModal.classList.remove('active');
                loadStaff();
                showNotification("Yangi xodim qo'shildi!");
            } else if (res.status === 409) {
                showNotification("Bu username band! Boshqasini tanlang.", true);
            } else {
                showNotification("Xato yuz berdi.", true);
            }
        });
    });

    function attachStaffActionListeners() {
        document.querySelectorAll('#staff-list-body .btn-icon.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm("Ushbu xodimni butunlay o'chirib tashlamoqchimisiz? (U biriktirilgan mijozlar xavfsiz qoladi)")) {
                    fetch(`${API_USERS}/${id}`, { method: 'DELETE' })
                        .then(res => {
                            if (res.ok) {
                                loadStaff();
                                showNotification("Xodim tizimdan o'chirildi.");
                            } else {
                                showNotification("Xodimni o'chirib bo'lmadi.", true);
                            }
                        });
                }
            });
        });
    }

    // ===================================================================
    // REPORT EXPORT (CSV Generator for CEO & Admin)
    // ===================================================================
    const btnExport = document.getElementById('btn-export-data');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            fetch(API_CUSTOMERS)
                .then(res => res.json())
                .then(customers => {
                    let csvContent = "data:text/csv;charset=utf-8,";
                    csvContent += "ID,Mijoz F.I.Sh,Kompaniya,Email,Telefon,Status,Mas'ul Xodim,Yaratilgan Sana\n";

                    customers.forEach(c => {
                        const date = new Date(c.createdAt).toLocaleDateString('uz-UZ');
                        const staff = c.assignedTo ? c.assignedTo.fullName : 'Biriktirilmagan';
                        const row = `"${c.id}","${c.name}","${c.company || ''}","${c.email}","${c.phone || ''}","${c.status}","${staff}","${date}"`;
                        csvContent += row + "\n";
                    });

                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "NextGen_CRM_Mijozlar_Hisoboti.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showNotification("Mijozlar hisoboti CSV formatida yuklab olindi!");
                });
        });
    }

    // Initial session monitoring on load
    checkSession();
});
