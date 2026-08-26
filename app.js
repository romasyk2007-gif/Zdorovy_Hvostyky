const SUPABASE_URL = "https://eejnxfkuslcaptjkimeg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jQjPNZ9-pBCnhrZg4jEGpA_kUj5Aml8";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = s => document.querySelector(s);
const fmt = n => new Intl.NumberFormat('uk-UA').format(n) + ' ₴';

// Fixed catalog sections. The admin panel should write one of these exact
// strings into products.category. Anything else falls back to "Інше".
const CATEGORIES = [
  'Обладнання та інструменти для грумінгу',
  'Годівниці, поїлки та миски для домашніх тварин',
  'Туалетні лотки для тварин і аксесуари',
  'Ветеринарні препарати та засоби',
  'Засоби по догляду за тваринами',
  'Іграшки для домашніх тварин',
  'Корм для собак і котів',
  'Ласощі для домашніх тварин',
  'Товари для прогулянок і подорожей з тваринами',
  'Догляд та гігієна тварин',
  'Спальні місця для домашніх тварин, килимки'
];

const STORES = [
  'вул. Дзвонарська, 7',
  'вул. В. Винниченка, 1',
  'вул. Хіміків, 4',
  'вул. Б. Хмельницького, 1',
  'вул. Б. Хмельницького, 36'
];

let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem('zvs-cart') || '[]');
let state = { q:'', cat:'Всі', sort:'featured' };
let orderMode = 'pickup';

function esc(v='') {
  return String(v).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select('id,name,price,old_price,description,image_url,is_active,category,stock_quantity,stock,product_code')
    .eq('is_active', true)
    .order('created_at', { ascending:false });

  if (error) {
    console.error('Supabase products error:', error);
    PRODUCTS = [];
  } else {
    PRODUCTS = (data || []).map(row => {
      const price = Number(row.price);
      const oldPrice = row.old_price != null && Number(row.old_price) > price ? Number(row.old_price) : null;
      const stock = row.stock_quantity != null ? Number(row.stock_quantity) : (row.stock != null ? Number(row.stock) : null);
      return {
        id: Number(row.id),
        name: row.name,
        category: CATEGORIES.includes(row.category) ? row.category : 'Інше',
        price,
        oldPrice,
        stock,
        productCode: row.product_code || '',
        img: row.image_url || 'assets/pets-hero.png',
        desc: row.description || ''
      };
    });
  }

  // Remove deleted/disabled products from existing carts safely.
  const validIds = new Set(PRODUCTS.map(p => p.id));
  cart = cart.filter(i => validIds.has(i.id));
  localStorage.setItem('zvs-cart', JSON.stringify(cart));
}

function renderFilters() {
  const present = new Set(PRODUCTS.map(p => p.category));
  const cats = ['Всі', ...CATEGORIES.filter(c => present.has(c)), ...(present.has('Інше') ? ['Інше'] : [])];
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
  $('#productGrid').innerHTML = a.map(p => {
    const onSale = p.oldPrice != null;
    const pct = onSale ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    const outOfStock = p.stock === 0;
    const stockLabel = p.stock == null ? ''
      : outOfStock ? '<span class="stock out">Немає в наявності</span>'
      : p.stock <= 5 ? `<span class="stock low">Залишилось: ${p.stock} шт.</span>`
      : `<span class="stock ok">В наявності: ${p.stock} шт.</span>`;
    return `
    <article class="product${outOfStock?' out-of-stock':''}">
      <div class="product-img">
        <img src="${esc(p.img)}" alt="${esc(p.name)}">
        <span>${esc(p.category)}</span>
        ${onSale ? `<span class="sale-badge">-${pct}%</span>` : ''}
      </div>
      <div class="product-body">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        ${stockLabel}
        <div class="product-row">
          <div class="price-box">
            ${onSale ? `<small class="old-price">${fmt(p.oldPrice)}</small>` : ''}
            <strong${onSale?' class="sale-price"':''}>${fmt(p.price)}</strong>
          </div>
          <button class="add" data-add="${p.id}" ${outOfStock?'disabled':''}>${outOfStock?'Немає':'Додати'}</button>
        </div>
      </div>
    </article>
  `; }).join('');
  $('#empty').hidden = a.length > 0;
  document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => add(Number(b.dataset.add)));
}

function save() {
  localStorage.setItem('zvs-cart', JSON.stringify(cart));
  updateCart();
}

function add(id) {
  const p = PRODUCTS.find(p => p.id === id);
  if (!p || p.stock === 0) return;
  const x = cart.find(i => i.id === id);
  const nextQty = (x ? x.qty : 0) + 1;
  if (p.stock != null && nextQty > p.stock) return;
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
  const p=PRODUCTS.find(p=>p.id===id);
  if(d>0 && p && p.stock!=null && x.qty+d>p.stock) return;
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
  $('#orderResult').hidden=true;
  $('#orderForm').hidden=false;
  setOrderMode('pickup');
  $('#modal').classList.add('show');
};
$('#closeModal').onclick=()=>$('#modal').classList.remove('show');

function setOrderMode(mode){
  orderMode=mode;
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active', b.dataset.mode===mode));
  const pickup = mode==='pickup';
  $('#pickupFields').hidden = !pickup;
  $('#deliveryFields').hidden = pickup;
  // toggle required so hidden fields don't block submission
  $('#p_name').required = pickup;
  $('#p_phone').required = pickup;
  $('#d_name').required = !pickup;
  $('#d_phone').required = !pickup;
  $('#d_city').required = !pickup;
  $('#d_branch').required = !pickup;
}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setOrderMode(b.dataset.mode));

$('#orderForm').onsubmit=e=>{
  e.preventDefault();
  const lines=cart.map(i=>{
    const p=PRODUCTS.find(p=>p.id===i.id);
    return `${p.name} — ${i.qty} шт. × ${fmt(p.price)}`;
  }).join('%0A');
  const total=cart.reduce((s,i)=>s+PRODUCTS.find(p=>p.id===i.id).price*i.qty,0);

  let deliveryBlock;
  if(orderMode==='pickup'){
    deliveryBlock=
      `Спосіб отримання: Самовивіз%0A`+
      `Ім’я та прізвище: ${encodeURIComponent($('#p_name').value)}%0A`+
      `Телефон: ${encodeURIComponent($('#p_phone').value)}%0A`+
      `Магазин самовивозу: ${encodeURIComponent($('#p_store').value)}%0A`+
      `Примітка: ${encodeURIComponent($('#p_comment').value)}`;
  } else {
    deliveryBlock=
      `Спосіб отримання: Доставка (Нова пошта)%0A`+
      `Ім’я та прізвище: ${encodeURIComponent($('#d_name').value)}%0A`+
      `Телефон: ${encodeURIComponent($('#d_phone').value)}%0A`+
      `Місто: ${encodeURIComponent($('#d_city').value)}%0A`+
      `№ відділення/поштомату: ${encodeURIComponent($('#d_branch').value)}%0A`+
      `Примітка: ${encodeURIComponent($('#d_comment').value)}`;
  }

  const msg=
    `Нове замовлення Здорові Хвостики%0A%0A`+
    `${deliveryBlock}%0A%0A`+
    `${lines}%0A%0A`+
    `Разом: ${fmt(total)}`;
  const subject=encodeURIComponent('Замовлення Здорові Хвостики');
  $('#orderForm').hidden=true;
  $('#orderResult').hidden=false;
  $('#orderResult').innerHTML=
    `<p><b>Замовлення сформовано.</b></p>`+
    `<p>Для цього демо-розгортання воно відкривається через email.</p>`+
    `<a class="btn primary full" href="mailto:zoovetsvit.online@gmail.com?subject=${subject}&body=${msg}">Відкрити лист</a>`;
  cart=[];
  save();
};

function renderStores(){
  $('#p_store').innerHTML = STORES.map(s => `<option>${esc(s)}</option>`).join('');
}

async function init(){
  renderStores();
  await loadProducts();
  updateCart();
  render();
}

init();
