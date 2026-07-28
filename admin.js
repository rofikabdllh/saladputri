// ============================================================
// Salad Buah Putri — admin.js (Halaman Admin)
// Firebase SDK v9+ (Modular)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ------------------------------------------------------------
// KONFIGURASI FIREBASE (samakan dengan app.js)
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

// ------------------------------------------------------------
// ELEMEN DOM
// ------------------------------------------------------------
const tableBody = document.getElementById("ordersTableBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const statTotalOrders = document.getElementById("statTotalOrders");
const statTotalRevenue = document.getElementById("statTotalRevenue");
const statLastOrder = document.getElementById("statLastOrder");

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

function formatItems(items) {
  if (!Array.isArray(items)) return "—";
  return items.map((item) => `${item.nama} x${item.qty}`).join(", ");
}

// ------------------------------------------------------------
// LISTENER REAL-TIME
// ------------------------------------------------------------
const ordersQuery = query(collection(db, "pesanan"), orderBy("createdAt", "desc"));

onSnapshot(
  ordersQuery,
  (snapshot) => {
    loadingState.classList.add("hidden");

    if (snapshot.empty) {
      tableBody.innerHTML = "";
      emptyState.classList.remove("hidden");
      updateStats([]);
      return;
    }

    emptyState.classList.add("hidden");

    const orders = snapshot.docs.map((doc) => doc.data());

    tableBody.innerHTML = orders
      .map(
        (order) => `
      <tr class="hover:bg-cream/60 align-top">
        <td class="px-4 py-3 whitespace-nowrap font-mono text-xs text-dark/70">${order.nomorOrder || "—"}</td>
        <td class="px-4 py-3 whitespace-nowrap text-dark/70">${formatTanggal(order.createdAt)}</td>
        <td class="px-4 py-3 font-semibold whitespace-nowrap">${order.nama || "—"}</td>
        <td class="px-4 py-3 whitespace-nowrap">
          <a href="https://wa.me/${(order.whatsapp || "").replace(/\D/g, "")}" target="_blank" class="text-kiwi-dark font-medium hover:underline">
            ${order.whatsapp || "—"}
          </a>
        </td>
        <td class="px-4 py-3 max-w-[220px]">${order.alamat || "—"}</td>
        <td class="px-4 py-3 max-w-[260px] text-dark/70">${formatItems(order.items)}</td>
        <td class="px-4 py-3 max-w-[180px] text-dark/70">${order.catatan && order.catatan !== "-" ? order.catatan : "—"}</td>
        <td class="px-4 py-3 font-semibold text-watermelon-dark whitespace-nowrap">${formatRupiah(order.totalHarga)}</td>
      </tr>
    `
      )
      .join("");

    updateStats(orders);
  },
  (error) => {
    console.error("Gagal memuat pesanan:", error);
    loadingState.textContent = "Gagal memuat data. Periksa koneksi atau aturan Firestore.";
  }
);

// ------------------------------------------------------------
// RINGKASAN STATISTIK
// ------------------------------------------------------------
function updateStats(orders) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalHarga || 0), 0);
  const lastOrder = orders[0];

  statTotalOrders.textContent = totalOrders;
  statTotalRevenue.textContent = formatRupiah(totalRevenue);
  statLastOrder.textContent = lastOrder ? formatTanggal(lastOrder.createdAt) : "—";
}
