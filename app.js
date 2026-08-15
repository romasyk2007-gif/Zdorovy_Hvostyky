const SUPABASE_URL = "https://eejnxfkuslcaptjkimeg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jQjPNZ9-pBCnhrZg4jEGpA_kUj5Aml8";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let PRODUCTS = [];
const $ = s => document.querySelector(s);
const fmt = n => new Intl.NumberFormat('uk-UA').format(n) + ' ₴';
let cart = JSON.parse(localStorage.getItem('zvs-cart') || '[]');
let state = {q:'', cat:'Всі', sort:'featured'};

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function catsList(){
  const cats = [...new Set(PRODUCTS.map(p => p.category).filter(Boolean))];
  return ['Всі', ...cats];
}

function renderFilters(){
  const cats = catsList();
  $('#filters').innerHTML = cats.map(c =>
    `<button class="chip ${c === state.cat ? 'active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
  ).join('');
  document.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => {
    state.cat = b.dataset.cat;
    render();
  });
}

function visible(){
  let a = PRODUCTS.filter(p =>
    (state.cat === 'Всі' || p.category === state.cat) &&
    (`${p.name} ${p.category} ${p.desc}`.toLowerCase().includes(state.q.toLowerCase()))
  );
  if(state.sort === 'priceAsc') a.sort((x,y) => x.price - y.price);
  if(state.sort === 'priceDesc') a.sort((x,y) => y.price - x.price);
  if(state.sort === 'name') a.sort((x,y) => x.name.localeCompare(y.name));
  return a;
}

function render(){
  renderFilters();
  const a = visible();
  $('#productGrid').innerHTML = a.map(p => `
    <article class="product">
      <div class="product-img">
        ${p.img ? `<img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.name)}" loading="lazy">` : `<div style="display:grid;place-items:center;height:100%;font-size:48px;color:#0b5cab">🐾</div>`}
        <span>${escapeHtml(p.category || 'Товар')}</span>
      </div>
      <div class="product-body">
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.desc || '')}</p>
        <div class="product-row">
          <strong>${fmt(p.price)}</strong>
          <button class="add" data-add="${p.id}">Додати</button>
        </div>
      </div>
    </article>`).join('');

  $('#empty').hidden = a.length > 0;

  document.querySelectorAll('[data-add]').forEach(b =>
    b.onclick = () => add(b.dataset.add)
  );
}

function save(){
  localStorage.setItem('zvs-cart', JSON.stringify(cart));
  updateCart();
}

function productById(id){
  return PRODUCTS.find(p => String(p.id) === String(id));
}

function add(id){
  const x = cart.find(i => String(i.id) === String(id));
  if(x) x.qty++;
  else cart.push({id:String(id), qty:1});
  save();
  openCart();
}

function updateCart(){
  const count = cart.reduce((s,i) => s + i.qty, 0);
  $('#cartCount').textContent = count;

  const validCart = cart.filter(i => productById(i.id));
  if(validCart.length !== cart.length){
    cart = validCart;
    localStorage.setItem('zvs-cart', JSON.stringify(cart));
  }

  $('#cartItems').innerHTML = cart.length ? cart.map(i => {
    const p = productById(i.id);
    return `<div class="cart-item">
      <img src="${escapeHtml(p.img || '')}" alt="${escapeHtml(p.name)}">
      <div>
        <b>${escapeHtml(p.name)}</b>
        <small>${fmt(p.price)}</small>
        <div class="qty">
          <button data-dec="${p.id}">−</button>
          <span>${i.qty}</span>
          <button data-inc="${p.id}">+</button>
          <button class="remove" data-rem="${p.id}">Видалити</button>
        </div>
      </div>
    </div>`;
  }).join('') : '<div class="cart-empty">Кошик порожній. Додайте перші товари.</div>';

  const total = cart.reduce((s,i) => {
    const p = productById(i.id);
    return p ? s + p.price * i.qty : s;
  }, 0);

  $('#cartTotal').textContent = fmt(total);

  document.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => change(b.dataset.inc,1));
  document.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => change(b.dataset.dec,-1));
  document.querySelectorAll('[data-rem]').forEach(b => b.onclick = () => {
    cart = cart.filter(x => String(x.id) !== String(b.dataset.rem));
    save();
  });
}

function change(id,d){
  const x = cart.find(i => String(i.id) === String(id));
  if(!x) return;
  x.qty += d;
  if(x.qty < 1) cart = cart.filter(i => String(i.id) !== String(id));
  save();
}

function openCart(){
  $('#overlay').classList.add('show');
  $('#cart').classList.add('show');
}

function closeCart(){
  $('#overlay').classList.remove('show');
  $('#cart').classList.remove('show');
}

function showCatalogStatus(message){
  $('#productGrid').innerHTML = `<div class="empty" style="grid-column:1/-1">${escapeHtml(message)}</div>`;
  $('#empty').hidden = true;
}

async function loadProducts(){
  showCatalogStatus('Завантаження асортименту…');

  const { data, error } = await supabaseClient
    .from('products')
    .select('id,name,price,description,image_url,is_active,created_at')
    .eq('is_active', true)
    .order('created_at', { ascending:false });

  if(error){
    console.error('Supabase products error:', error);
    showCatalogStatus('Не вдалося завантажити асортимент. Спробуйте оновити сторінку.');
    return;
  }

  PRODUCTS = (data || []).map(p => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    img: p.image_url,
    desc: p.description || '',
    category: 'Товари'
  }));

  if(!PRODUCTS.length){
    $('#productGrid').innerHTML = '';
    $('#empty').hidden = false;
    $('#empty').textContent = 'Асортимент поки порожній. Додайте товари через адмін-панель.';
    updateCart();
    return;
  }

  // If a previous cart was built from old demo IDs, remove those invalid lines.
  cart = cart.filter(i => productById(i.id));
  save();
  render();
}

$('#openCart').onclick = openCart;
$('#openCart2').onclick = openCart;
$('#closeCart').onclick = closeCart;
$('#overlay').onclick = closeCart;
$('#search').oninput = e => { state.q=e.target.value; render(); };
$('#sort').onchange = e => { state.sort=e.target.value; render(); };

$('#checkoutBtn').onclick = () => {
  if(!cart.length){
    alert('Кошик порожній');
    return;
  }
  closeCart();
  $('#modal').classList.add('show');
};

$('#closeModal').onclick = () => $('#modal').classList.remove('show');

$('#orderForm').onsubmit = e => {
  e.preventDefault();
  if(!cart.length){
    alert('Кошик порожній');
    return;
  }

  const name = $('#name').value;
  const phone = $('#phone').value;
  const delivery = $('#delivery').value;
  const comment = $('#comment').value;

  const lines = cart.map(i => {
    const p = productById(i.id);
    return `${p.name} — ${i.qty} шт. × ${fmt(p.price)}`;
  }).join('%0A');

  const total = cart.reduce((s,i) => {
    const p = productById(i.id);
    return s + p.price * i.qty;
  }, 0);

  const msg = `Нове замовлення Здорові Хвостики%0A%0AІм’я: ${encodeURIComponent(name)}%0AТелефон: ${encodeURIComponent(phone)}%0AОтримання: ${encodeURIComponent(delivery)}%0A${lines}%0A%0AРазом: ${fmt(total)}%0AКоментар: ${encodeURIComponent(comment)}`;
  const subject = encodeURIComponent('Замовлення Здорові Хвостики');

  $('#orderResult').hidden = false;
  $('#orderResult').innerHTML = `
    <p><b>Замовлення сформовано.</b></p>
    <p>Для цього тестового розгортання воно відкривається через email.</p>
    <a class="btn primary full" href="mailto:zoovetsvit.online@gmail.com?subject=${subject}&body=${msg}">Відкрити лист</a>`;

  // Preserve existing demo behavior for the cart; real order insertion is next phase.
  cart = [];
  save();
};

updateCart();
loadProducts();
