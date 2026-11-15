if (typeof tailwind !== 'undefined') tailwind.config = {
    theme: {
        extend: {
            colors: {
                sti: {
                    blue: '#003366',
                    darkblue: '#002244',
                    yellow: '#FFC72C',
                    gold: '#E5B200',
                    lightbg: '#F4F6FB'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        }
    }
};

// ==========================================
// STUDENT SESSION (set by login.html)
// ==========================================
function getStudentSession() {
    try {
        const saved = localStorage.getItem('sti_student_session')
            || sessionStorage.getItem('sti_student_session');
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error('Unable to read student session:', error);
        return null;
    }
}

const currentStudent = getStudentSession();

// Not signed in → send to the login page
if (!currentStudent) {
    window.location.replace('index.html');
}

function logoutStudent() {
    localStorage.removeItem('sti_student_session');
    sessionStorage.removeItem('sti_student_session');
    window.location.href = 'index.html';
}   

// ==========================================
// DARK MODE (the STI logo in the header is the toggle)
// ==========================================
const THEME_KEY = 'sti_theme';

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-pressed', String(isDark));

    const icon = btn.querySelector('i');
    if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
    applyTheme(saved === 'dark' ? 'dark' : 'light');
}

function toggleTheme() {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

    // Short transition + a little "pop" on the logo button
    root.classList.add('theme-transition');
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.classList.remove('is-switching');
        void btn.offsetWidth; // restart the animation
        btn.classList.add('is-switching');
    }
    setTimeout(() => {
        root.classList.remove('theme-transition');
        if (btn) btn.classList.remove('is-switching');
    }, 400);

    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
}

// ==========================================
// APPLICATION DATA STORES & STATE
// ==========================================

let menuItems = [
    { id: 101, name: "STI Special Chicken Meal", category: "Meals", price: 95.00, inStock: true, image: "https://placehold.co/200x150/003366/FFFFFF?text=Chicken+Meal" },
    { id: 102, name: "Pork Siomai Rice (4 pcs)", category: "Meals", price: 65.00, inStock: true, image: "https://placehold.co/200x150/003366/FFFFFF?text=Siomai+Rice" },
    { id: 103, name: "Sizzling Pork Sisig Rice", category: "Meals", price: 105.00, inStock: true, image: "https://placehold.co/200x150/003366/FFFFFF?text=Sisig+Rice" },
    { id: 104, name: "Cheesy Beef Burger", category: "Snacks", price: 55.00, inStock: true, image: "https://placehold.co/200x150/003366/FFFFFF?text=Beef+Burger" },
    { id: 105, name: "Clubhouse Sandwich & Fries", category: "Snacks", price: 75.00, inStock: true, image: "https://placehold.co/200x150/003366/FFFFFF?text=Clubhouse" },
    { id: 106, name: "Iced Caramel Macchiato (16oz)", category: "Drinks", price: 50.00, inStock: true, image: "https://placehold.co/200x150/003366/FFFFFF?text=Iced+Coffee" },
    { id: 107, name: "Fresh Mango Shake", category: "Drinks", price: 45.00, inStock: true, image: "https://placehold.co/200x150/003366/FFFFFF?text=Mango+Shake" },
    { id: 108, name: "Mango Graham Float Cup", category: "Desserts", price: 40.00, inStock: true, image: "https://placehold.co/200x150/003366/FFFFFF?text=Mango+Graham" }
];

let currentCart = [];
let selectedPayment = 'GCash';
let uploadedScreenshotUrl = null;
let activeCanteenOrder = null;
let orderCounter = 9903;

// Master Canteen Orders Database
let canteenOrders = [
    {
        orderId: "ORD-9901",
        tokenNo: "A-040",
        studentName: "Maria Santos",
        studentId: "0200021104",
        items: [
            { name: "STI Special Chicken Meal", qty: 1, price: 95.00 },
            { name: "Iced Caramel Macchiato (16oz)", qty: 1, price: 50.00 }
        ],
        totalAmount: 145.00,
        timeSlot: "12:00 PM - 12:15 PM",
        paymentMethod: "GCash",
        refNo: "GC-1029384",
        proofUrl: "https://placehold.co/300x400/e2e8f0/003366?text=GCash+Proof+Screenshot",
        status: "PREPARING", // PENDING_VERIFICATION, PREPARING, READY, COMPLETED
        notes: "Extra gravy please",
        timestamp: "11:45 AM"
    },
    {
        orderId: "ORD-9902",
        tokenNo: "A-041",
        studentName: "Mark Anthony Reyes",
        studentId: "0200029988",
        items: [
            { name: "Pork Siomai Rice (4 pcs)", qty: 2, price: 65.00 }
        ],
        totalAmount: 130.00,
        timeSlot: "12:00 PM - 12:15 PM",
        paymentMethod: "Cash on Pickup",
        refNo: "N/A (Cash)",
        proofUrl: null,
        status: "READY",
        notes: "",
        timestamp: "11:50 AM"
    }
];

// ==========================================
// INITIALIZATION & TAB SWITCHING
// ==========================================
window.onload = function () {
    initTheme();
    renderStudentMenu();
    renderCart();
    renderOrderHistory();
    renderKitchenKDS();
    renderAdminInventory();
    updateAdminStats();
    if (currentStudent) {
        document.getElementById('student-name').textContent = currentStudent.studentName;
        document.getElementById('student-id').textContent = currentStudent.studentId;
    }
};
function switchView(view) {
    ['student', 'mobile', 'kitchen'].forEach(v => {
        document.getElementById(`view-${v}`).classList.add('hidden');
        document.getElementById(`nav-${v}`).className = "px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 text-blue-100 hover:text-white transition-all duration-200 whitespace-nowrap";
    });
    document.getElementById(`view-${view}`).classList.remove('hidden');
    document.getElementById(`nav-${view}`).className = "px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all duration-200 bg-sti-yellow text-sti-blue font-bold shadow-sm whitespace-nowrap";

    if (view === 'mobile') {
        document.getElementById('nav-queue-dot')?.classList.add('hidden');
        renderMobileTicket();
    }
}

function switchAdminSubTab(tab) {
    if (tab === 'kds') {
        document.getElementById('kds-subtab-container').classList.remove('hidden');
        document.getElementById('stock-subtab-container').classList.add('hidden');
        document.getElementById('admin-tab-kds').className = "px-4 py-2 rounded-xl text-xs font-bold bg-sti-blue text-white shadow-sm flex items-center space-x-2";
        document.getElementById('admin-tab-stock').className = "px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center space-x-2";
    } else {
        document.getElementById('kds-subtab-container').classList.add('hidden');
        document.getElementById('stock-subtab-container').classList.remove('hidden');
        document.getElementById('admin-tab-stock').className = "px-4 py-2 rounded-xl text-xs font-bold bg-sti-blue text-white shadow-sm flex items-center space-x-2";
        document.getElementById('admin-tab-kds').className = "px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center space-x-2";
    }
}

// ==========================================
// STUDENT CANTEEN PRE-ORDERING
// ==========================================

function filterCategory(cat) {
    document.querySelectorAll('.cat-btn').forEach(b => b.className = "cat-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 whitespace-nowrap");
    const activeBtn = document.getElementById(`cat-${cat}`);
    if (activeBtn) activeBtn.className = "cat-btn px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-sti-blue text-white shadow-sm";
    renderStudentMenu(cat);
}

function renderStudentMenu(categoryFilter = 'all') {
    const grid = document.getElementById('student-menu-grid');
    const searchVal = document.getElementById('menu-search')?.value.toLowerCase() || '';
    grid.innerHTML = '';

    const filtered = menuItems.filter(i => (categoryFilter === 'all' || i.category === categoryFilter) && i.name.toLowerCase().includes(searchVal));

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = "menu-card bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between transition hover:shadow-md";
        card.innerHTML = `
            <div class="relative">
                <img src="${item.image}" class="w-full h-32 object-cover">
                ${!item.inStock ? `<span class="absolute top-2 right-2 bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">SOLD OUT</span>` : ''}
            </div>
            <div class="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${item.category}</span>
                    <h4 class="font-bold text-slate-800 text-xs">${item.name}</h4>
                </div>
                <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <span class="font-extrabold text-sti-blue text-base">₱${item.price.toFixed(2)}</span>
                    <button onclick="addToCart(${item.id})" ${!item.inStock ? 'disabled' : ''} class="bg-sti-blue text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-blue-900 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1">
                        <i class="fa-solid fa-plus text-[10px]"></i>
                        <span>Add</span>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function addToCart(id) {
    const item = menuItems.find(m => m.id === id);
    if (!item || !item.inStock) return;

    const exist = currentCart.find(c => c.id === id);
    if (exist) {
        exist.qty++;
    } else {
        currentCart.push({ ...item, qty: 1 });
    }
    renderCart();
    showToast(`Added ${item.name} to canteen tray`, 'info');
}

function updateCartQty(id, delta) {
    const item = currentCart.find(c => c.id === id);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        currentCart = currentCart.filter(c => c.id !== id);
    }
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-price');
    const badge = document.getElementById('cart-count-badge');
    const checkoutBtn = document.getElementById('btn-canteen-checkout');

    container.innerHTML = '';
    let total = 0;
    let qty = 0;

    if (currentCart.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-400 text-xs py-6"><i class="fa-solid fa-basket-shopping text-2xl mb-1 text-slate-300"></i><p>Your canteen tray is empty.</p></div>`;
        checkoutBtn.disabled = true;
    } else {
        currentCart.forEach(i => {
            const itemTotal = i.price * i.qty;
            total += itemTotal;
            qty += i.qty;

            const row = document.createElement('div');
            row.className = "flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100";
            row.innerHTML = `
                <div class="flex-1 pr-2">
                    <p class="font-bold text-slate-800 leading-tight">${i.name}</p>
                    <p class="text-slate-400 text-[11px]">₱${i.price.toFixed(2)} each</p>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="flex items-center bg-white border rounded-lg">
                        <button onclick="updateCartQty(${i.id}, -1)" class="cart-qty-btn px-2 py-0.5 text-slate-600 font-bold hover:bg-slate-100 rounded-l">-</button>
                        <span class="px-2 font-bold text-xs">${i.qty}</span>
                        <button onclick="updateCartQty(${i.id}, 1)" class="cart-qty-btn px-2 py-0.5 text-slate-600 font-bold hover:bg-slate-100 rounded-r">+</button>
                    </div>
                    <span class="font-extrabold text-sti-blue w-14 text-right">₱${itemTotal.toFixed(2)}</span>
                </div>
            `;
            container.appendChild(row);
        });
        checkoutBtn.disabled = false;
    }

    totalEl.innerText = `₱${total.toFixed(2)}`;
    badge.innerText = `${qty} items`;

    // Mobile floating tray bar
    const mobileBar = document.getElementById('mobile-cart-bar');
    if (mobileBar) {
        mobileBar.classList.toggle('hidden', currentCart.length === 0);
        document.getElementById('mobile-cart-count').innerText = `${qty} ${qty === 1 ? 'item' : 'items'}`;
        document.getElementById('mobile-cart-total').innerText = `₱${total.toFixed(2)}`;
    }
}

function scrollToCart() {
    document.getElementById('cart-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getCartTotal() {
    return currentCart.reduce((s, i) => s + (i.price * i.qty), 0);
}

// ==========================================
// CHECKOUT & ONLINE PAYMENT
// ==========================================

function openCheckoutModal() {
    if (currentCart.length === 0) return;

    const total = getCartTotal();
    const shift = document.getElementById('cart-time-slot').value;

    document.getElementById('modal-item-count').innerText = currentCart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('modal-shift-text').innerText = shift;
    document.getElementById('modal-amount-text').innerText = `₱${total.toFixed(2)}`;

    selectPaymentMethod('GCash');
    document.getElementById('checkout-modal').classList.remove('hidden');
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.add('hidden');
    uploadedScreenshotUrl = null;

    // Reset the proof-of-payment upload
    const fileInput = document.getElementById('canteen-proof-file');
    const fileNote = document.getElementById('proof-file-note');
    if (fileInput) fileInput.value = '';
    if (fileNote) {
        fileNote.textContent = '';
        fileNote.classList.add('hidden');
    }
    document.getElementById('screenshot-preview-container')?.classList.add('hidden');
}

function selectPaymentMethod(method) {
    selectedPayment = method;
    document.querySelectorAll('.pay-method-btn').forEach(btn => {
        btn.className = "pay-method-btn border border-slate-200 p-2 rounded-xl text-center flex flex-col items-center justify-center space-y-1";
    });

    const activeBtn = document.getElementById(`paymethod-${method}`);
    if (activeBtn) activeBtn.className = "pay-method-btn border-2 border-sti-blue bg-blue-50/60 p-2 rounded-xl text-center flex flex-col items-center justify-center space-y-1";

    const onlineBox = document.getElementById('online-payment-details-box');
    const cashBox = document.getElementById('cash-pickup-info-box');

    if (method === 'Cash on Pickup') {
        onlineBox.classList.add('hidden');
        cashBox.classList.remove('hidden');
    } else {
        cashBox.classList.add('hidden');
        onlineBox.classList.remove('hidden');
        document.getElementById('selected-payment-title').innerText = `${method} Express Transfer`;
        document.getElementById('selected-payment-acc').innerText = method === 'GCash' ? '0917-888-9900' : '0012-9988-3344';
    }
}

function simulatePaymentAppLaunch() {
    showToast(`Opening ${selectedPayment} App... (Deep Link Simulator)`, 'info');
}

function copyAccountNo() {
    const acc = document.getElementById('selected-payment-acc').innerText;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(acc);
    }
    showToast(`Copied ${acc} to clipboard!`, 'info');
}

// Called by the proof-of-payment file input in Mainpage.html
function showProofName() {
    const fileInput = document.getElementById('canteen-proof-file');
    const fileNote = document.getElementById('proof-file-note');
    const file = fileInput && fileInput.files[0];

    if (!file) {
        uploadedScreenshotUrl = null;
        if (fileNote) fileNote.classList.add('hidden');
        return;
    }

    if (fileNote) {
        fileNote.textContent = `Attached: ${file.name}`;
        fileNote.classList.remove('hidden');
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        uploadedScreenshotUrl = e.target.result;
    };
    reader.readAsDataURL(file);
}

function submitCanteenOrder() {
    const total = getCartTotal();
    const shift = document.getElementById('cart-time-slot').value;
    const notesInput = document.getElementById('cart-notes');
    const refInput = document.getElementById('canteen-ref-no');

    const notes = notesInput ? notesInput.value : '';
    const refNo = (refInput && refInput.value) ? refInput.value : `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const tokenNumber = `A-${String(40 + canteenOrders.length).padStart(3, '0')}`;
    const orderIdNumber = `ORD-${orderCounter++}`;

    const newOrder = {
        orderId: orderIdNumber,
        tokenNo: tokenNumber,
        studentName: currentStudent.studentName,
        studentId: currentStudent.studentId,
        items: JSON.parse(JSON.stringify(currentCart)),
        totalAmount: total,
        timeSlot: shift,
        paymentMethod: selectedPayment,
        refNo: selectedPayment === 'Cash on Pickup' ? 'Cash Counter' : refNo,
        proofUrl: uploadedScreenshotUrl || (selectedPayment !== 'Cash on Pickup' ? "https://placehold.co/300x400/003366/FFFFFF?text=Proof+Screenshot" : null),
        status: selectedPayment === 'Cash on Pickup' ? 'PREPARING' : 'PENDING_VERIFICATION',
        notes: notes,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    canteenOrders.unshift(newOrder);
    activeCanteenOrder = newOrder;

    // Clear Cart & Form Inputs
    currentCart = [];
    if (notesInput) notesInput.value = '';
    if (refInput) refInput.value = '';
    renderCart();
    closeCheckoutModal();

    // UI Feedback & Updates
    showToast(`Pre-Order Placed! Token ${tokenNumber}`, 'success');
    renderActiveRibbon();
    renderOrderHistory();
    renderKitchenKDS();
    updateAdminStats();

    // Show mobile badge notification dot
    document.getElementById('nav-queue-dot')?.classList.remove('hidden');
}

function renderActiveRibbon() {
    const ribbon = document.getElementById('active-order-ribbon');
    if (!ribbon) return;

    if (!activeCanteenOrder || activeCanteenOrder.status === 'COMPLETED') {
        ribbon.classList.add('hidden');
        return;
    }

    ribbon.classList.remove('hidden');
    document.getElementById('ribbon-token-no').innerText = `#${activeCanteenOrder.tokenNo}`;
    const timeParts = activeCanteenOrder.timeSlot.split(' ');
    document.getElementById('ribbon-time').innerText = `${timeParts[0]} ${timeParts[1] || ''}`.trim();

    const badge = document.getElementById('ribbon-status-badge');
    if (activeCanteenOrder.status === 'PENDING_VERIFICATION') {
        badge.innerText = "Payment Review";
        badge.className = "bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase";
    } else if (activeCanteenOrder.status === 'PREPARING') {
        badge.innerText = "Preparing Meal";
        badge.className = "bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase";
    } else if (activeCanteenOrder.status === 'READY') {
        badge.innerText = "Ready For Pickup";
        badge.className = "bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase animate-pulse";
    }
}

function renderOrderHistory() {
    const container = document.getElementById('student-orders-history');
    container.innerHTML = '';

    canteenOrders.forEach(ord => {
        const item = document.createElement('div');
        item.className = "flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs gap-2";

        let badgeClass = "bg-amber-100 text-amber-800";
        if (ord.status === 'PREPARING') badgeClass = "bg-blue-100 text-blue-800";
        if (ord.status === 'READY') badgeClass = "bg-emerald-100 text-emerald-800 font-bold";
        if (ord.status === 'COMPLETED') badgeClass = "bg-slate-200 text-slate-700";

        const itemsSummary = ord.items.map(i => `${i.qty}x ${i.name}`).join(', ');

        item.innerHTML = `
            <div class="space-y-0.5">
                <div class="flex items-center space-x-2">
                    <span class="font-black text-sti-blue">${ord.tokenNo}</span>
                    <span class="text-slate-700 font-bold">${ord.orderId}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full ${badgeClass}">${ord.status.replace('_', ' ')}</span>
                </div>
                <p class="text-[11px] text-slate-600">${itemsSummary}</p>
                <p class="text-[10px] text-slate-400">Shift: ${ord.timeSlot} • Pay via ${ord.paymentMethod} • ${ord.timestamp}</p>
            </div>
            <div class="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-1 sm:pt-0">
                <span class="font-extrabold text-sti-blue text-sm">₱${ord.totalAmount.toFixed(2)}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

// ==========================================
// MOBILE QUEUE TICKET MODULE
// ==========================================

function renderMobileTicket() {
    const container = document.getElementById('mobile-ticket-content');

    if (!activeCanteenOrder || activeCanteenOrder.status === 'COMPLETED') {
        container.innerHTML = `
            <div class="ticket-card ticket-empty">
                <div class="ticket-empty-icon"><i class="fa-solid fa-ticket"></i></div>
                <h3>No Active Pickup Token</h3>
                <p>Place a canteen meal order in the portal to track your live queue position here.</p>
                <button class="ticket-btn" onclick="switchView('student')">
                    <i class="fa-solid fa-utensils"></i>
                    <span>Browse Food Menu</span>
                </button>
            </div>
        `;
        return;
    }

    const order = activeCanteenOrder;

    const itemsList = order.items.map(i =>
        `<li><span>${i.qty}x ${i.name}</span><span>₱${(i.price * i.qty).toFixed(2)}</span></li>`
    ).join('');

    const ordersAhead = canteenOrders.filter(o =>
        o.orderId !== order.orderId &&
        (o.status === 'PREPARING' || o.status === 'PENDING_VERIFICATION')
    ).length;

    const estWait = order.status === 'READY' ? 'Ready Now' : `~ ${Math.max(3, (ordersAhead + 1) * 4)} mins`;

    let statusText = 'Preparing in Kitchen';
    let statusClass = 'is-preparing';
    if (order.status === 'PENDING_VERIFICATION') {
        statusText = 'Verifying Payment Proof';
        statusClass = 'is-pending';
    }
    if (order.status === 'READY') {
        statusText = 'Ready for Pickup at Counter 1';
        statusClass = 'is-ready';
    }

    container.innerHTML = `
        <div class="ticket-layout">

            <div class="ticket-col">
                <div class="ticket-token">
                    <p class="ticket-token-label">STI SJDM Pickup Token</p>
                    <h2 class="ticket-token-no">#${order.tokenNo}</h2>
                    <p class="ticket-status ${statusClass}">${statusText}</p>
                </div>

                <div class="ticket-card ticket-metrics">
                    <div>
                        <p class="ticket-metric-label">Orders Ahead</p>
                        <p class="ticket-metric-value">${ordersAhead} ${ordersAhead === 1 ? 'Order' : 'Orders'}</p>
                    </div>
                    <div>
                        <p class="ticket-metric-label">Est. Wait</p>
                        <p class="ticket-metric-value">${estWait}</p>
                    </div>
                </div>

                <div class="ticket-card">
                    <h3 class="ticket-card-title">Order Items</h3>
                    <ul class="ticket-items">${itemsList}</ul>
                    <div class="ticket-total">
                        <span>Total Paid:</span>
                        <span>₱${order.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div class="ticket-col">
                <div class="ticket-card ticket-qr">
                    <h3 class="ticket-card-title">Counter 1 Claim Pass</h3>
                    <div class="ticket-qr-box">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-label="Claim pass QR code">
                            <path d="M2,2H10V10H2V2M4,4V8H8V4H4M14,2H22V10H14V2M16,4V8H20V4H16M2,14H10V22H2V14M4,16V20H8V16H4M11,14H13V16H11V14M14,14H16V16H14V14M18,14H20V16H18V14"/>
                        </svg>
                    </div>
                    <p class="ticket-order-id">${order.orderId}</p>
                </div>

                <div class="ticket-card">
                    <h3 class="ticket-card-title">Pickup Details</h3>
                    <ul class="ticket-items">
                        <li><span>Pickup slot</span><span>${order.timeSlot}</span></li>
                        <li><span>Payment</span><span>${order.paymentMethod}</span></li>
                        <li><span>Placed at</span><span>${order.timestamp}</span></li>
                    </ul>
                </div>
            </div>

        </div>
    `;
}

// ==========================================
// CANTEEN KITCHEN DISPLAY & ADMIN (KDS)
// ==========================================

function renderKitchenKDS() {
    const container = document.getElementById('kds-orders-container');
    container.innerHTML = '';

    if (canteenOrders.length === 0) {
        container.innerHTML = `<div class="col-span-full p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border">No incoming canteen orders yet.</div>`;
        return;
    }

    canteenOrders.forEach(ord => {
        const card = document.createElement('div');
        card.className = "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs flex flex-col justify-between";

        let statusBadge = "bg-amber-100 text-amber-800";
        if (ord.status === 'PREPARING') statusBadge = "bg-blue-100 text-blue-800";
        if (ord.status === 'READY') statusBadge = "bg-emerald-100 text-emerald-800 font-bold";
        if (ord.status === 'COMPLETED') statusBadge = "bg-slate-100 text-slate-600";

        const itemsFormatted = ord.items.map(i => `<div class="flex justify-between font-semibold"><span>${i.qty}x ${i.name}</span><span>₱${(i.price * i.qty).toFixed(2)}</span></div>`).join('');

        card.innerHTML = `
            <div class="space-y-2">
                <div class="flex justify-between items-center border-b pb-2">
                    <div>
                        <span class="font-black text-sti-blue text-base">#${ord.tokenNo}</span>
                        <span class="text-[10px] text-slate-400 ml-1 font-mono">${ord.orderId}</span>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusBadge}">${ord.status.replace('_', ' ')}</span>
                </div>

                <div class="text-slate-700 space-y-0.5">
                    <p class="font-bold">${ord.studentName} <span class="text-slate-400 font-normal">(${ord.studentId})</span></p>
                    <p class="text-[11px] text-slate-500">Slot: <strong>${ord.timeSlot}</strong> | Pay: <strong>${ord.paymentMethod}</strong></p>
                    ${ord.notes ? `<p class="text-[10px] text-amber-700 italic bg-amber-50 p-1 rounded">Note: ${ord.notes}</p>` : ''}
                </div>

                <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    ${itemsFormatted}
                    <div class="border-t pt-1 flex justify-between font-black text-sti-blue text-xs">
                        <span>Total:</span>
                        <span>₱${ord.totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                ${ord.proofUrl ? `
                    <button onclick="window.open('${ord.proofUrl}')" class="text-[10px] text-sti-blue font-bold underline flex items-center space-x-1">
                        <i class="fa-solid fa-image"></i>
                        <span>View Payment Screenshot Proof</span>
                    </button>
                ` : ''}
            </div>

            <div class="pt-2 border-t space-y-1.5">
                ${ord.status === 'PENDING_VERIFICATION' ? `
                    <button onclick="updateOrderStatus('${ord.orderId}', 'PREPARING')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1">
                        <i class="fa-solid fa-check-double"></i>
                        <span>Verify Payment & Start Prep</span>
                    </button>
                ` : ''}

                ${ord.status === 'PREPARING' ? `
                    <button onclick="updateOrderStatus('${ord.orderId}', 'READY')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1">
                        <i class="fa-solid fa-bell"></i>
                        <span>Mark Ready for Pickup</span>
                    </button>
                ` : ''}

                ${ord.status === 'READY' ? `
                    <button onclick="updateOrderStatus('${ord.orderId}', 'COMPLETED')" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1">
                        <i class="fa-solid fa-box-archive"></i>
                        <span>Complete & Handover</span>
                    </button>
                ` : ''}

                ${ord.status === 'COMPLETED' ? `
                    <p class="text-center text-[10px] text-slate-400 font-semibold py-1">Order Fulfilled & Closed</p>
                ` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

function updateOrderStatus(orderId, newStatus) {
    const ord = canteenOrders.find(o => o.orderId === orderId);
    if (!ord) return;

    ord.status = newStatus;
    showToast(`Order ${ord.tokenNo} updated to ${newStatus.replace('_', ' ')}`, 'success');

    renderKitchenKDS();
    renderOrderHistory();
    renderActiveRibbon();
    updateAdminStats();

    if (activeCanteenOrder && activeCanteenOrder.orderId === orderId) {
        if (newStatus === 'COMPLETED') {
            activeCanteenOrder = null;
        }
        renderMobileTicket();
    }
}

function renderAdminInventory() {
    const container = document.getElementById('admin-inventory-list');
    container.innerHTML = '';

    menuItems.forEach(item => {
        const card = document.createElement('div');
        card.className = "flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs";
        card.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="${item.image}" class="w-10 h-10 object-cover rounded-lg">
                <div>
                    <p class="font-bold text-slate-800">${item.name}</p>
                    <p class="text-[10px] text-slate-400">₱${item.price.toFixed(2)} • ${item.category}</p>
                </div>
            </div>
            <button onclick="toggleStock(${item.id})" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${item.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                ${item.inStock ? 'In Stock' : 'Sold Out'}
            </button>
        `;
        container.appendChild(card);
    });
}

function toggleStock(id) {
    const item = menuItems.find(m => m.id === id);
    if (item) {
        item.inStock = !item.inStock;
        renderAdminInventory();
        renderStudentMenu();
        showToast(`${item.name} status updated`, 'info');
    }
}

function updateAdminStats() {
    const pending = canteenOrders.filter(o => o.status === 'PENDING_VERIFICATION').length;
    const prep = canteenOrders.filter(o => o.status === 'PREPARING').length;
    const ready = canteenOrders.filter(o => o.status === 'READY').length;
    const revenue = canteenOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    document.getElementById('stat-pending-count').innerText = pending;
    document.getElementById('stat-prep-count').innerText = prep;
    document.getElementById('stat-ready-count').innerText = ready;
    document.getElementById('stat-total-revenue').innerText = `₱${revenue.toFixed(2)}`;
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    let bg = type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white';
    toast.className = `pointer-events-auto px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl transition-all ${bg}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}