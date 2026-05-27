document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const floorMap = document.getElementById('floor-map');
    const reservationForm = document.getElementById('reservation-form');
    const toastContainer = document.getElementById('toast-container');
    const submitBtn = document.getElementById('submit-reservation');
    const authBtn = document.getElementById('auth-btn');
    const userInfo = document.getElementById('user-info');
    const showAddTableBtn = document.getElementById('show-add-table-btn');

    // Modals
    const loginModal = document.getElementById('login-modal');
    const addTableModal = document.getElementById('add-table-modal');
    const tableContextModal = document.getElementById('table-context-modal');
    const orderModal = document.getElementById('order-modal');
    const loginForm = document.getElementById('login-form');
    const addTableForm = document.getElementById('add-table-form');

    // State
    let token = localStorage.getItem('ros_token') || null;
    let user = JSON.parse(localStorage.getItem('ros_user')) || null;
    let currentTables = [];
    let currentReservations = [];
    let selectedTableForContext = null;
    let menuItems = [];
    let activeOrder = null;

    // Initialization
    updateAuthUI();
    loadFloorPlan();

    // --- Authentication Logic ---
    authBtn.addEventListener('click', () => {
        if (token) {
            // Logout
            token = null;
            user = null;
            localStorage.removeItem('ros_token');
            localStorage.removeItem('ros_user');
            updateAuthUI();
            showToast('Logged out successfully', 'success');
            loadFloorPlan(); // Refresh map without auth
        } else {
            // Show Login Modal
            loginModal.classList.remove('hidden');
        }
    });

    document.getElementById('close-login').addEventListener('click', () => loginModal.classList.add('hidden'));

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.ok) {
                token = data.token;
                user = data.user;
                localStorage.setItem('ros_token', token);
                localStorage.setItem('ros_user', JSON.stringify(user));

                loginModal.classList.add('hidden');
                loginForm.reset();
                updateAuthUI();
                showToast('Logged in successfully!', 'success');
                loadFloorPlan();
            } else {
                showToast(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            showToast('Network error during login', 'error');
        }
    });

    function updateAuthUI() {
        if (token && user) {
            userInfo.textContent = `Logged in as: ${user.username} (${user.role})`;
            authBtn.textContent = 'Logout';
            if (user.role === 'admin' || user.role === 'management') {
                showAddTableBtn.style.display = 'inline-block';
            } else {
                showAddTableBtn.style.display = 'none';
            }
        } else {
            userInfo.textContent = 'Welcome, Guest';
            authBtn.textContent = 'Login';
            showAddTableBtn.style.display = 'none';
        }
    }

    // --- Table Management Logic ---
    showAddTableBtn.addEventListener('click', () => addTableModal.classList.remove('hidden'));
    document.getElementById('close-add-table').addEventListener('click', () => addTableModal.classList.add('hidden'));

    addTableForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const label = document.getElementById('tableLabel').value;
        const capacity = document.getElementById('tableCapacity').value;

        try {
            const response = await fetch('/api/table', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ label, capacity, status: 'available' })
            });
            const data = await response.json();

            if (response.ok) {
                showToast('Table added successfully!', 'success');
                addTableModal.classList.add('hidden');
                addTableForm.reset();
                loadFloorPlan();
            } else {
                showToast(data.message || data.error || 'Failed to add table', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    });

    // --- Floor Plan Logic ---
    async function loadFloorPlan() {
        if (!token) {
            floorMap.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Please log in to view the floor plan.</p>';
            return;
        }

        try {
            // Fetch tables
            const tableRes = await fetch('/api/table', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!tableRes.ok) throw new Error('Failed to fetch tables');
            const tableData = await tableRes.json();
            currentTables = Array.isArray(tableData.tables) ? tableData.tables : [];

            // Fetch reservations to map to tables
            const resRes = await fetch('/api/reservations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resRes.ok) {
                const resData = await resRes.json();
                currentReservations = Array.isArray(resData.reservations) ? resData.reservations : [];
            }

            renderTables();
        } catch (error) {
            console.error(error);
            showToast('Failed to load floor plan. Check login status.', 'error');
        }
    }

    function renderTables() {
        floorMap.innerHTML = '';

        if (currentTables.length === 0) {
            floorMap.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No tables found.</p>';
            return;
        }

        // Only look at pending or seated reservations for today
        const todayStr = new Date().toISOString().split('T')[0];
        const activeResMap = {};
        currentReservations.forEach(r => {
            // Date logic depends on how it's returned. In JS it might be a full ISO string.
            // Let's just map all pending/seated for simplicity, since API returns mostly active ones
            if (r.status === 'Pending' || r.status === 'Seated') {
                activeResMap[r.table._id || r.table_id] = r;
            }
        });

        currentTables.forEach(table => {
            const tableEl = document.createElement('div');
            let statusClass = table.status ? table.status.toLowerCase() : 'available';
            const activeRes = activeResMap[table._id];

            // Override UI color if the table is physically available but has an upcoming reservation
            if (statusClass === 'available' && activeRes && activeRes.status === 'Pending') {
                statusClass = 'reserved';
            }

            tableEl.className = `table-item ${statusClass}`;
            tableEl.innerHTML = `
                <span class="table-name">T${table.label || table._id}</span>
                <span class="table-capacity">${table.capacity} pax</span>
            `;

            tableEl.addEventListener('click', () => openTableContext(table, activeRes));
            floorMap.appendChild(tableEl);
        });
    }

    // --- Table Context Modal Logic ---
    document.getElementById('close-context').addEventListener('click', () => tableContextModal.classList.add('hidden'));

    function openTableContext(table, activeRes) {
        selectedTableForContext = { table, activeRes };

        document.getElementById('context-table-name').textContent = `Table ${table.label || table._id}`;
        document.getElementById('context-table-status').textContent = table.status;

        const resInfo = document.getElementById('context-reservation-info');
        const actionBox = document.getElementById('context-actions');
        actionBox.innerHTML = ''; // clear buttons

        if (activeRes) {
            resInfo.classList.remove('hidden');
            document.getElementById('context-res-name').textContent = activeRes.bookedBy;
            document.getElementById('context-res-pax').textContent = activeRes.guests;

            // Format time nicely
            const d = new Date(activeRes.startTime);
            document.getElementById('context-res-time').textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (activeRes.status === 'Pending') {
                actionBox.innerHTML += `<button class="btn-primary" onclick="manageReservation('${activeRes._id}', 'checkin')">Check In Guest</button>`;
                actionBox.innerHTML += `<button class="btn-secondary" onclick="manageReservation('${activeRes._id}', 'cancel')">Cancel Reservation</button>`;
                actionBox.innerHTML += `<button class="btn-secondary" onclick="manageReservation('${activeRes._id}', 'noshow')">Mark No-Show</button>`;
            } else if (activeRes.status === 'Seated') {
                actionBox.innerHTML += `<button class="btn-secondary" onclick="markCleaning('${table._id}')">End Meal (Requires Cleaning)</button>`;
            }
        } else {
            resInfo.classList.add('hidden');
            if (table.status.toLowerCase() === 'available') {
                actionBox.innerHTML += `<button class="btn-primary" onclick="walkInGuest('${table._id || table.table_id}')">Seat Walk-In Guest</button>`;
            } else if (table.status.toLowerCase() === 'cleaning') {
                actionBox.innerHTML += `<button class="btn-primary" onclick="freeTable('${table._id || table.table_id}')">Mark Cleaned (Available)</button>`;
            } else if (table.status.toLowerCase() === 'occupied') {
                actionBox.innerHTML += `<button class="btn-primary" onclick="openOrderModal('${table._id || table.table_id}', '${table.label}')">Manage Orders</button>`;
                actionBox.innerHTML += `<button class="btn-secondary" onclick="markCleaning('${table._id || table.table_id}')">End Meal (Requires Cleaning)</button>`;
            }
        }

        // Add Delete button for admins/managers
        if (user && (user.role === 'admin' || user.role === 'management')) {
            actionBox.innerHTML += `<button class="btn-secondary" style="margin-top: 10px; background-color: #dc3545; color: white; border: none;" onclick="deleteTable('${table._id}')">Delete Table</button>`;
        }

        // Add Manage Orders button if seated via reservation
        if (activeRes && activeRes.status === 'Seated') {
            actionBox.innerHTML += `<button class="btn-primary" onclick="openOrderModal('${table._id || table.table_id}', '${table.label}')">Manage Orders</button>`;
        }

        tableContextModal.classList.remove('hidden');
    }

    // Attach to window so onclick handlers in HTML string work
    window.manageReservation = async (resId, action) => {
        try {
            const response = await fetch(`/api/reservations/${resId}/${action}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                showToast(`Action successful`, 'success');
                tableContextModal.classList.add('hidden');
                loadFloorPlan();
            } else {
                const data = await response.json();
                showToast(data.message || 'Failed to update reservation', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    };

    window.walkInGuest = async (tableId) => {
        const guests = prompt("How many guests for this walk-in?", "2");
        if (!guests) return;

        try {
            // Wait, we need a walk-in API or just update table to occupied.
            // Let's assume a walk-in updates the table status to 'occupied'.
            const response = await fetch(`/api/table/${tableId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'occupied' })
            });
            if (response.ok) {
                showToast('Walk-in seated!', 'success');
                tableContextModal.classList.add('hidden');
                loadFloorPlan();
            } else {
                const data = await response.json();
                showToast(data.message || 'Failed to seat walk-in', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    };

    window.deleteTable = async (tableId) => {
        if (!confirm("Are you sure you want to delete this table?")) return;
        try {
            const response = await fetch(`/api/table/${tableId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                showToast('Table deleted successfully', 'success');
                tableContextModal.classList.add('hidden');
                loadFloorPlan();
            } else {
                const data = await response.json();
                showToast(data.message || 'Failed to delete table', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    };

    window.markCleaning = async (tableId) => {
        try {
            const response = await fetch(`/api/table/${tableId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'cleaning' })
            });
            if (response.ok) {
                showToast('Meal ended. Table needs cleaning!', 'success');
                tableContextModal.classList.add('hidden');
                loadFloorPlan();
            } else {
                showToast('Failed to update table', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    };

    window.freeTable = async (tableId) => {
        try {
            const response = await fetch(`/api/table/${tableId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'available' })
            });
            if (response.ok) {
                showToast('Table is now available', 'success');
                tableContextModal.classList.add('hidden');
                loadFloorPlan();
            }
        } catch (error) { }
    };

    // --- Reservation Form Submission ---
    reservationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!token) {
            showToast('You must be logged in to create a reservation', 'error');
            return;
        }

        const customerName = document.getElementById('customerName').value;
        const customerPhone = document.getElementById('customerPhone').value;
        const partySize = parseInt(document.getElementById('partySize').value);
        const reservationTime = document.getElementById('reservationTime').value;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Booking...';

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bookedBy: customerName,
                    contact: customerPhone,
                    guests: partySize,
                    date: reservationTime // Controller extracts time from this
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`Table ${data.table.label} booked successfully!`, 'success');
                reservationForm.reset();
                loadFloorPlan();
            } else if (response.status === 409 && data.requiresOverride) {
                if (confirm(data.message)) {
                    alert("Override functionality requires additional UI. Try booking a different time.");
                }
            } else {
                showToast(data.message || data.error || 'Failed to create reservation', 'error');
            }
        } catch (error) {
            showToast('An error occurred while booking.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Book Table';
        }
    });

    // --- Order Management Logic ---
    document.getElementById('close-order').addEventListener('click', () => orderModal.classList.add('hidden'));

    window.openOrderModal = async (tableId, tableLabel) => {
        tableContextModal.classList.add('hidden');
        document.getElementById('order-table-name').textContent = `Order for Table ${tableLabel}`;

        // Ensure we have an active order for the table
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tableId })
            });
            const data = await res.json();
            if (data.success) {
                activeOrder = data.order;
            } else {
                showToast('Failed to initialize order', 'error');
                return;
            }
        } catch (e) {
            showToast('Network error initializing order', 'error');
            return;
        }

        await fetchMenu();
        await fetchTableOrder(tableId);
        orderModal.classList.remove('hidden');
    };

    async function fetchMenu() {
        if (menuItems.length > 0) {
            renderMenu();
            return;
        }
        try {
            const res = await fetch('/api/menu', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                menuItems = data.menuItems;
                renderMenu();
            }
        } catch (e) {
            console.error('Error fetching menu', e);
        }
    }

    function renderMenu() {
        const grid = document.getElementById('menu-grid');
        grid.innerHTML = '';
        menuItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'menu-card';
            div.innerHTML = `
                <h4>${item.name}</h4>
                <p>$${parseFloat(item.price).toFixed(2)}</p>
                <button class="btn-primary btn-small" onclick="addToOrder(${item.menu_item_id})">Add</button>
            `;
            grid.appendChild(div);
        });
    }

    async function fetchTableOrder(tableId) {
        try {
            const res = await fetch(`/api/orders/table/${tableId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                renderCurrentOrder(data.orderItems);
            }
        } catch (e) {
            console.error('Error fetching table order', e);
        }
    }

    function renderCurrentOrder(items) {
        const list = document.getElementById('current-order-list');
        list.innerHTML = '';
        if (!items || items.length === 0) {
            list.innerHTML = '<p>No items ordered yet.</p>';
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'order-item-row';
            div.innerHTML = `
                <div class="oi-info">
                    <strong>${item.quantity}x ${item.name}</strong>
                    <span class="status-badge ${item.status}">${item.status.replace('_', ' ')}</span>
                </div>
                ${item.note ? `<small class="oi-note">Note: ${item.note}</small>` : ''}
            `;
            list.appendChild(div);
        });
    }

    window.addToOrder = async (menuItemId) => {
        if (!activeOrder) return;
        const note = prompt("Any special requests?", "");
        if (note === null) return; // user cancelled

        try {
            const res = await fetch(`/api/orders/${activeOrder.order_id || activeOrder.orderId}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ menuItemId, quantity: 1, note })
            });

            const data = await res.json();
            if (data.success) {
                showToast('Item added to order', 'success');
                // refresh current order list
                fetchTableOrder(activeOrder.table_id || activeOrder.tableId);
            } else {
                showToast(data.message || 'Failed to add item', 'error');
            }
        } catch (e) {
            showToast('Network error adding item', 'error');
        }
    };

    // --- Utility ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toastContainer.contains(toast)) toastContainer.removeChild(toast);
            }, 300);
        }, 3000);
    }
});
