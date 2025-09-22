// ====================
// Secure app.js client
// ====================

// Placeholder — replaced at deployment via GitHub Actions
const API_BASE = (typeof window !== 'undefined' && window.API_BASE)
  ? window.API_BASE
  : "YOUR_WEBAPP_URL_HERE";

// --------------------
// API Helper
// --------------------
async function api(action, data = {}, method = "POST") {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" }
  };
  if (method === "POST") opts.body = JSON.stringify(data);

  const resp = await fetch(`${API_BASE}?action=${encodeURIComponent(action)}`, opts);
  if (!resp.ok) throw new Error("Network/API error");
  return await resp.json();
}

// --------------------
// Cart Handling
// --------------------
let cart = JSON.parse(localStorage.getItem("deli_cart") || '{"items":[]}');

function saveCart() {
  localStorage.setItem("deli_cart", JSON.stringify(cart));
  renderCart();
}

function clearCart() {
  cart = { items: [] };
  saveCart();
}

function addToCart(itemId, name, price) {
  const existing = cart.items.find(i => i.id === itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.items.push({ id: itemId, name, price, qty: 1 });
  }
  saveCart();
}

function removeFromCart(itemId) {
  cart.items = cart.items.filter(i => i.id !== itemId);
  saveCart();
}

function renderCart() {
  const el = document.getElementById("cart");
  if (!el) return;

  if (cart.items.length === 0) {
    el.innerHTML = "<p>Cart is empty</p>";
    return;
  }

  let html = "<ul>";
  cart.items.forEach(i => {
    html += `<li>${i.name} (₱${i.price}) x ${i.qty} 
      <button onclick="removeFromCart('${i.id}')">Remove</button></li>`;
  });
  html += "</ul>";
  html += `<button onclick="checkout()">Checkout</button>`;
  el.innerHTML = html;
}

// --------------------
// Checkout & Payments
// --------------------
async function checkout() {
  const method = prompt("Enter payment method (cash/gcash):", "cash");
  if (!method) return;

  let tendered = 0;
  if (method === "cash") {
    tendered = Number(prompt("Enter cash amount tendered:", "0")) || 0;
  }

  try {
    const payload = {
      items: cart.items.map(i => ({ id: i.id, qty: i.qty })),
      payment_method: method,
      tendered: tendered
    };

    const resp = await api("addOrder", payload, "POST");

    if (resp.error) throw new Error(resp.error);

    alert(`Order saved.\nTotal: ₱${resp.total}\nStatus: ${resp.status}`);
    clearCart();
  } catch (err) {
    console.error("checkout error:", err);
    alert("Failed to process order.");
  }
}

// --------------------
// Menu Management (Admin)
// --------------------
async function loadMenu() {
  try {
    const resp = await api("getMenu", {}, "GET");
    if (resp.error) throw new Error(resp.error);
    renderMenu(resp);
  } catch (err) {
    console.error("loadMenu error:", err);
    alert("Failed to load menu.");
  }
}

function renderMenu(resp) {
  const el = document.getElementById("menu");
  if (!el) return;

  let html = "<ul>";
  resp.forEach(item => {
    html += `<li>${item.name} (₱${item.price}) 
      <button onclick="addToCart('${item.id}','${item.name}',${item.price})">Add</button></li>`;
  });
  html += "</ul>";
  el.innerHTML = html;
}

async function addMenuItem() {
  const id = prompt("Enter item ID:");
  const name = prompt("Enter item name:");
  const price = Number(prompt("Enter item price:"));
  const category = prompt("Enter category:");

  try {
    const resp = await api("addMenuItem", { item: { id, name, price, category } }, "POST");
    if (resp.error) throw new Error(resp.error);
    alert("Item added.");
    loadMenu();
  } catch (err) {
    console.error("addMenuItem error:", err);
    alert("Failed to add item.");
  }
}

async function updateMenuItem() {
  const id = prompt("Enter item ID to update:");
  const name = prompt("Enter new name:");
  const price = Number(prompt("Enter new price:"));
  const category = prompt("Enter new category:");

  try {
    const resp = await api("updateMenuItem", { item: { id, name, price, category } }, "POST");
    if (resp.error) throw new Error(resp.error);
    alert("Item updated.");
    loadMenu();
  } catch (err) {
    console.error("updateMenuItem error:", err);
    alert("Failed to update item.");
  }
}

async function deleteMenuItem() {
  const id = prompt("Enter item ID to delete:");
  try {
    const resp = await api("deleteMenuItem", { id }, "POST");
    if (resp.error) throw new Error(resp.error);
    alert("Item deleted.");
    loadMenu();
  } catch (err) {
    console.error("deleteMenuItem error:", err);
    alert("Failed to delete item.");
  }
}

// --------------------
// Sales Reports (Admin)
// --------------------
async function loadSalesReport() {
    try {
      const resp = await api("getReportSales", {}, "GET");
      if (resp.error) throw new Error(resp.error);
      renderReport(resp.sales);
    } catch (err) {
      console.error("loadSalesReport error:", err);
      alert("Failed to load sales report.");
    }
  }
  
  function renderReport(sales) {
    const el = document.getElementById("report");
    if (!el) return;
  
    if (!sales || sales.length === 0) {
      el.innerHTML = "<p>No sales data.</p>";
      return;
    }
  
    let html = "<table><tr><th>Date</th><th>Total</th><th>Status</th></tr>";
    sales.forEach(s => {
      html += `<tr><td>${new Date(s.date).toLocaleString()}</td>
        <td>₱${s.total}</td><td>${s.status}</td></tr>`;
    });
    html += "</table>";
    el.innerHTML = html;
  }
  
  // Trigger browser print
  function printReport() {
    window.print();
  }
  
  // --------------------
  // Event Listeners (for HTML)
  // --------------------
  document.addEventListener("DOMContentLoaded", () => {
    renderCart();
    loadMenu();
  
    // Hook admin buttons if present
    const addBtn = document.getElementById("btnAddItem");
    if (addBtn) addBtn.addEventListener("click", addMenuItem);
  
    const updateBtn = document.getElementById("btnUpdateItem");
    if (updateBtn) updateBtn.addEventListener("click", updateMenuItem);
  
    const deleteBtn = document.getElementById("btnDeleteItem");
    if (deleteBtn) deleteBtn.addEventListener("click", deleteMenuItem);
  
    const reportBtn = document.getElementById("btnLoadReport");
    if (reportBtn) reportBtn.addEventListener("click", loadSalesReport);
  
    const printBtn = document.getElementById("btnPrintReport");
    if (printBtn) printBtn.addEventListener("click", printReport); // NEW
  });
  