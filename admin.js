// ============================================================
// admin.js – Dashboard Admin dengan Statistik, Filter, Aksi
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// ------------------------------------------------------------
// KONFIGURASI FIREBASE
// ------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyA2IElw69ToQOkJuXnEusj6t8g_etlM6Wg",
  authDomain: "saladbuahputri-3f98f.firebaseapp.com",
  projectId: "saladbuahputri-3f98f",
  storageBucket: "saladbuahputri-3f98f.firebasestorage.app",
  messagingSenderId: "874788251021",
  appId: "1:874788251021:web:717d9465d61272a78409c4",
  measurementId: "G-KMBHWG5TN6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ------------------------------------------------------------
// ELEMEN DOM
// ------------------------------------------------------------
const loginSection = document.getElementById("loginSection");
const adminContent = document.getElementById("adminContent");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

const tableBody = document.getElementById("ordersTableBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const statsContainer = document.getElementById("statsContainer");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
const detailModal = document.getElementById("detailModal");
const detailContent = document.getElementById("detailContent");
const closeDetailModal = document.getElementById("closeDetailModal");
const toastContainer = document.getElementById("toastContainer");

let ordersData = [];
let filteredOrders = [];
let currentFilter = "semua";
let unsubscribeOrders = null;

// ------------------------------------------------------------
// HELPER
// ------------------------------------------------------------
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number || 0);
}

function formatTanggal(timestamp) {
  if (!timestamp || !timestamp.toDate) return "—";
  const date = timestamp.toDate();
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusBadge(status) {
  const map = {
    "Menunggu Pembayaran": "badge-menunggu",
    "Sudah Dibayar": "badge-dibayar",
    "Diproses": "badge-diproses",
    "Siap Dikirim": "badge-siap",
    "Selesai": "badge-selesai",
    "Dibatalkan": "badge-batal",
  };
  return map[status] || "badge-menunggu";
}

// ------------------------------------------------------------
// TOAST
// ------------------------------------------------------------
function showToast(message, icon = "fa-check-circle", bg = "dark") {
  const toast = document.createElement("div");
  toast.className = "toast-item";
  toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
  if (bg === "success") toast.style.background = "#2D6A4F";
  else if (bg === "danger") toast.style.background = "#B91C1C";
  else if (bg === "warning") toast.style.background = "#B45309";
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ------------------------------------------------------------
// LOGIN / LOGOUT
// ------------------------------------------------------------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.classList.add("hidden");
  try {
    await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPassword.value.trim());
  } catch (error) {
    loginError.textContent = "Email atau password salah.";
    loginError.classList.remove("hidden");
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// ------------------------------------------------------------
// AUTH STATE
// ------------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.classList.add("hidden");
    adminContent.classList.remove("hidden");
    if (!unsubscribeOrders) startListeningOrders();
  } else {
    loginSection.classList.remove("hidden");
    adminContent.classList.add("hidden");
    if (unsubscribeOrders) {
      unsubscribeOrders();
      unsubscribeOrders = null;
    }
    ordersData = [];
    renderTable([]);
    renderStats([]);
  }
});

// ------------------------------------------------------------
// LISTENER FIRESTORE
// ------------------------------------------------------------
function startListeningOrders() {
  const q = query(collection(db, "pesanan"), orderBy("createdAt", "desc"));
  unsubscribeOrders = onSnapshot(q,
    (snapshot) => {
      loadingState.classList.add("hidden");
      if (snapshot.empty) {
        ordersData = [];
        renderTable([]);
        renderStats([]);
        emptyState.classList.remove("hidden");
        return;
      }
      emptyState.classList.add("hidden");
      ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      applyFiltersAndSearch();
    },
    (error) => {
      console.error("Listener error:", error);
      showToast("Gagal memuat data: " + error.message, "fa-exclamation-circle", "danger");
      loadingState.classList.remove("hidden");
    }
  );
}

// ------------------------------------------------------------
// FILTER & SEARCH
// ------------------------------------------------------------
function applyFiltersAndSearch() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  let filtered = [...ordersData];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  switch (currentFilter) {
    case "hari-ini":
      filtered = filtered.filter(o => {
        if (!o.createdAt) return false;
        const d = o.createdAt.toDate();
        return d >= today;
      });
      break;
    case "minggu-ini":
      filtered = filtered.filter(o => {
        if (!o.createdAt) return false;
        const d = o.createdAt.toDate();
        return d >= startOfWeek;
      });
      break;
    case "belum-proses":
      filtered = filtered.filter(o => o.status !== "Selesai" && o.status !== "Dibatalkan");
      break;
    case "selesai":
      filtered = filtered.filter(o => o.status === "Selesai");
      break;
    default: break;
  }

  if (searchTerm) {
    filtered = filtered.filter(o =>
      (o.nomorOrder && o.nomorOrder.toLowerCase().includes(searchTerm)) ||
      (o.nama && o.nama.toLowerCase().includes(searchTerm)) ||
      (o.whatsapp && o.whatsapp.includes(searchTerm))
    );
  }

  filteredOrders = filtered;
  renderTable(filtered);
  renderStats(filtered);
}

searchInput.addEventListener("input", applyFiltersAndSearch);

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active", "bg-dark", "text-cream"));
    btn.classList.add("active", "bg-dark", "text-cream");
    currentFilter = btn.dataset.filter;
    applyFiltersAndSearch();
  });
});

// ------------------------------------------------------------
// RENDER STATISTIK
// ------------------------------------------------------------
function renderStats(orders) {
  const total = orders.length;
  const omzet = orders.reduce((s, o) => s + (o.totalHarga || 0), 0);
  const today = new Date();
  today.setHours(0,0,0,0);
  const baruHariIni = orders.filter(o => {
    if (!o.createdAt) return false;
    const d = o.createdAt.toDate();
    return d >= today;
  }).length;
  const menunggu = orders.filter(o => o.status === "Menunggu Pembayaran").length;
  const diproses = orders.filter(o => o.status === "Diproses" || o.status === "Sudah Dibayar" || o.status === "Siap Dikirim").length;
  const selesai = orders.filter(o => o.status === "Selesai").length;

  const stats = [
    { label: "Total Pesanan", value: total, icon: "fa-box", color: "text-kiwi-dark" },
    { label: "Omzet", value: formatRupiah(omzet), icon: "fa-rupiah-sign", color: "text-watermelon-dark" },
    { label: "Baru Hari Ini", value: baruHariIni, icon: "fa-calendar-day", color: "text-mango" },
    { label: "Menunggu", value: menunggu, icon: "fa-clock", color: "text-orange-400" },
    { label: "Diproses", value: diproses, icon: "fa-spinner", color: "text-kiwi" },
    { label: "Selesai", value: selesai, icon: "fa-check-circle", color: "text-green-500" },
  ];

  statsContainer.innerHTML = stats.map(s => `
    <div class="stat-card bg-white rounded-2xl p-4 border border-dark/10 shadow-sm hover:shadow-md transition">
      <div class="flex items-center gap-2 text-dark/50 text-xs font-semibold uppercase tracking-wide">
        <i class="fas ${s.icon} ${s.color}"></i>
        <span>${s.label}</span>
      </div>
      <p class="font-display font-700 text-xl mt-1">${s.value}</p>
    </div>
  `).join("");
}

// ------------------------------------------------------------
// RENDER TABEL
// ------------------------------------------------------------
function renderTable(orders) {
  if (!orders.length) {
    tableBody.innerHTML = `
      <tr><td colspan="9" class="py-8 text-center text-dark/40">Tidak ada pesanan yang cocok dengan filter.</td></tr>
    `;
    return;
  }

  tableBody.innerHTML = orders.map((order) => `
    <tr class="table-row-zebra border-b border-dark/5 hover:bg-cream/50 transition">
      <td class="px-4 py-3.5 font-mono text-xs text-dark/70">${order.nomorOrder || "—"}</td>
      <td class="px-4 py-3.5 text-dark/70 whitespace-nowrap">${formatTanggal(order.createdAt)}</td>
      <td class="px-4 py-3.5 font-semibold">${order.nama || "—"}</td>
      <td class="px-4 py-3.5">
        <a href="https://wa.me/${(order.whatsapp || "").replace(/\D/g, "")}" target="_blank" 
           class="text-kiwi-dark font-medium hover:underline flex items-center gap-1">
          <i class="fab fa-whatsapp text-sm"></i> ${order.whatsapp || "—"}
        </a>
      </td>
      <td class="px-4 py-3.5 max-w-[180px]">
        <div class="truncate-detail">${order.alamat || "—"}</div>
        ${order.alamat && order.alamat.length > 60 ? `<button class="text-xs text-watermelon-dark font-medium mt-1 detail-btn" data-id="${order.id}">Lihat Detail</button>` : ""}
      </td>
      <td class="px-4 py-3.5 max-w-[140px]">
        <div class="truncate-detail">${order.catatan && order.catatan !== "-" ? order.catatan : "—"}</div>
        ${order.catatan && order.catatan.length > 40 ? `<button class="text-xs text-watermelon-dark font-medium mt-1 detail-btn" data-id="${order.id}">Lihat Detail</button>` : ""}
      </td>
      <td class="px-4 py-3.5 font-bold text-watermelon-dark whitespace-nowrap">${formatRupiah(order.totalHarga)}</td>
      <td class="px-4 py-3.5">
        <span class="badge-status ${getStatusBadge(order.status)}">${order.status || "—"}</span>
      </td>
      <td class="px-4 py-3.5">
        <div class="flex flex-wrap items-center gap-1 action-buttons">
          <button class="detail-btn text-dark/50 hover:text-watermelon-dark p-1.5 rounded-lg hover:bg-watermelon/10 transition" data-id="${order.id}" title="Detail">
            <i class="fas fa-eye text-sm"></i>
          </button>
          <a href="https://wa.me/${(order.whatsapp || "").replace(/\D/g, "")}" target="_blank" class="text-dark/50 hover:text-green-500 p-1.5 rounded-lg hover:bg-green-50 transition" title="Chat WhatsApp">
            <i class="fab fa-whatsapp text-sm"></i>
          </a>
          <select class="status-dropdown text-xs" data-id="${order.id}" data-current="${order.status}">
            <option value="Menunggu Pembayaran" ${order.status === "Menunggu Pembayaran" ? "selected" : ""}>Menunggu</option>
            <option value="Sudah Dibayar" ${order.status === "Sudah Dibayar" ? "selected" : ""}>Dibayar</option>
            <option value="Diproses" ${order.status === "Diproses" ? "selected" : ""}>Diproses</option>
            <option value="Siap Dikirim" ${order.status === "Siap Dikirim" ? "selected" : ""}>Siap Kirim</option>
            <option value="Selesai" ${order.status === "Selesai" ? "selected" : ""}>Selesai</option>
            <option value="Dibatalkan" ${order.status === "Dibatalkan" ? "selected" : ""}>Batal</option>
          </select>
          <button class="delete-btn text-dark/50 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition" data-id="${order.id}" data-nomor="${order.nomorOrder}" title="Hapus">
            <i class="fas fa-trash text-sm"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  // Detail
  document.querySelectorAll(".detail-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const order = ordersData.find(o => o.id === id);
      if (order) openDetail(order);
    });
  });

  // Ubah Status
  document.querySelectorAll(".status-dropdown").forEach(select => {
    select.addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const newStatus = e.target.value;
      await updateOrderStatus(id, newStatus);
    });
  });

  // Hapus
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const nomor = btn.dataset.nomor;
      if (confirm(`Yakin ingin menghapus pesanan #${nomor}?`)) {
        deleteOrder(id);
      }
    });
  });
}

// ------------------------------------------------------------
// UPDATE STATUS
// ------------------------------------------------------------
async function updateOrderStatus(id, status) {
  try {
    await updateDoc(doc(db, "pesanan", id), { status });
    showToast(`Status berhasil diubah menjadi "${status}"`, "fa-check-circle", "success");
  } catch (error) {
    console.error("Gagal update status:", error);
    showToast("Gagal mengubah status", "fa-exclamation-circle", "danger");
  }
}

// ------------------------------------------------------------
// HAPUS PESANAN
// ------------------------------------------------------------
async function deleteOrder(id) {
  try {
    await deleteDoc(doc(db, "pesanan", id));
    showToast("Pesanan berhasil dihapus", "fa-trash", "warning");
  } catch (error) {
    console.error("Gagal hapus:", error);
    showToast("Gagal menghapus pesanan", "fa-exclamation-circle", "danger");
  }
}

// ------------------------------------------------------------
// MODAL DETAIL
// ------------------------------------------------------------
function openDetail(order) {
  const items = order.items?.map(i => `<div class="flex justify-between text-sm"><span>${i.nama} x${i.qty}</span><span>${formatRupiah(i.subtotal)}</span></div>`).join("") || "";
  detailContent.innerHTML = `
    <div class="space-y-2">
      <div><span class="font-semibold">No. Order:</span> ${order.nomorOrder}</div>
      <div><span class="font-semibold">Tanggal:</span> ${formatTanggal(order.createdAt)}</div>
      <div><span class="font-semibold">Nama:</span> ${order.nama}</div>
      <div><span class="font-semibold">WhatsApp:</span> ${order.whatsapp}</div>
      <div><span class="font-semibold">Alamat:</span> ${order.alamat}</div>
      <div><span class="font-semibold">Catatan:</span> ${order.catatan && order.catatan !== "-" ? order.catatan : "—"}</div>
      <div><span class="font-semibold">Status:</span> <span class="badge-status ${getStatusBadge(order.status)}">${order.status}</span></div>
      <div class="border-t border-dark/10 pt-2 mt-2">
        <div class="font-semibold mb-1">Detail Pesanan:</div>
        ${items}
        <div class="flex justify-between font-bold mt-2 pt-2 border-t border-dark/10">
          <span>Total</span>
          <span class="text-watermelon-dark">${formatRupiah(order.totalHarga)}</span>
        </div>
      </div>
    </div>
  `;
  detailModal.classList.remove("hidden");
  detailModal.style.display = "flex";
}

closeDetailModal.addEventListener("click", () => {
  detailModal.classList.add("hidden");
  detailModal.style.display = "none";
});

detailModal.addEventListener("click", (e) => {
  if (e.target === detailModal) {
    detailModal.classList.add("hidden");
    detailModal.style.display = "none";
  }
});

// ------------------------------------------------------------
// SKELETON SAAT LOADING
// ------------------------------------------------------------
function renderSkeleton() {
  const skeletonRows = Array.from({ length: 5 }, () => `
    <tr>
      <td class="px-4 py-3"><div class="skeleton h-4 w-20"></div></td>
      <td class="px-4 py-3"><div class="skeleton h-4 w-28"></div></td>
      <td class="px-4 py-3"><div class="skeleton h-4 w-24"></div></td>
      <td class="px-4 py-3"><div class="skeleton h-4 w-32"></div></td>
      <td class="px-4 py-3"><div class="skeleton h-4 w-36"></div></td>
      <td class="px-4 py-3"><div class="skeleton h-4 w-20"></div></td>
      <td class="px-4 py-3"><div class="skeleton h-4 w-16"></div></td>
      <td class="px-4 py-3"><div class="skeleton h-6 w-20 rounded-full"></div></td>
      <td class="px-4 py-3"><div class="skeleton h-8 w-28"></div></td>
    </tr>
  `).join("");
  tableBody.innerHTML = skeletonRows;
  loadingState.classList.remove("hidden");
}

renderSkeleton();
