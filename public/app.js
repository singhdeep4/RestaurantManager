/* ============================================
   RESTAURANT MANAGER — Frontend Application
   ============================================ */

const API = '';  // same-origin

// ─── State ───
let currentPage = 'dashboard';

// ─── DOM refs ───
const pageContainer = document.getElementById('pageContainer');
const pageTitle     = document.getElementById('pageTitle');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalTitle    = document.getElementById('modalTitle');
const modalBody     = document.getElementById('modalBody');
const modalClose    = document.getElementById('modalClose');
const hamburger     = document.getElementById('hamburger');
const sidebar       = document.getElementById('sidebar');
const clockEl       = document.getElementById('clock');

// ─── Toast ───
(() => {
  const c = document.createElement('div');
  c.className = 'toast-container';
  document.body.appendChild(c);
  window._toastContainer = c;
})();

function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  window._toastContainer.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ─── Clock ───
function updateClock() {
  const d = new Date();
  clockEl.textContent = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ─── Modal ───
function openModal(title, contentHTML) {
  modalTitle.textContent = title;
  modalBody.innerHTML = contentHTML;
  modalBackdrop.classList.add('open');
}

function closeModal() {
  modalBackdrop.classList.remove('open');
}

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

// ─── Sidebar nav ───
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    navigateTo(page);
    if (window.innerWidth <= 768) sidebar.classList.remove('open');
  });
});

hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.nav-link[data-page="${page}"]`).classList.add('active');
  const titles = { dashboard: 'Dashboard', customers: 'Customers', staff: 'Staff', menu: 'Menu', orders: 'Orders' };
  pageTitle.textContent = titles[page] || page;
  pageContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>Loading...</p></div>';
  renderPage(page);
}

// ─── Fetch helper ───
async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ════════════════════════════════════════════
//  PAGES
// ════════════════════════════════════════════

async function renderPage(page) {
  try {
    switch (page) {
      case 'dashboard': return await renderDashboard();
      case 'customers': return await renderCustomers();
      case 'staff':     return await renderStaff();
      case 'menu':      return await renderMenu();
      case 'orders':    return await renderOrders();
    }
  } catch (err) {
    pageContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>${err.message}</p></div>`;
  }
}

// ─────── DASHBOARD ─────────────────────────

async function renderDashboard() {
  const d = await api('/api/dashboard');

  const maxSold = d.topItems.length ? Math.max(...d.topItems.map(i => Number(i.Total_Sold))) : 1;

  pageContainer.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card purple">
        <div class="stat-label">Total Revenue</div>
        <div class="stat-value">₹${d.totalRevenue.toLocaleString('en-IN')}</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-label">Total Orders</div>
        <div class="stat-value">${d.totalOrders}</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">Customers</div>
        <div class="stat-value">${d.totalCustomers}</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-label">Staff Members</div>
        <div class="stat-value">${d.totalStaff}</div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header"><h3>🏆 Top Selling Items</h3></div>
        <div class="card-body">
          ${d.topItems.length ? `
            <div class="bar-chart">
              ${d.topItems.map(item => `
                <div class="bar-row">
                  <span class="bar-label">${item.Food_Name}</span>
                  <div class="bar-track">
                    <div class="bar-fill" style="width:${(Number(item.Total_Sold) / maxSold * 100)}%">${item.Total_Sold}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<div class="empty-state">No data yet</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>📝 Recent Orders</h3></div>
        <div class="card-body">
          ${d.recentOrders.length ? `
            <div class="table-wrapper"><table>
              <thead><tr><th>ID</th><th>Customer</th><th>Staff</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                ${d.recentOrders.map(o => `
                  <tr>
                    <td>#${o.Order_Id}</td>
                    <td>${o.Customer_Name}</td>
                    <td>${o.Staff_Name}</td>
                    <td>₹${Number(o.Total_Amount).toLocaleString('en-IN')}</td>
                    <td><span class="badge badge-${o.Status.toLowerCase()}">${o.Status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table></div>
          ` : '<div class="empty-state">No orders yet</div>'}
        </div>
      </div>
    </div>
  `;
}

// ─────── CUSTOMERS ─────────────────────────

async function renderCustomers() {
  const rows = await api('/api/customers');
  pageContainer.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>👥 All Customers (${rows.length})</h3>
        <button class="btn btn-primary" id="btnAddCustomer">+ Add Customer</button>
      </div>
      <div class="card-body table-wrapper">
        ${rows.length ? `
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Actions</th></tr></thead>
            <tbody>
              ${rows.map(c => `
                <tr>
                  <td>${c.Customer_Id}</td>
                  <td>${c.Name}</td>
                  <td>${c.Phone}</td>
                  <td>${c.Email}</td>
                  <td class="action-btns">
                    <button class="btn btn-sm btn-outline btn-edit-customer" data-id="${c.Customer_Id}" data-name="${esc(c.Name)}" data-phone="${esc(c.Phone)}" data-email="${esc(c.Email)}">✏️</button>
                    <button class="btn btn-sm btn-danger btn-del-customer" data-id="${c.Customer_Id}">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state"><div class="empty-icon">👥</div><p>No customers yet.</p></div>'}
      </div>
    </div>
  `;

  document.getElementById('btnAddCustomer').onclick = () => openCustomerForm();
  document.querySelectorAll('.btn-edit-customer').forEach(b => {
    b.onclick = () => openCustomerForm({
      Customer_Id: b.dataset.id,
      Name: b.dataset.name,
      Phone: b.dataset.phone,
      Email: b.dataset.email,
    });
  });
  document.querySelectorAll('.btn-del-customer').forEach(b => {
    b.onclick = async () => {
      if (!confirm('Delete this customer?')) return;
      await api(`/api/customers/${b.dataset.id}`, { method: 'DELETE' });
      toast('Customer deleted');
      renderCustomers();
    };
  });
}

function openCustomerForm(data = null) {
  const isEdit = !!data;
  openModal(isEdit ? 'Edit Customer' : 'Add Customer', `
    <form id="customerForm">
      <div class="form-group">
        <label>Name</label>
        <input name="Name" required value="${isEdit ? data.Name : ''}" />
      </div>
      <div class="form-group">
        <label>Phone</label>
        <input name="Phone" required value="${isEdit ? data.Phone : ''}" />
      </div>
      <div class="form-group">
        <label>Email</label>
        <input name="Email" type="email" required value="${isEdit ? data.Email : ''}" />
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'}</button>
      </div>
    </form>
  `);
  document.getElementById('customerForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd);
    if (isEdit) {
      await api(`/api/customers/${data.Customer_Id}`, { method: 'PUT', body: JSON.stringify(body) });
      toast('Customer updated');
    } else {
      await api('/api/customers', { method: 'POST', body: JSON.stringify(body) });
      toast('Customer added');
    }
    closeModal();
    renderCustomers();
  };
}

// ─────── STAFF ─────────────────────────────

async function renderStaff() {
  const rows = await api('/api/staff');

  function roleBadge(role) {
    return `<span class="badge badge-${role.toLowerCase()}">${role}</span>`;
  }

  pageContainer.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>🧑‍🍳 All Staff (${rows.length})</h3>
        <button class="btn btn-primary" id="btnAddStaff">+ Add Staff</button>
      </div>
      <div class="card-body table-wrapper">
        ${rows.length ? `
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Phone</th><th>Salary</th><th>Actions</th></tr></thead>
            <tbody>
              ${rows.map(s => `
                <tr>
                  <td>${s.Staff_Id}</td>
                  <td>${s.Name}</td>
                  <td>${roleBadge(s.Role)}</td>
                  <td>${s.Phone}</td>
                  <td>₹${Number(s.Salary).toLocaleString('en-IN')}</td>
                  <td class="action-btns">
                    <button class="btn btn-sm btn-outline btn-edit-staff" data-id="${s.Staff_Id}" data-name="${esc(s.Name)}" data-role="${s.Role}" data-phone="${esc(s.Phone)}" data-salary="${s.Salary}">✏️</button>
                    <button class="btn btn-sm btn-danger btn-del-staff" data-id="${s.Staff_Id}">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state"><div class="empty-icon">🧑‍🍳</div><p>No staff yet.</p></div>'}
      </div>
    </div>
  `;

  document.getElementById('btnAddStaff').onclick = () => openStaffForm();
  document.querySelectorAll('.btn-edit-staff').forEach(b => {
    b.onclick = () => openStaffForm({
      Staff_Id: b.dataset.id,
      Name: b.dataset.name,
      Role: b.dataset.role,
      Phone: b.dataset.phone,
      Salary: b.dataset.salary,
    });
  });
  document.querySelectorAll('.btn-del-staff').forEach(b => {
    b.onclick = async () => {
      if (!confirm('Delete this staff member?')) return;
      await api(`/api/staff/${b.dataset.id}`, { method: 'DELETE' });
      toast('Staff member deleted');
      renderStaff();
    };
  });
}

function openStaffForm(data = null) {
  const isEdit = !!data;
  const roles = ['Waiter','Cashier','Chef','Manager'];
  openModal(isEdit ? 'Edit Staff' : 'Add Staff', `
    <form id="staffForm">
      <div class="form-group">
        <label>Name</label>
        <input name="Name" required value="${isEdit ? data.Name : ''}" />
      </div>
      <div class="form-group">
        <label>Role</label>
        <select name="Role">
          ${roles.map(r => `<option value="${r}" ${isEdit && data.Role === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Phone</label>
        <input name="Phone" required value="${isEdit ? data.Phone : ''}" />
      </div>
      <div class="form-group">
        <label>Salary (₹)</label>
        <input name="Salary" type="number" step="0.01" value="${isEdit ? data.Salary : '0'}" />
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'}</button>
      </div>
    </form>
  `);
  document.getElementById('staffForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd);
    if (isEdit) {
      await api(`/api/staff/${data.Staff_Id}`, { method: 'PUT', body: JSON.stringify(body) });
      toast('Staff updated');
    } else {
      await api('/api/staff', { method: 'POST', body: JSON.stringify(body) });
      toast('Staff added');
    }
    closeModal();
    renderStaff();
  };
}

// ─────── MENU ──────────────────────────────

async function renderMenu() {
  const rows = await api('/api/menu');

  function catBadge(cat) {
    const map = { 'Veg': 'veg', 'Non-Veg': 'nonveg', 'Beverage': 'beverage', 'Dessert': 'dessert' };
    return `<span class="badge badge-${map[cat] || 'veg'}">${cat}</span>`;
  }

  pageContainer.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>📋 Menu Items (${rows.length})</h3>
        <button class="btn btn-primary" id="btnAddMenu">+ Add Item</button>
      </div>
      <div class="card-body table-wrapper">
        ${rows.length ? `
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Category</th><th>Available</th><th>Actions</th></tr></thead>
            <tbody>
              ${rows.map(f => `
                <tr>
                  <td>${f.Food_Id}</td>
                  <td>${f.Food_Name}</td>
                  <td>₹${Number(f.Price).toLocaleString('en-IN')}</td>
                  <td>${catBadge(f.Category)}</td>
                  <td>${f.Is_Available ? '✅' : '❌'}</td>
                  <td class="action-btns">
                    <button class="btn btn-sm btn-outline btn-edit-menu" data-id="${f.Food_Id}" data-name="${esc(f.Food_Name)}" data-price="${f.Price}" data-category="${f.Category}" data-avail="${f.Is_Available}">✏️</button>
                    <button class="btn btn-sm btn-danger btn-del-menu" data-id="${f.Food_Id}">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state"><div class="empty-icon">📋</div><p>No menu items yet.</p></div>'}
      </div>
    </div>
  `;

  document.getElementById('btnAddMenu').onclick = () => openMenuForm();
  document.querySelectorAll('.btn-edit-menu').forEach(b => {
    b.onclick = () => openMenuForm({
      Food_Id: b.dataset.id,
      Food_Name: b.dataset.name,
      Price: b.dataset.price,
      Category: b.dataset.category,
      Is_Available: b.dataset.avail === '1',
    });
  });
  document.querySelectorAll('.btn-del-menu').forEach(b => {
    b.onclick = async () => {
      if (!confirm('Delete this menu item?')) return;
      await api(`/api/menu/${b.dataset.id}`, { method: 'DELETE' });
      toast('Menu item deleted');
      renderMenu();
    };
  });
}

function openMenuForm(data = null) {
  const isEdit = !!data;
  const cats = ['Veg','Non-Veg','Beverage','Dessert'];
  openModal(isEdit ? 'Edit Menu Item' : 'Add Menu Item', `
    <form id="menuForm">
      <div class="form-group">
        <label>Food Name</label>
        <input name="Food_Name" required value="${isEdit ? data.Food_Name : ''}" />
      </div>
      <div class="form-group">
        <label>Price (₹)</label>
        <input name="Price" type="number" step="0.01" required value="${isEdit ? data.Price : ''}" />
      </div>
      <div class="form-group">
        <label>Category</label>
        <select name="Category">
          ${cats.map(c => `<option value="${c}" ${isEdit && data.Category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      ${isEdit ? `
        <div class="form-group">
          <label>Available</label>
          <select name="Is_Available">
            <option value="1" ${data.Is_Available ? 'selected' : ''}>Yes</option>
            <option value="0" ${!data.Is_Available ? 'selected' : ''}>No</option>
          </select>
        </div>
      ` : ''}
      <div class="form-actions">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'}</button>
      </div>
    </form>
  `);
  document.getElementById('menuForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd);
    if (isEdit) {
      await api(`/api/menu/${data.Food_Id}`, { method: 'PUT', body: JSON.stringify(body) });
      toast('Menu item updated');
    } else {
      await api('/api/menu', { method: 'POST', body: JSON.stringify(body) });
      toast('Menu item added');
    }
    closeModal();
    renderMenu();
  };
}

// ─────── ORDERS ────────────────────────────

async function renderOrders() {
  const orders = await api('/api/orders');

  pageContainer.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>🧾 All Orders (${orders.length})</h3>
        <button class="btn btn-primary" id="btnAddOrder">+ New Order</button>
      </div>
      <div class="card-body table-wrapper">
        ${orders.length ? `
          <table>
            <thead><tr><th>ID</th><th>Date</th><th>Customer</th><th>Staff</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td>#${o.Order_Id}</td>
                  <td>${new Date(o.Order_Date).toLocaleDateString('en-IN')}</td>
                  <td>${o.Customer_Name}</td>
                  <td>${o.Staff_Name}</td>
                  <td>${o.items.map(i => `${i.Food_Name} ×${i.Quantity}`).join(', ')}</td>
                  <td>₹${Number(o.Total_Amount).toLocaleString('en-IN')}</td>
                  <td>
                    <select class="badge badge-${o.Status.toLowerCase()} order-status-select" data-id="${o.Order_Id}" style="background:transparent;border:1px solid var(--border);padding:2px 6px;border-radius:999px;color:inherit;font-size:var(--fs-xs);cursor:pointer;">
                      ${['Pending','Preparing','Served','Paid','Cancelled'].map(s =>
                        `<option value="${s}" ${o.Status === s ? 'selected' : ''}>${s}</option>`
                      ).join('')}
                    </select>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-danger btn-del-order" data-id="${o.Order_Id}">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state"><div class="empty-icon">🧾</div><p>No orders yet.</p></div>'}
      </div>
    </div>
  `;

  document.getElementById('btnAddOrder').onclick = () => openOrderForm();

  document.querySelectorAll('.order-status-select').forEach(sel => {
    sel.onchange = async () => {
      await api(`/api/orders/${sel.dataset.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ Status: sel.value }),
      });
      toast('Status updated');
      renderOrders();
    };
  });

  document.querySelectorAll('.btn-del-order').forEach(b => {
    b.onclick = async () => {
      if (!confirm('Delete this order?')) return;
      await api(`/api/orders/${b.dataset.id}`, { method: 'DELETE' });
      toast('Order deleted');
      renderOrders();
    };
  });
}

async function openOrderForm() {
  // Fetch customers, staff, menu for dropdowns
  const [customers, staff, menu] = await Promise.all([
    api('/api/customers'),
    api('/api/staff'),
    api('/api/menu'),
  ]);

  const availMenu = menu.filter(m => m.Is_Available);

  openModal('New Order', `
    <form id="orderForm">
      <div class="form-group">
        <label>Customer</label>
        <select name="Customer_Id" required>
          <option value="">Select Customer</option>
          ${customers.map(c => `<option value="${c.Customer_Id}">${c.Name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Staff</label>
        <select name="Staff_Id" required>
          <option value="">Select Staff</option>
          ${staff.map(s => `<option value="${s.Staff_Id}">${s.Name} (${s.Role})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Items</label>
        <div class="order-items-list" id="orderItemsList"></div>
        <button type="button" class="btn btn-sm btn-outline" id="btnAddItem">+ Add Item</button>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Place Order</button>
      </div>
    </form>
  `);

  const itemsList = document.getElementById('orderItemsList');

  function addItemRow() {
    const row = document.createElement('div');
    row.className = 'order-item-row';
    row.innerHTML = `
      <select class="order-food-select" required>
        <option value="">Select</option>
        ${availMenu.map(m => `<option value="${m.Food_Id}">${m.Food_Name} (₹${m.Price})</option>`).join('')}
      </select>
      <input type="number" class="order-qty" min="1" value="1" required />
      <button type="button" class="btn-remove">&times;</button>
    `;
    row.querySelector('.btn-remove').onclick = () => row.remove();
    itemsList.appendChild(row);
  }

  addItemRow(); // start with one row
  document.getElementById('btnAddItem').onclick = addItemRow;

  document.getElementById('orderForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const Customer_Id = fd.get('Customer_Id');
    const Staff_Id = fd.get('Staff_Id');

    const items = [];
    itemsList.querySelectorAll('.order-item-row').forEach(row => {
      const food_id = row.querySelector('.order-food-select').value;
      const quantity = parseInt(row.querySelector('.order-qty').value, 10);
      if (food_id && quantity > 0) items.push({ food_id: Number(food_id), quantity });
    });

    if (!items.length) { toast('Add at least one item', 'error'); return; }

    await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ Customer_Id, Staff_Id, items }),
    });
    toast('Order placed!');
    closeModal();
    renderOrders();
  };
}

// ─── Utility ───
function esc(str) {
  return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Init ───
navigateTo('dashboard');
