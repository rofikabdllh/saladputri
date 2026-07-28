// ============================================================
// Salad Buah Putri — app.js (Halaman Pelanggan)
// Firebase SDK v9+ (Modular)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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

// ------------------------------------------------------------
// DATA TOKO (sesuaikan)
// ------------------------------------------------------------
const WA_NUMBER = "6281915779457";
const REKENING_INFO = "BRI 682401001050507 a.n. Eka Putri Nugraheni";

const STORE_INFO = {
  rating: "4.9",
  totalReviews: "258 ulasan",
  totalOrders: "500+ pesanan",
  jamOperasional: "08.00 – 20.00 WIB",
  estimasiProses: "15–30 menit setelah pembayaran dikonfirmasi",
  lokasi: "📍 Purwokerto, Indonesia",
  mapsUrl: "https://maps.app.goo.gl/pgM2RfDkDbaK4Ucb7?g_st=ac",
};

const SIZES = [
  { id: "200ml", label: "200 ml", harga: 10000 },
  { id: "300ml", label: "300 ml", harga: 12000 },
  { id: "450ml", label: "450 ml", harga: 20000 },
  { id: "500ml", label: "500 ml", harga: 22000, popular: true },
  { id: "650ml", label: "650 ml", harga: 27000 },
  { id: "750ml", label: "750 ml", harga: 32000 },
  { id: "1000ml", label: "1000 ml", harga: 42000 },
];

const TOPPINGS = ["Keju", "Coklat", "Mix (Coklat & Keju)"];

// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------
let selectedSizeId = SIZES[0].id;
let selectedTopping = TOPPINGS[0];
let productQty = 1;
let cart = [];

// ------------------------------------------------------------
// ELEMEN DOM
// ------------------------------------------------------------
const sizeOptions = document.getElementById("sizeOptions");
const toppingOptions = document.getElementById("toppingOptions");
const productQtyValue = document.getElementById("productQtyValue");
const productQtyMinus = document.getElementById("productQtyMinus");
const productQtyPlus = document.getElementById("productQtyPlus");
const addToCartBtn = document.getElementById("addToCartBtn");
const addToCartPrice = document.getElementById("addToCartPrice");
const liveOrderSummary = document.getElementById("liveOrderSummary");
const upsellTip = document.getElementById("upsellTip");
const crossSellTip = document.getElementById("crossSellTip");

const cartBadge = document.getElementById("cartBadge");
const cartItemsWrap = document.getElementById("cartItemsWrap");
const cartEmptyState = document.getElementById("cartEmptyState");
const cartFooter = document.getElementById("cartFooter");
const cartTotalEl = document.getElementById("cartTotal");

const cartOverlay = document.getElementById("cartOverlay");
const cartDrawer = document.getElementById("cartDrawer");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const checkoutBtn = document.getElementById("checkoutBtn");

const checkoutModal = document.getElementById("checkoutModal");
const checkoutOverlay = document.getElementById("checkoutOverlay");
const closeCheckoutBtn = document.getElementById("closeCheckoutBtn");
const checkoutSummary = document.getElementById("checkoutSummary");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutError = document.getElementById("checkoutError");
const submitOrderBtn = document.getElementById("submitOrderBtn");
const submitOrderText = document.getElementById("submitOrderText");
const submitSpinner = document.getElementById("submitSpinner");

const inputNama = document.getElementById("inputNama");
const inputWa = document.getElementById("inputWa");
const inputAlamat = document.getElementById("inputAlamat");
const inputCatatan = document.getElementById("inputCatatan");

const successModal = document.getElementById("successModal");
const successSummary = document.getElementById("successSummary");
const rekeningInfo = document.getElementById("rekeningInfo");
const waButton = document.getElementById("waButton");
const closeSuccessBtn = document.getElementById("closeSuccessBtn");
const orderNumberBadge = document.getElementById("orderNumberBadge");
const orderStatusBadge = document.getElementById("orderStatusBadge");
const successEstimasi = document.getElementById("successEstimasi");
const successJamOperasional = document.getElementById("successJamOperasional");
const successTotalTransfer = document.getElementById("successTotalTransfer");
const copyRekeningBtn = document.getElementById("copyRekeningBtn");
const copyTotalBtn = document.getElementById("copyTotalBtn");

const mobileCartBar = document.getElementById("mobileCartBar");
const mobileCartBarBtn = document.getElementById("mobileCartBarBtn");
const mobileCartCount = document.getElementById("mobileCartCount");
const mobileCartTotal = document.getElementById("mobileCartTotal");

const desktopCartBar = document.getElementById("desktopCartBar");
const desktopCartBarBtn = document.getElementById("desktopCartBarBtn");
const desktopCartCount = document.getElementById("desktopCartCount");
const desktopCartTotal = document.getElementById("desktopCartTotal");

const toastContainer = document.getElementById("toastContainer");

// ------------------------------------------------------------
// HELPER
// ------------------------------------------------------------
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
}

function getSizeById(id) {
  return SIZES.find((s) => s.id === id);
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function generateOrderNumber() {
  const now = new Date();
  const datePart =
    now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  return `SBP-${datePart}-${rand}`;
}

// ------------------------------------------------------------
// TOAST
// ------------------------------------------------------------
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-item";
  toast.textContent = message;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast-show"));
  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Berhasil disalin ke clipboard!");
    const original = btn.textContent;
    btn.textContent = "✓ Tersalin";
    setTimeout(() => {
      btn.textContent = original;
    }, 1500);
  } catch (err) {
    showToast("Gagal menyalin otomatis, salin manual ya.");
  }
}

// ------------------------------------------------------------
// RENDER: PILIHAN PRODUK
// ------------------------------------------------------------
function renderSizeOptions() {
  sizeOptions.innerHTML = SIZES.map(
    (size) => `
    <button type="button" data-id="${size.id}" aria-pressed="${size.id === selectedSizeId}"
      class="size-card text-left px-3 py-2.5 rounded-xl border-2 text-sm ${
        size.id === selectedSizeId
          ? "border-watermelon-dark bg-watermelon/10 font-semibold shadow-sm"
          : "border-dark/10 hover:border-watermelon/50 hover:bg-watermelon/5"
      }">
      ${size.popular ? '<span class="popular-tag bg-mango text-dark text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">POPULER</span>' : ""}
      <span class="block">${size.label}</span>
      <span class="block text-xs text-dark/50">${formatRupiah(size.harga)}</span>
    </button>
  `
  ).join("");

  document.querySelectorAll(".size-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedSizeId = btn.dataset.id;
      renderSizeOptions();
      updateAddToCartPrice();
      renderLiveSummary();
      updateUpsellTip();
    });
  });
}

function renderToppingOptions() {
  toppingOptions.innerHTML = TOPPINGS.map(
    (topping) => `
    <button type="button" data-topping="${topping}" aria-pressed="${topping === selectedTopping}"
      class="topping-btn px-3.5 py-2 rounded-full border-2 text-sm ${
        topping === selectedTopping
          ? "border-kiwi-dark bg-kiwi/10 font-semibold text-kiwi-dark shadow-sm"
          : "border-dark/10 hover:border-kiwi/50 hover:bg-kiwi/5"
      }">
      ${topping}
    </button>
  `
  ).join("");

  document.querySelectorAll(".topping-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedTopping = btn.dataset.topping;
      renderToppingOptions();
      renderLiveSummary();
      updateCrossSellTip();
    });
  });
}

function updateAddToCartPrice() {
  const size = getSizeById(selectedSizeId);
  addToCartPrice.textContent = formatRupiah(size.harga * productQty);
}

function renderLiveSummary() {
  const size = getSizeById(selectedSizeId);
  const subtotal = size.harga * productQty;
  liveOrderSummary.innerHTML = `
    <div class="flex justify-between"><span>Salad</span><span class="font-medium">${size.label}</span></div>
    <div class="flex justify-between"><span>Topping</span><span class="font-medium">${selectedTopping}</span></div>
    <div class="flex justify-between"><span>Jumlah</span><span class="font-medium">${productQty}</span></div>
    <div class="flex justify-between pt-1.5 mt-1 border-t border-dark/10 font-semibold">
      <span>Total</span><span class="text-watermelon-dark">${formatRupiah(subtotal)}</span>
    </div>
  `;
}

function updateUpsellTip() {
  const currentIndex = SIZES.findIndex((s) => s.id === selectedSizeId);
  const next = SIZES[currentIndex + 1];
  if (!next) {
    upsellTip.classList.add("hidden");
    return;
  }
  const current = SIZES[currentIndex];
  const diff = next.harga - current.harga;
  upsellTip.textContent = `💡 Tambah ${formatRupiah(diff)} lagi untuk naik ke ${next.label}, lebih puas!`;
  upsellTip.classList.remove("hidden");
}

function updateCrossSellTip() {
  if (selectedTopping === "Mix (Coklat & Keju)") {
    crossSellTip.classList.add("hidden");
    return;
  }
  crossSellTip.textContent = "🍫🧀 Coba topping Mix — harganya sama, dapat dua rasa sekaligus!";
  crossSellTip.classList.remove("hidden");
}

productQtyMinus.addEventListener("click", () => {
  if (productQty > 1) productQty -= 1;
  productQtyValue.textContent = productQty;
  updateAddToCartPrice();
  renderLiveSummary();
});
productQtyPlus.addEventListener("click", () => {
  productQty += 1;
  productQtyValue.textContent = productQty;
  updateAddToCartPrice();
  renderLiveSummary();
});

addToCartBtn.addEventListener("click", () => {
  const size = getSizeById(selectedSizeId);
  const cartId = `${size.id}-${selectedTopping}`;
  const existing = cart.find((c) => c.id === cartId);

  if (existing) {
    existing.qty += productQty;
  } else {
    cart.push({
      id: cartId,
      ukuran: size.label,
      topping: selectedTopping,
      harga: size.harga,
      qty: productQty,
    });
  }

  showToast(`Ditambahkan: Salad ${size.label} x${productQty} 🎉`);

  productQty = 1;
  productQtyValue.textContent = productQty;
  updateAddToCartPrice();
  renderLiveSummary();
  renderCart();
  openCart();
});

// ------------------------------------------------------------
// CART LOGIC
// ------------------------------------------------------------
function changeQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((c) => c.id !== id);
  }
  renderCart();
}

function renderCart() {
  const count = getCartCount();
  const total = getCartTotal();

  cartBadge.textContent = count;
  cartBadge.classList.toggle("hidden", count === 0);
  cartBadge.classList.toggle("flex", count > 0);
  if (count > 0) {
    cartBadge.classList.remove("animate-badge-pop");
    void cartBadge.offsetWidth;
    cartBadge.classList.add("animate-badge-pop");
  }

  mobileCartCount.textContent = count;
  mobileCartTotal.textContent = formatRupiah(total);
  mobileCartBar.classList.toggle("hidden", count === 0);
  mobileCartBar.classList.toggle("flex", count > 0);

  desktopCartCount.textContent = count;
  desktopCartTotal.textContent = formatRupiah(total);
  desktopCartBar.classList.toggle("lg:flex", count > 0);
  desktopCartBar.classList.toggle("lg:flex-col", count > 0);

  if (cart.length === 0) {
    cartItemsWrap.classList.add("hidden");
    cartFooter.classList.add("hidden");
    cartEmptyState.classList.remove("hidden");
    return;
  }

  cartEmptyState.classList.add("hidden");
  cartItemsWrap.classList.remove("hidden");
  cartFooter.classList.remove("hidden");

  cartItemsWrap.innerHTML = cart
    .map(
      (item) => `
    <div class="flex items-center justify-between gap-3 bg-white rounded-2xl p-3 border border-dark/10 animate-float-in">
      <div class="flex-1">
        <p class="font-semibold text-sm">Salad Buah ${item.ukuran}</p>
        <p class="text-dark/50 text-xs mt-0.5">Topping ${item.topping} · ${formatRupiah(item.harga)}</p>
      </div>
      <div class="flex items-center gap-2">
        <button data-id="${item.id}" data-delta="-1" aria-label="Kurangi" class="qty-btn w-9 h-9 rounded-full border border-dark/20 hover:bg-dark/5 flex items-center justify-center text-base">−</button>
        <span class="w-5 text-center text-sm font-semibold">${item.qty}</span>
        <button data-id="${item.id}" data-delta="1" aria-label="Tambah" class="qty-btn w-9 h-9 rounded-full border border-dark/20 hover:bg-dark/5 flex items-center justify-center text-base">+</button>
      </div>
    </div>
  `
    )
    .join("");

  document.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      changeQty(btn.dataset.id, parseInt(btn.dataset.delta, 10))
    );
  });

  cartTotalEl.textContent = formatRupiah(total);
}

function itemLabel(item) {
  return `Salad Buah ${item.ukuran} (Topping ${item.topping})`;
}

function renderOrderSummaryHTML() {
  const rows = cart
    .map(
      (item) => `
    <div class="flex justify-between">
      <span>${itemLabel(item)} x${item.qty}</span>
      <span class="font-medium">${formatRupiah(item.harga * item.qty)}</span>
    </div>
  `
    )
    .join("");

  return `
    ${rows}
    <div class="border-t border-dark/10 mt-2 pt-2 flex justify-between font-semibold">
      <span>Total</span>
      <span class="text-watermelon-dark">${formatRupiah(getCartTotal())}</span>
    </div>
  `;
}

// ------------------------------------------------------------
// DRAWER & MODAL CONTROLS
// ------------------------------------------------------------
function openCart() {
  cartOverlay.classList.remove("opacity-0", "pointer-events-none");
  cartDrawer.classList.remove("drawer-hidden");
}
function closeCart() {
  cartOverlay.classList.add("opacity-0", "pointer-events-none");
  cartDrawer.classList.add("drawer-hidden");
}

function openCheckout() {
  if (cart.length === 0) return;
  checkoutSummary.innerHTML = renderOrderSummaryHTML();
  clearFieldErrors();
  checkoutModal.classList.remove("modal-hidden");
  closeCart();
}
function closeCheckout() {
  checkoutModal.classList.add("modal-hidden");
}

function openSuccess() {
  successModal.classList.remove("modal-hidden");
}
function closeSuccess() {
  successModal.classList.add("modal-hidden");
}

openCartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
mobileCartBarBtn.addEventListener("click", openCart);
desktopCartBarBtn.addEventListener("click", openCart);
checkoutBtn.addEventListener("click", openCheckout);
closeCheckoutBtn.addEventListener("click", closeCheckout);
checkoutOverlay.addEventListener("click", closeCheckout);
closeSuccessBtn.addEventListener("click", () => {
  closeSuccess();
  cart = [];
  renderCart();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!successModal.classList.contains("modal-hidden")) return;
  if (!checkoutModal.classList.contains("modal-hidden")) {
    closeCheckout();
  } else if (!cartDrawer.classList.contains("drawer-hidden")) {
    closeCart();
  }
});

// ------------------------------------------------------------
// VALIDASI FORM
// ------------------------------------------------------------
function setFieldError(input, message) {
  const errorEl = input.parentElement.querySelector(".field-error");
  input.classList.add("border-watermelon-dark", "ring-2", "ring-watermelon/40");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }
}

function clearFieldError(input) {
  const errorEl = input.parentElement.querySelector(".field-error");
  input.classList.remove("border-watermelon-dark", "ring-2", "ring-watermelon/40");
  if (errorEl) {
    errorEl.classList.add("hidden");
  }
}

function clearFieldErrors() {
  [inputNama, inputWa, inputAlamat].forEach(clearFieldError);
  checkoutError.classList.add("hidden");
}

function validateForm() {
  let valid = true;
  clearFieldErrors();

  const nama = inputNama.value.trim();
  const wa = inputWa.value.trim();
  const alamat = inputAlamat.value.trim();

  if (nama.length < 3) {
    setFieldError(inputNama, "Nama minimal 3 karakter.");
    valid = false;
  }

  const waDigits = wa.replace(/\D/g, "");
  if (!/^(0|62)8\d{7,11}$/.test(waDigits)) {
    setFieldError(inputWa, "Format nomor WA tidak valid (contoh: 081234567890).");
    valid = false;
  }

  if (alamat.length < 10) {
    setFieldError(inputAlamat, "Mohon isi alamat lengkap (minimal 10 karakter).");
    valid = false;
  }

  return valid;
}

[inputNama, inputWa, inputAlamat].forEach((input) => {
  input.addEventListener("input", () => clearFieldError(input));
});

// ------------------------------------------------------------
// SUBMIT PESANAN -> FIRESTORE
// ------------------------------------------------------------
checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  checkoutError.classList.add("hidden");

  if (cart.length === 0) {
    checkoutError.textContent = "Keranjang kamu kosong.";
    checkoutError.classList.remove("hidden");
    return;
  }

  if (!validateForm()) return;

  const nama = inputNama.value.trim();
  const wa = inputWa.value.trim();
  const alamat = inputAlamat.value.trim();
  const catatan = inputCatatan.value.trim();

  const items = cart.map((item) => ({
    nama: itemLabel(item),
    ukuran: item.ukuran,
    topping: item.topping,
    harga: item.harga,
    qty: item.qty,
    subtotal: item.harga * item.qty,
  }));
  const totalHarga = getCartTotal();
  const nomorOrder = generateOrderNumber();

  submitOrderBtn.disabled = true;
  submitSpinner.classList.remove("hidden");
  submitOrderText.textContent = "Menyimpan pesanan...";

  try {
    await addDoc(collection(db, "pesanan"), {
      nomorOrder,
      nama,
      whatsapp: wa,
      alamat,
      catatan: catatan || "-",
      items,
      totalHarga,
      status: "Menunggu Pembayaran",
      createdAt: serverTimestamp(),
    });

    const orderSummary = { nomorOrder, nama, wa, alamat, catatan, items, totalHarga };
    showSuccess(orderSummary);
    checkoutForm.reset();
    closeCheckout();
  } catch (err) {
    console.error("Gagal menyimpan pesanan:", err);
    checkoutError.textContent =
      "Terjadi kesalahan saat menyimpan pesanan. Silakan coba lagi.";
    checkoutError.classList.remove("hidden");
  } finally {
    submitOrderBtn.disabled = false;
    submitSpinner.classList.add("hidden");
    submitOrderText.textContent = "Buat Pesanan";
  }
});

// ------------------------------------------------------------
// SUKSES: RINGKASAN + TOMBOL WHATSAPP
// ------------------------------------------------------------
function showSuccess(order) {
  orderNumberBadge.textContent = `#${order.nomorOrder}`;
  successEstimasi.textContent = STORE_INFO.estimasiProses;
  successJamOperasional.textContent = STORE_INFO.jamOperasional;
  successTotalTransfer.textContent = formatRupiah(order.totalHarga);

  const rows = order.items
    .map(
      (item) => `
    <div class="flex justify-between">
      <span>${item.nama} x${item.qty}</span>
      <span class="font-medium">${formatRupiah(item.subtotal)}</span>
    </div>
  `
    )
    .join("");

  successSummary.innerHTML = `
    <div class="space-y-0.5 mb-2 text-dark/70">
      <p><span class="font-semibold text-dark">Nama:</span> ${order.nama}</p>
      <p><span class="font-semibold text-dark">WA:</span> ${order.wa}</p>
      <p><span class="font-semibold text-dark">Alamat:</span> ${order.alamat}</p>
      ${order.catatan ? `<p><span class="font-semibold text-dark">Catatan:</span> ${order.catatan}</p>` : ""}
    </div>
    <div class="border-t border-dark/10 pt-2 space-y-1">
      ${rows}
    </div>
    <div class="border-t border-dark/10 mt-2 pt-2 flex justify-between font-semibold">
      <span>Total</span>
      <span class="text-watermelon-dark">${formatRupiah(order.totalHarga)}</span>
    </div>
  `;

  rekeningInfo.textContent = REKENING_INFO;

  const itemLines = order.items
    .map((item) => `- ${item.nama} x${item.qty} = ${formatRupiah(item.subtotal)}`)
    .join("\n");

  const waText = [
    `Halo Salad Buah Putri! 👋`,
    `Saya ingin konfirmasi pesanan #${order.nomorOrder} atas nama *${order.nama}*.`,
    ``,
    `*Rincian Pesanan:*`,
    itemLines,
    ``,
    `*Total: ${formatRupiah(order.totalHarga)}*`,
    ``,
    `*Alamat:* ${order.alamat}`,
    order.catatan ? `*Catatan:* ${order.catatan}` : ``,
    ``,
    `Berikut saya lampirkan bukti transfernya 🙏`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  waButton.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`;

  openSuccess();
}

copyRekeningBtn.addEventListener("click", () => copyToClipboard(REKENING_INFO, copyRekeningBtn));
copyTotalBtn.addEventListener("click", () =>
  copyToClipboard(successTotalTransfer.textContent.replace(/[^\d]/g, ""), copyTotalBtn)
);

// ------------------------------------------------------------
// INIT
// ------------------------------------------------------------
document.getElementById("ratingValue").textContent = STORE_INFO.rating;
document.getElementById("reviewCountText").textContent = STORE_INFO.totalReviews;
document.getElementById("orderCountText").textContent = STORE_INFO.totalOrders;
document.getElementById("footerHours").textContent = `🕒 Jam Operasional: ${STORE_INFO.jamOperasional}`;
document.getElementById("footerLocation").textContent = STORE_INFO.lokasi;
document.getElementById("footerMapsLink").href = STORE_INFO.mapsUrl;
document.getElementById("footerYear").textContent = new Date().getFullYear();

renderSizeOptions();
renderToppingOptions();
updateAddToCartPrice();
renderLiveSummary();
updateUpsellTip();
updateCrossSellTip();
renderCart();
