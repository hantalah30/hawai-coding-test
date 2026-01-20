/* ===============================
  PIKUL - Simple Mobile App (SPA)
  HTML + CSS + JS only
================================ */

const $ = (q) => document.querySelector(q);
const $$ = (q) => document.querySelectorAll(q);

const loginScreen = $("#loginScreen");
const appShell = $("#appShell");

const screens = {
  Home: $("#screenHome"),
  Map: $("#screenMap"),
  Orders: $("#screenOrders"),
  Messages: $("#screenMessages"),
  Profile: $("#screenProfile"),
};

const userNameEl = $("#userName");
const profileNameEl = $("#profileName");
const profileEmailEl = $("#profileEmail");
const gpsBadge = $("#gpsBadge");
const youCoord = $("#youCoord");
const tick = $("#tick");

const vendorList = $("#vendorList");
const vendorRealtimeList = $("#vendorRealtimeList");
const vendorPins = $("#vendorPins");

const cartBox = $("#cartBox");
const cartCount = $("#cartCount");

const modal = $("#modal");
const checkoutModal = $("#checkoutModal");
const pickChatModal = $("#pickChatModal");

let state = {
  user: null,
  you: { lat: null, lon: null, ok: false },
  vendors: [],
  selectedVendorId: null,
  cart: [], // {vendorId, itemId, name, price, qty}
  orders: [], // {id, vendorName, total, method, status, createdAt, note}
  chatWithVendorId: null,
  chats: {}, // vendorId: [{from:"me"|"vendor", text, ts}]
  mapTick: 0,
};

const MENU = {
  bakso: [
    { id: "m1", name: "Bakso Urat", price: 15000 },
    { id: "m2", name: "Bakso Telur", price: 17000 },
    { id: "m3", name: "Es Teh", price: 5000 },
  ],
  kopi: [
    { id: "k1", name: "Kopi Susu", price: 12000 },
    { id: "k2", name: "Americano", price: 14000 },
    { id: "k3", name: "Roti Bakar", price: 10000 },
  ],
  nasi: [
    { id: "n1", name: "Nasi Goreng", price: 18000 },
    { id: "n2", name: "Mie Goreng", price: 17000 },
    { id: "n3", name: "Air Mineral", price: 4000 },
  ],
};

function rupiah(n) {
  return "Rp " + (n || 0).toLocaleString("id-ID");
}

function uid(prefix="id") {
  return prefix + "-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

/* ---------- AUTH ---------- */
function loadAuth() {
  const raw = localStorage.getItem("pikul_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveAuth(user) {
  localStorage.setItem("pikul_user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("pikul_user");
}

function showLogin() {
  appShell.classList.add("hidden");
  loginScreen.classList.remove("hidden");
}

function showApp() {
  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
}

/* ---------- NAV ---------- */
function setActiveNav(target) {
  $$(".navItem").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.target === target);
  });
}

function showScreen(name) {
  Object.entries(screens).forEach(([k, el]) => {
    el.classList.toggle("hidden", k !== name);
  });
  setActiveNav(name);
  if (name === "Map") renderMap();
  if (name === "Orders") renderOrders();
  if (name === "Messages") renderChat();
  if (name === "Profile") renderProfile();
}

/* ---------- GEOLOCATION ---------- */
let geoWatchId = null;

function setGpsBadge() {
  gpsBadge.textContent = state.you.ok ? "GPS: aktif" : "GPS: belum aktif";
  gpsBadge.classList.toggle("badge--warn", !state.you.ok);
}

function startGPS() {
  if (!navigator.geolocation) {
    state.you.ok = false;
    setGpsBadge();
    alert("Browser kamu tidak mendukung GPS (Geolocation).");
    return;
  }

  // watchPosition = realtime updates
  geoWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      state.you.lat = pos.coords.latitude;
      state.you.lon = pos.coords.longitude;
      state.you.ok = true;
      setGpsBadge();
      youCoord.textContent = `${state.you.lat.toFixed(6)}, ${state.you.lon.toFixed(6)}`;
      if (!state.vendors.length) seedVendors();
      renderVendors();
      renderMap();
    },
    (err) => {
      state.you.ok = false;
      setGpsBadge();
      console.warn(err);
      alert("GPS ditolak / error. Coba jalankan lewat Live Server (https/localhost) dan izinkan lokasi.");
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 }
  );
}

function stopGPS() {
  if (geoWatchId != null) navigator.geolocation.clearWatch(geoWatchId);
  geoWatchId = null;
}

/* ---------- VENDORS (Realtime simulation) ---------- */
function distKm(aLat, aLon, bLat, bLon) {
  // Haversine
  const R = 6371;
  const dLat = (bLat - aLat) * Math.PI / 180;
  const dLon = (bLon - aLon) * Math.PI / 180;
  const x =
    Math.sin(dLat/2) ** 2 +
    Math.cos(aLat * Math.PI/180) * Math.cos(bLat * Math.PI/180) * (Math.sin(dLon/2) ** 2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function seedVendors() {
  // if gps not ready, put default near Jakarta
  const baseLat = state.you.lat ?? -6.200000;
  const baseLon = state.you.lon ?? 106.816666;

  const rand = (min, max) => Math.random() * (max - min) + min;

  state.vendors = [
    { id:"v1", name:"Bakso Mang Ujang", type:"bakso", ico:"🍲", lat: baseLat + rand(-0.006, 0.006), lon: baseLon + rand(-0.006, 0.006), rating: 4.7, busy:"Sedang" },
    { id:"v2", name:"Kopi Keliling Dinda", type:"kopi", ico:"☕", lat: baseLat + rand(-0.006, 0.006), lon: baseLon + rand(-0.006, 0.006), rating: 4.8, busy:"Ramai" },
    { id:"v3", name:"Nasi Goreng Pak De", type:"nasi", ico:"🍳", lat: baseLat + rand(-0.006, 0.006), lon: baseLon + rand(-0.006, 0.006), rating: 4.6, busy:"Lengang" },
    { id:"v4", name:"Es Teh Jumbo Rani", type:"bakso", ico:"🧋", lat: baseLat + rand(-0.006, 0.006), lon: baseLon + rand(-0.006, 0.006), rating: 4.5, busy:"Sedang" },
  ];
}

function moveVendorsSlightly() {
  // simulate realtime movement
  const step = 0.00025;
  state.vendors = state.vendors.map(v => {
    const dx = (Math.random() - 0.5) * step;
    const dy = (Math.random() - 0.5) * step;
    return { ...v, lat: v.lat + dx, lon: v.lon + dy };
  });
  state.mapTick++;
  tick.textContent = `update: ${new Date().toLocaleTimeString("id-ID")}`;
}

setInterval(() => {
  if (!state.vendors.length) return;
  moveVendorsSlightly();
  if (!screens.Map.classList.contains("hidden")) renderMap();
  if (!screens.Home.classList.contains("hidden")) renderVendors();
  if (!screens.Map.classList.contains("hidden")) renderVendorRealtimeList();
}, 2000);

/* ---------- RENDER HOME ---------- */
function vendorDistanceText(v) {
  if (!state.you.ok) return "GPS belum aktif";
  const d = distKm(state.you.lat, state.you.lon, v.lat, v.lon);
  if (d < 1) return `${Math.round(d*1000)} m`;
  return `${d.toFixed(2)} km`;
}

function renderVendors() {
  const q = ($("#searchInput").value || "").toLowerCase().trim();
  const list = state.vendors
    .filter(v => {
      if (!q) return true;
      return (v.name.toLowerCase().includes(q) || v.type.toLowerCase().includes(q));
    })
    .map(v => {
      const dTxt = vendorDistanceText(v);
      return `
        <div class="vendor" data-vendor="${v.id}">
          <div class="ico">${v.ico}</div>
          <div class="meta">
            <b>${v.name}</b>
            <div class="muted">Rating ${v.rating} • ${v.busy}</div>
            <div class="row2">
              <span class="chip">${v.type.toUpperCase()}</span>
              <span class="chip">📍 ${dTxt}</span>
              <span class="chip">Realtime</span>
            </div>
          </div>
          <div class="price">Lihat</div>
        </div>
      `;
    }).join("");

  vendorList.innerHTML = list || `<div class="card"><div class="muted">Tidak ada pedagang yang cocok.</div></div>`;

  // click handlers
  $$("#vendorList .vendor").forEach(el => {
    el.addEventListener("click", () => openVendorModal(el.dataset.vendor));
  });

  renderCart();
}

function renderCart() {
  const items = state.cart;
  cartCount.textContent = `${items.reduce((a, c) => a + c.qty, 0)} item`;

  if (!items.length) {
    cartBox.innerHTML = `<div class="cartEmpty">Keranjang kosong. Klik pedagang → pilih menu.</div>`;
    return;
  }

  const rows = items.map(it => `
    <div class="cartItem">
      <div>
        <b>${it.name}</b>
        <div class="muted">${rupiah(it.price)} • ${getVendorName(it.vendorId)}</div>
      </div>
      <div class="qty">
        <button data-act="dec" data-id="${it.itemId}" title="Kurangi">−</button>
        <b>${it.qty}</b>
        <button data-act="inc" data-id="${it.itemId}" title="Tambah">+</button>
      </div>
    </div>
  `).join("");

  const total = items.reduce((s, it) => s + it.price * it.qty, 0);

  cartBox.innerHTML = `
    ${rows}
    <div class="totalRow">
      <div>
        <div class="muted">Total</div>
        <div class="big"><b>${rupiah(total)}</b></div>
      </div>
      <button id="checkoutBtn" class="btn btn--primary btn--small">Checkout</button>
    </div>
  `;

  cartBox.querySelectorAll("button[data-act]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      const idx = state.cart.findIndex(x => x.itemId === id);
      if (idx < 0) return;
      if (act === "inc") state.cart[idx].qty++;
      if (act === "dec") state.cart[idx].qty--;
      if (state.cart[idx].qty <= 0) state.cart.splice(idx, 1);
      renderCart();
    });
  });

  $("#checkoutBtn").addEventListener("click", openCheckout);
}

/* ---------- MODAL: VENDOR ---------- */
const modalTitle = $("#modalTitle");
const modalDistance = $("#modalDistance");
const menuList = $("#menuList");

function getVendorById(id) {
  return state.vendors.find(v => v.id === id);
}
function getVendorName(id) {
  return getVendorById(id)?.name ?? "-";
}

function openVendorModal(vendorId) {
  state.selectedVendorId = vendorId;
  const v = getVendorById(vendorId);
  if (!v) return;

  modalTitle.textContent = v.name;
  modalDistance.innerHTML = `<b>${vendorDistanceText(v)}</b>`;
  const menu = MENU[v.type] || [];

  menuList.innerHTML = menu.map(m => `
    <div class="item" data-menu="${m.id}">
      <div>
        <b>${m.name}</b>
        <div class="muted">Pedagang: ${v.name}</div>
      </div>
      <div class="price">${rupiah(m.price)}</div>
    </div>
  `).join("");

  // click to add
  menuList.querySelectorAll(".item").forEach(el => {
    el.addEventListener("click", () => {
      addToCart(vendorId, v.type, el.dataset.menu);
    });
  });

  modal.classList.remove("hidden");
}

function closeVendorModal() {
  modal.classList.add("hidden");
}

function addToCart(vendorId, type, menuId) {
  const item = (MENU[type] || []).find(x => x.id === menuId);
  if (!item) return;

  const existing = state.cart.find(x => x.vendorId === vendorId && x.itemId === menuId);
  if (existing) existing.qty++;
  else state.cart.push({ vendorId, itemId: menuId, name: item.name, price: item.price, qty: 1 });

  renderCart();
}

$("#closeModalBtn").addEventListener("click", closeVendorModal);
$("#modalOverlay").addEventListener("click", closeVendorModal);

$("#chatVendorBtn").addEventListener("click", () => {
  const vId = state.selectedVendorId;
  if (!vId) return;
  state.chatWithVendorId = vId;
  closeVendorModal();
  showScreen("Messages");
});

$("#goCheckoutBtn").addEventListener("click", () => {
  closeVendorModal();
  openCheckout();
});

/* ---------- CHECKOUT ---------- */
const checkoutItems = $("#checkoutItems");
const checkoutTotal = $("#checkoutTotal");

function openCheckout() {
  if (!state.cart.length) {
    alert("Keranjang masih kosong.");
    return;
  }
  // group items
  checkoutItems.innerHTML = state.cart.map(it => `
    <div class="item">
      <div>
        <b>${it.name} × ${it.qty}</b>
        <div class="muted">${getVendorName(it.vendorId)}</div>
      </div>
      <div class="price">${rupiah(it.price * it.qty)}</div>
    </div>
  `).join("");

  const total = state.cart.reduce((s, it) => s + it.price * it.qty, 0);
  checkoutTotal.textContent = rupiah(total);

  checkoutModal.classList.remove("hidden");
}

function closeCheckout() {
  checkoutModal.classList.add("hidden");
}

$("#closeCheckoutBtn").addEventListener("click", closeCheckout);
$("#checkoutOverlay").addEventListener("click", closeCheckout);

$("#placeOrderBtn").addEventListener("click", () => {
  const method = $("#payMethod").value;
  const note = $("#orderNote").value.trim();
  const total = state.cart.reduce((s, it) => s + it.price * it.qty, 0);

  // vendor name: take the first vendor in cart (simple)
  const vId = state.cart[0].vendorId;
  const vendorName = getVendorName(vId);

  const order = {
    id: uid("ORD"),
    vendorName,
    total,
    method,
    status: "Diproses",
    createdAt: new Date().toISOString(),
    note,
    items: JSON.parse(JSON.stringify(state.cart)),
  };

  state.orders.unshift(order);

  // fake auto-status change
  setTimeout(() => {
    const o = state.orders.find(x => x.id === order.id);
    if (o) o.status = "Dalam perjalanan";
    if (!screens.Orders.classList.contains("hidden")) renderOrders();
  }, 3500);

  setTimeout(() => {
    const o = state.orders.find(x => x.id === order.id);
    if (o) o.status = "Selesai";
    if (!screens.Orders.classList.contains("hidden")) renderOrders();
  }, 8000);

  // clear cart
  state.cart = [];
  $("#orderNote").value = "";
  closeCheckout();
  renderCart();
  showScreen("Orders");
});

/* ---------- MAP SCREEN ---------- */
function renderMap() {
  // simple "map" area: convert lat/lon to % position
  vendorPins.innerHTML = "";

  const box = $(".mapBox");
  const w = box.clientWidth;
  const h = box.clientHeight;

  // base reference
  const baseLat = state.you.lat ?? -6.200000;
  const baseLon = state.you.lon ?? 106.816666;

  // place "you"
  const youEl = $(".mapPin.you");
  youEl.style.left = "50%";
  youEl.style.top = "55%";

  // vendor pins around
  state.vendors.forEach(v => {
    const dx = (v.lon - baseLon) * 8000; // scale
    const dy = (v.lat - baseLat) * -8000;
    const x = Math.max(6, Math.min(w - 60, (w / 2) + dx));
    const y = Math.max(10, Math.min(h - 40, (h * 0.55) + dy));

    const pin = document.createElement("div");
    pin.className = "mapPin";
    pin.style.left = x + "px";
    pin.style.top = y + "px";
    pin.textContent = v.ico + " " + v.name.split(" ").slice(0,2).join(" ");
    pin.title = `${v.name} • ${vendorDistanceText(v)}`;
    pin.style.cursor = "pointer";
    pin.addEventListener("click", () => openVendorModal(v.id));
    vendorPins.appendChild(pin);
  });

  renderVendorRealtimeList();
}

function renderVendorRealtimeList() {
  vendorRealtimeList.innerHTML = state.vendors.map(v => `
    <div class="item" data-vendor="${v.id}">
      <div>
        <b>${v.ico} ${v.name}</b>
        <div class="muted">📍 ${vendorDistanceText(v)} • (${v.lat.toFixed(5)}, ${v.lon.toFixed(5)})</div>
      </div>
      <div class="price">Menu</div>
    </div>
  `).join("");

  vendorRealtimeList.querySelectorAll(".item").forEach(el => {
    el.addEventListener("click", () => openVendorModal(el.dataset.vendor));
  });
}

$("#openMapsBtn").addEventListener("click", () => {
  if (!state.you.ok) {
    alert("GPS belum aktif.");
    return;
  }
  // Open Google Maps using query
  const url = `https://www.google.com/maps?q=${state.you.lat},${state.you.lon}`;
  window.open(url, "_blank");
});

/* ---------- ORDERS ---------- */
function renderOrders() {
  const list = $("#ordersList");
  if (!state.orders.length) {
    list.innerHTML = `<div class="card"><div class="muted">Belum ada pesanan. Pesan dari Home dulu.</div></div>`;
    return;
  }

  list.innerHTML = state.orders.map(o => {
    const time = new Date(o.createdAt).toLocaleString("id-ID");
    const statusBadge =
      o.status === "Selesai" ? "badge" :
      o.status === "Dalam perjalanan" ? "badge badge--warn" :
      "badge badge--warn";

    return `
      <div class="item" data-order="${o.id}">
        <div>
          <b>${o.vendorName}</b>
          <div class="muted">${time} • ${o.method.toUpperCase()}</div>
          <div class="muted">Catatan: ${o.note ? o.note : "-"}</div>
        </div>
        <div style="text-align:right">
          <div class="price">${rupiah(o.total)}</div>
          <div class="${statusBadge}" style="display:inline-block; margin-top:6px;">${o.status}</div>
        </div>
      </div>
    `;
  }).join("");

  // click order to show details
  list.querySelectorAll(".item").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.order;
      const o = state.orders.find(x => x.id === id);
      if (!o) return;
      const detail = o.items.map(it => `- ${it.name} x${it.qty} (${rupiah(it.price * it.qty)})`).join("\n");
      alert(
        `Detail Pesanan\n\n` +
        `Vendor: ${o.vendorName}\n` +
        `Status: ${o.status}\n` +
        `Metode: ${o.method}\n` +
        `Total: ${rupiah(o.total)}\n\n` +
        `Items:\n${detail}`
      );
    });
  });
}

/* ---------- MESSAGES ---------- */
const chatBox = $("#chatBox");
const chatWith = $("#chatWith");

function ensureChat(vendorId) {
  if (!state.chats[vendorId]) state.chats[vendorId] = [];
  return state.chats[vendorId];
}

function renderChat() {
  const vId = state.chatWithVendorId;
  const name = vId ? getVendorName(vId) : "-";
  chatWith.innerHTML = `<b>${name}</b>`;

  chatBox.innerHTML = "";

  if (!vId) {
    chatBox.innerHTML = `<div class="muted">Pilih pedagang untuk mulai chat.</div>`;
    return;
  }

  const msgs = ensureChat(vId);
  if (!msgs.length) {
    msgs.push({ from:"vendor", text:"Halo! Mau pesan apa hari ini?", ts: Date.now() });
  }

  msgs.forEach(m => {
    const div = document.createElement("div");
    div.className = "bubble" + (m.from === "me" ? " me" : "");
    div.textContent = m.text;
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

$("#sendChatBtn").addEventListener("click", () => {
  const vId = state.chatWithVendorId;
  if (!vId) { alert("Pilih pedagang dulu."); return; }

  const txt = $("#chatInput").value.trim();
  if (!txt) return;

  const msgs = ensureChat(vId);
  msgs.push({ from:"me", text: txt, ts: Date.now() });
  $("#chatInput").value = "";
  renderChat();

  // simple auto reply
  setTimeout(() => {
    msgs.push({ from:"vendor", text: "Siap, noted ya ✅", ts: Date.now() });
    renderChat();
  }, 900);
});

$("#pickVendorChatBtn").addEventListener("click", () => {
  openPickChat();
});

function openPickChat() {
  const list = $("#pickChatList");
  list.innerHTML = state.vendors.map(v => `
    <div class="item" data-vendor="${v.id}">
      <div>
        <b>${v.ico} ${v.name}</b>
        <div class="muted">Tap untuk chat</div>
      </div>
      <div class="price">Pilih</div>
    </div>
  `).join("");

  list.querySelectorAll(".item").forEach(el => {
    el.addEventListener("click", () => {
      state.chatWithVendorId = el.dataset.vendor;
      closePickChat();
      renderChat();
    });
  });

  pickChatModal.classList.remove("hidden");
}

function closePickChat() {
  pickChatModal.classList.add("hidden");
}
$("#closePickChatBtn").addEventListener("click", closePickChat);
$("#closePickChatBtn2").addEventListener("click", closePickChat);
$("#pickChatOverlay").addEventListener("click", closePickChat);

/* ---------- PROFILE ---------- */
function renderProfile() {
  profileNameEl.innerHTML = `<b>${state.user?.name ?? "Pengguna"}</b>`;
  profileEmailEl.textContent = state.user?.email ?? "-";
  userNameEl.textContent = state.user?.name ?? "Pengguna";
  $("#wallet").textContent = rupiah(state.user?.wallet ?? 0);
}

$("#topupBtn").addEventListener("click", () => {
  // dummy top up
  state.user.wallet = (state.user.wallet ?? 0) + 50000;
  saveAuth(state.user);
  renderProfile();
  alert("Top up berhasil (dummy) +Rp 50.000");
});

/* ---------- EVENTS ---------- */
$("#locBtn").addEventListener("click", startGPS);

$("#logoutBtn").addEventListener("click", () => {
  if (confirm("Keluar dari akun?")) {
    stopGPS();
    clearAuth();
    state.user = null;
    showLogin();
  }
});

$("#refreshVendorsBtn").addEventListener("click", () => {
  if (!state.vendors.length) seedVendors();
  else moveVendorsSlightly();
  renderVendors();
});

$("#searchInput").addEventListener("input", renderVendors);

$$(".navItem").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    showScreen(target);
  });
});

/* ---------- LOGIN FORM ---------- */
$("#loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("#email").value.trim();
  const pass = $("#password").value.trim();

  // very simple validation
  if (!email.includes("@")) {
    alert("Email tidak valid.");
    return;
  }
  if (pass.length < 4) {
    alert("Password minimal 4 karakter.");
    return;
  }

  const name = email.split("@")[0].replaceAll(".", " ").slice(0, 18);
  const user = { id: uid("USR"), email, name: titleCase(name), wallet: 0 };
  state.user = user;
  saveAuth(user);

  showApp();
  renderProfile();
  showScreen("Home");
  setGpsBadge();
  if (!state.vendors.length) seedVendors();
  renderVendors();
});

$("#demoBtn").addEventListener("click", () => {
  const user = { id: uid("USR"), email: "demo@pikul.id", name: "Ily Demo", wallet: 25000 };
  state.user = user;
  saveAuth(user);

  showApp();
  renderProfile();
  showScreen("Home");
  setGpsBadge();
  if (!state.vendors.length) seedVendors();
  renderVendors();
});

/* ---------- UTILS ---------- */
function titleCase(s){
  return (s || "").split(" ").filter(Boolean).map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

/* ---------- INIT ---------- */
(function init(){
  const u = loadAuth();
  if (u) {
    state.user = u;
    showApp();
    renderProfile();
    showScreen("Home");
    setGpsBadge();
    seedVendors();
    renderVendors();
  } else {
    showLogin();
  }
})();
