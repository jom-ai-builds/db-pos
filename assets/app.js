const API_BASE = (typeof window !== 'undefined' && window.API_BASE)
  ? window.API_BASE
  : "YOUR_WEBAPP_URL_HERE"; // fallback, never used in production

let cart = [];

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
// Staff Login
// --------------------
document.getElementById("loginBtn").addEventListener("click", login);

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const loginErrorEl = document.getElementById("loginError");
  loginErrorEl.innerText = "";

  if (!email || !password) {
    loginErrorEl.innerText = "Email and password required";
    return;
  }

  try {
    const resp = await api("staffLogin", { email, password }, "POST");

    if (resp.success) {
      sessionStorage.setItem("staffEmail", resp.email);
      showPOS();
    } else {
      loginErrorEl.innerText = resp.message || "Login failed";
    }
  } catch (err) {
    console.error("Login error:", err);
    loginErrorEl.innerText = "Connection failed";
  }
}

// --------------------
// Show POS interface
// --------------------
function showPOS() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("posContainer").style.display = "block";
  loadMenu();
  renderCart();
}

// --------------------
// Cart Operations
// --------------------
function addToCart(itemId, name, price) {
  const existing = cart.find(i => i.id === itemId);
  if (existing) existing.qty += 1;
  else cart.push({ id: itemId, name, price, qty: 1 });
  renderCart();
}

function removeFromCart(itemId) {
  cart = cart.filter(i => i.id !== itemId);
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
}

function renderCart() {
  const el = document.getElementById("cart");
  el.innerHTML = "";
  if (cart.length === 0) {
    el.innerHTML = "<p>Cart is empty</p>";
    document.getElementById("totalDisplay").innerText = "";
    return;
  }

  let total = 0;
  cart.forEach(i => {
    total += i.price * i.qty;
    const div = document.createElement("div");
    div.innerHTML = `${i.name} x ${i.qty} = ₱${i.price * i.qty} 
      <button onclick="removeFromCart('${i.id}')">Remove</button>`;
    el.appendChild(div);
  });
  document.getElementById("totalDisplay").innerText = `Total: ₱${total}`;
}

// --------------------
// Checkout
// --------------------
document.getElementById("checkoutBtn").addEventListener("click", checkout);

async function checkout() {
  const staffEmail = sessionStorage.getItem("staffEmail");
  if (!staffEmail) {
    alert("You must log in first.");
    return;
  }

  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const payment_method = document.getElementById("paymentMethod").value;
  const tendered = Number(document.getElementById("tendered").value) || 0;

  try {
    const payload = {
      items: cart.map(i => ({ id: i.id, qty: i.qty })),
      payment_method,
      tendered
    };

    const resp = await api("addOrder", payload, "POST");

    if (resp.ok) {
      alert(`Order placed! ID: ${resp.orderId}\nTotal: ₱${resp.total}\nStatus: ${resp.status}`);
      clearCart();
      document.getElementById("tendered").value = "";
    } else {
      alert(`Failed to place order: ${resp.error || "Unknown error"}`);
    }
  } catch (err) {
    console.error("Checkout error:", err);
    alert("Error processing order.");
  }
}

// --------------------
// Load Menu
// --------------------
async function loadMenu() {
  try {
    const menu = await api("getMenu", {}, "GET");
    renderMenu(menu);
  } catch (err) {
    console.error("Load menu error:", err);
    alert("Failed to load menu.");
  }
}

function renderMenu(menu) {
  const el = document.getElementById("menu");
  el.innerHTML = "";
  if (!menu || menu.length === 0) {
    el.innerHTML = "<p>No menu items available.</p>";
    return;
  }

  menu.forEach(item => {
    const btn = document.createElement("button");
    btn.innerText = `${item.name} - ₱${item.price}`;
    btn.onclick = () => addToCart(item.id, item.name, item.price);
    el.appendChild(btn);
  });
}
