const SUPABASE_URL = "https://eejnxfkuslcaptjkimeg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jQjPNZ9-pBCnhrZg4jEGpA_kUj5Aml8";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = s => document.querySelector(s);
const fmt = n => new Intl.NumberFormat('uk-UA').format(n) + ' ₴';

let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem('zvs-cart') || '[]');
let state = { q:'', cat:'Всі', sort:'featured' };

function esc(v='') {
  return String(v).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select('id,name,price,description,image_url,is_active')
    .eq('is_active', true)
    .order('created_at', { ascending:false });

  if (error) {
    console.error('Supabase products error:', error);
    PRODUCTS = [];
  } else {
    PRODUCTS = (data || []).map(row => ({
      id: Number(row.id),
      name: row.name,
      category: 'Товари',
      price: Number(row.price),
      img: row.image_url || 'assets/pets-hero.png',
      desc: row.description || ''
    }));
  }

  // Remove deleted/disabled products from existing carts safely.
  const validIds = new Set(PRODUCTS.map(p => p.id));
  cart = cart.filter(i => validIds.has(i.id));
  localStorage.setItem('zvs-cart', JSON.stringify(cart));
}

function renderFilters() {
  const cats = ['Всі', ...new Set(PRODUCTS.map(p => p.category))];
  $('#filters').innerHTML = cats.map(c =>
    `<button class="chip ${c===state.cat?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`
  ).join('');
  document.querySelectorAll('[data-cat]').forEach(b => {
    b.onclick = () => { state.cat = b.dataset.cat; render(); };
  });
}

function visible() {
  let a = PRODUCTS.filter(p =>
    (state.cat === 'Всі' || p.category === state.cat) &&
    (`${p.name} ${p.category} ${p.desc}`.toLowerCase().includes(state.q.toLowerCase()))
  );
  if(state.sort==='priceAsc') a.sort((x,y)=>x.price-y.price);
  if(state.sort==='priceDesc') a.sort((x,y)=>y.price-x.price);
  if(state.sort==='name') a.sort((x,y)=>x.name.localeCompare(y.name));
  return a;
}

function render() {
  renderFilters();
  const a = visible();
  $('#productGrid').innerHTML = a.map(p => `
    <article class="product">
      <div class="product-img">
        <img src="${esc(p.img)}" alt="${esc(p.name)}">
        <span>${esc(p.category)}</span>
      </div>
      <div class="product-body">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        <div class="product-row">
          <strong>${fmt(p.price)}</strong>
          <button class="add" data-add="${p.id}">Додати</button>
        </div>
      </div>
    </article>
  `).join('');
  $('#empty').hidden = a.length > 0;
  document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => add(Number(b.dataset.add)));
}

function save() {
  localStorage.setItem('zvs-cart', JSON.stringify(cart));
  updateCart();
}

function add(id) {
  const x = cart.find(i => i.id === id);
  x ? x.qty++ : cart.push({id,qty:1});
  save();
  openCart();
}

function updateCart() {
  const count = cart.reduce((s,i)=>s+i.qty,0);
  $('#cartCount').textContent = count;

  const items = cart.map(i => {
    const p = PRODUCTS.find(x => x.id===i.id);
    return p ? {i,p} : null;
  }).filter(Boolean);

  $('#cartItems').innerHTML = items.length ? items.map(({i,p}) => `
    <div class="cart-item">
      <img src="${esc(p.img)}" alt="">
      <div>
        <b>${esc(p.name)}</b>
        <small>${fmt(p.price)}</small>
        <div class="qty">
          <button data-dec="${p.id}">−</button>
          <span>${i.qty}</span>
          <button data-inc="${p.id}">+</button>
          <button class="remove" data-rem="${p.id}">Видалити</button>
        </div>
      </div>
    </div>
  `).join('') : '<div class="cart-empty">Кошик порожній. Додайте перші товари.</div>';

  const total = items.reduce((s,{i,p}) => s + p.price*i.qty, 0);
  $('#cartTotal').textContent = fmt(total);

  document.querySelectorAll('[data-inc]').forEach(b => b.onclick=()=>change(Number(b.dataset.inc),1));
  document.querySelectorAll('[data-dec]').forEach(b => b.onclick=()=>change(Number(b.dataset.dec),-1));
  document.querySelectorAll('[data-rem]').forEach(b => b.onclick=()=>{
    cart=cart.filter(x=>x.id!==Number(b.dataset.rem));
    save();
  });
}

function change(id,d) {
  const x=cart.find(i=>i.id===id);
  if(!x) return;
  x.qty+=d;
  if(x.qty<1) cart=cart.filter(i=>i.id!==id);
  save();
}

function openCart(){ $('#overlay').classList.add('show'); $('#cart').classList.add('show'); }
function closeCart(){ $('#overlay').classList.remove('show'); $('#cart').classList.remove('show'); }

$('#openCart').onclick=openCart;
$('#openCart2').onclick=openCart;
$('#closeCart').onclick=closeCart;
$('#overlay').onclick=closeCart;
$('#search').oninput=e=>{state.q=e.target.value;render();};
$('#sort').onchange=e=>{state.sort=e.target.value;render();};

$('#checkoutBtn').onclick=()=>{
  if(!cart.length){alert('Кошик порожній');return;}
  closeCart();
  $('#modal').classList.add('show');
};
$('#closeModal').onclick=()=>$('#modal').classList.remove('show');

$('#orderForm').onsubmit=e=>{
  e.preventDefault();
  const name=$('#name').value;
  const phone=$('#phone').value;
  const delivery=$('#delivery').value;
  const comment=$('#comment').value;
  const lines=cart.map(i=>{
    const p=PRODUCTS.find(p=>p.id===i.id);
    return `${p.name} — ${i.qty} шт. × ${fmt(p.price)}`;
  }).join('%0A');
  const total=cart.reduce((s,i)=>s+PRODUCTS.find(p=>p.id===i.id).price*i.qty,0);
  const msg=
    `Нове замовлення Здорові Хвостики%0A%0A`+
    `Ім’я: ${encodeURIComponent(name)}%0A`+
    `Телефон: ${encodeURIComponent(phone)}%0A`+
    `Отримання: ${encodeURIComponent(delivery)}%0A`+
    `${lines}%0A%0A`+
    `Разом: ${fmt(total)}%0A`+
    `Коментар: ${encodeURIComponent(comment)}`;
  const subject=encodeURIComponent('Замовлення Здорові Хвостики');
  $('#orderResult').hidden=false;
  $('#orderResult').innerHTML=
    `<p><b>Замовлення сформовано.</b></p>`+
    `<p>Для цього демо-розгортання воно відкривається через email.</p>`+
    `<a class="btn primary full" href="mailto:zoovetsvit.online@gmail.com?subject=${subject}&body=${msg}">Відкрити лист</a>`;
  cart=[];
  save();
};

async function init(){
  await loadProducts();
  updateCart();
  render();
}

init();
