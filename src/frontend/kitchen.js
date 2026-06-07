document.addEventListener('DOMContentLoaded', () => {
    const kdsGrid = document.getElementById('kds-grid');
    const refreshBtn = document.getElementById('refresh-kds');
    const lastUpdated = document.getElementById('last-updated');
    const loginOverlay = document.getElementById('login-overlay');
    const userInfo = document.getElementById('kds-user-info');

    const token = localStorage.getItem('ros_token');
    const user = JSON.parse(localStorage.getItem('ros_user'));

    if (!token || !user || !['admin', 'management', 'kitchen'].includes(user.role)) {
        loginOverlay.classList.remove('hidden');
        return;
    }

    userInfo.textContent = `Logged in as: ${user.username} (${user.role})`;

    // Fetch initial orders
    fetchKitchenOrders();

    // Auto refresh every 10 seconds
    const pollInterval = setInterval(fetchKitchenOrders, 10000);

    refreshBtn.addEventListener('click', () => {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';
        fetchKitchenOrders().finally(() => {
            refreshBtn.disabled = false;
            refreshBtn.textContent = 'Refresh Now';
        });
    });

    async function fetchKitchenOrders() {
        try {
            const res = await fetch('/api/orders/kitchen', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401 || res.status === 403) {
                loginOverlay.classList.remove('hidden');
                clearInterval(pollInterval);
                return;
            }

            const data = await res.json();
            if (data.success) {
                renderTickets(data.kitchenOrders);
                const now = new Date();
                lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
            }
        } catch (error) {
            console.error('Error fetching KDS orders', error);
        }
    }

    function renderTickets(orders) {
        kdsGrid.innerHTML = '';
        if (!orders || orders.length === 0) {
            kdsGrid.innerHTML = '<p class="no-orders">No active kitchen orders.</p>';
            return;
        }

        orders.forEach(item => {
            const ticket = document.createElement('div');
            ticket.className = `kds-ticket status-${item.status}`;


            let actionBtn = '';
            if (item.status === 'pending') {
                actionBtn = `<button class="btn-secondary" onclick="updateItemStatus(${item.order_item_id}, 'in_preparation')">Start Prep</button>`;
            } else if (item.status === 'in_preparation') {
                actionBtn = `<button class="btn-primary" onclick="updateItemStatus(${item.order_item_id}, 'ready')">Mark Ready</button>`;
            }

            ticket.innerHTML = `
                <div class="ticket-header">
                    <h3>Table ${item.table_label}</h3>
                </div>
                <div class="ticket-body">
                    <div class="ticket-item-name">${item.quantity}x ${item.menu_item_name}</div>
                    ${item.note ? `<div class="ticket-note">Note: ${item.note}</div>` : ''}
                </div>
                <div class="ticket-footer">
                    <span class="ticket-status">${item.status.replace('_', ' ').toUpperCase()}</span>
                    ${actionBtn}
                </div>
            `;

            kdsGrid.appendChild(ticket);
        });
    }

    window.updateItemStatus = async (itemId, newStatus) => {
        try {
            const res = await fetch(`/api/orders/items/${itemId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                // Instantly refresh list
                fetchKitchenOrders();
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status', error);
        }
    };
});
