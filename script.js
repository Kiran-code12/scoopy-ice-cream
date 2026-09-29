// 1. Mobile menu toggle
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

menuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

// close menu after clicking a link
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

// 2. Flavour filter buttons
const filterButtons = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".card");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const type = btn.dataset.filter;
    cards.forEach((card) => {
      const show = type === "all" || card.dataset.type === type;
      card.classList.toggle("hide", !show);
    });
  });
});

// 4. Cart, checkout and order (frontend only)
const DELIVERY_FEE = 30;
const FREE_DELIVERY_ABOVE = 200;
const COUPONS = { SCOOPY10: 10 }; // code -> percent off

let cart = [];        // [{ name, price, qty }]
let discountPct = 0;

const $ = (id) => document.getElementById(id);
const money = (n) => "Rs. " + n.toFixed(0);

// keep cart after page refresh (falls back silently if storage is blocked)
try { cart = JSON.parse(localStorage.getItem("scoopyCart")) || []; } catch (e) { cart = []; }
function save() { try { localStorage.setItem("scoopyCart", JSON.stringify(cart)); } catch (e) {} }

function calc() {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount = Math.round(subtotal * discountPct / 100);
  const delivery = subtotal === 0 || subtotal - discount >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}

function totalsHTML() {
  const t = calc();
  return `<div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>` +
    (t.discount ? `<div><span>Coupon (${discountPct}% off)</span><span>- ${money(t.discount)}</span></div>` : "") +
    `<div><span>Delivery</span><span>${t.delivery ? money(t.delivery) : "Free"}</span></div>` +
    `<div class="grand"><span>Total</span><span>${money(t.total)}</span></div>`;
}

function render() {
  const list = $("cartItems");
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  $("cartCount").textContent = count;

  if (cart.length === 0) {
    list.innerHTML = '<p class="cart-empty">Your cart is empty.<br>Add some yummy scoops!</p>';
    $("toCheckout").disabled = true;
    $("toCheckout").style.opacity = 0.5;
  } else {
    list.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <div class="info"><strong>${item.name}</strong><span>${money(item.price)} each</span></div>
        <div class="qty">
          <button data-act="minus" data-i="${i}" aria-label="Decrease">-</button>
          <span>${item.qty}</span>
          <button data-act="plus" data-i="${i}" aria-label="Increase">+</button>
        </div>
        <button class="remove" data-act="remove" data-i="${i}">Remove</button>
      </div>`).join("");
    $("toCheckout").disabled = false;
    $("toCheckout").style.opacity = 1;
  }
  $("totals").innerHTML = totalsHTML();
  $("checkoutTotals").innerHTML = totalsHTML();
  save();
}

function showView(id) {
  ["viewCart", "viewCheckout", "viewDone"].forEach((v) => ($(v).hidden = v !== id));
  $("drawerTitle").textContent = id === "viewCheckout" ? "Checkout" : id === "viewDone" ? "Order Confirmed" : "Your Cart";
}
function openCart(view) { showView(view || "viewCart"); $("drawer").classList.add("open"); $("overlay").classList.add("show"); }
function closeCart() { $("drawer").classList.remove("open"); $("overlay").classList.remove("show"); }

// add to cart buttons
document.querySelectorAll(".add-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.name;
    const price = Number(btn.dataset.price);
    const found = cart.find((i) => i.name === name);
    if (found) found.qty++; else cart.push({ name, price, qty: 1 });
    render();
    btn.textContent = "Added!";
    btn.classList.add("added");
    setTimeout(() => { btn.textContent = "Add to Cart"; btn.classList.remove("added"); }, 900);
  });
});

// + / - / remove inside the cart
$("cartItems").addEventListener("click", (e) => {
  const act = e.target.dataset.act;
  if (!act) return;
  const i = Number(e.target.dataset.i);
  if (act === "plus") cart[i].qty++;
  if (act === "minus") cart[i].qty--;
  if (act === "remove" || cart[i].qty <= 0) cart.splice(i, 1);
  render();
});

// coupon
$("applyCoupon").addEventListener("click", () => {
  const code = $("couponInput").value.trim().toUpperCase();
  const msg = $("couponMsg");
  if (COUPONS[code]) {
    discountPct = COUPONS[code];
    msg.textContent = "Coupon applied: " + discountPct + "% off";
    msg.className = "coupon-msg ok";
  } else {
    discountPct = 0;
    msg.textContent = code ? "Invalid coupon code." : "Enter a coupon code first.";
    msg.className = "coupon-msg bad";
  }
  render();
});

// open / close / steps
$("cartBtn").addEventListener("click", () => openCart());
$("closeCart").addEventListener("click", closeCart);
$("overlay").addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });
$("toCheckout").addEventListener("click", () => showView("viewCheckout"));
$("backToCart").addEventListener("click", () => showView("viewCart"));

// place order
$("checkoutForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("cName").value.trim();
  const phone = $("cPhone").value.trim();
  const address = $("cAddress").value.trim();
  const error = $("formError");

  if (name.length < 2) { error.textContent = "Please enter your full name."; return; }
  if (!/^[6-9]\d{9}$/.test(phone)) { error.textContent = "Enter a valid 10 digit mobile number."; return; }
  if (address.length < 8) { error.textContent = "Please enter your full delivery address."; return; }
  error.textContent = "";

  const pay = document.querySelector('input[name="pay"]:checked').value;
  $("doneName").textContent = name;
  $("orderId").textContent = "#SCP" + Math.floor(10000 + Math.random() * 90000);
  $("donePay").textContent = pay;
  $("doneSummary").innerHTML = cart.map((i) => `<div><span>${i.qty} x ${i.name}</span><span>${money(i.price * i.qty)}</span></div>`).join("") + totalsHTML();

  cart = [];
  discountPct = 0;
  $("couponInput").value = "";
  $("couponMsg").textContent = "";
  e.target.reset();
  render();
  showView("viewDone");
});

$("newOrder").addEventListener("click", () => { closeCart(); showView("viewCart"); });

render();
