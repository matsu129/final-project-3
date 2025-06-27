import { fetchJSON, formatPrice } from './utils.js';
const checkoutBtn = document.querySelector('#checkout-btn');

async function loadCart() {
  const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
  const cartContainer = document.querySelector('#cart-items');
  const totalPriceElem = document.querySelector('#total-price');
  
  cartContainer.innerHTML = '';
  totalPriceElem.textContent = '';

  if (cart.length === 0) {
    cartContainer.innerHTML = '<p>Your cart is empty.</p>'
    const oldHeading = document.querySelector('#cart-total-heading');
    if (checkoutBtn) {
      checkoutBtn.style.display = 'none';
    }
    if (oldHeading) {
      oldHeading.remove();
    }
    return;
  }

  const allProducts = await fetchJSON('/api/products');
  let total = 0;
  cart.forEach(item => {
    const product = allProducts.find(p => String(p.id) === String(item.id));
    if (!product) return;

    const itemTotal = product.price * item.quantity;
    total += itemTotal;

    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="cart-thumb" />
      <div class="cart-info">
        <h2>${product.name}</h2>
        <p>${formatPrice(product.price)} * ${item.quantity} = ${formatPrice(itemTotal)}</p>
        <button class="remove-btn" data-id="${product.id}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
    cartContainer.appendChild(div);
  });

  if (cart.length !== 0) {
    let existingHeading = document.querySelector('#cart-total-heading');
    if (!existingHeading) {
      const heading = document.createElement('h3');
      heading.id = 'cart-total-heading';
      heading.textContent = 'Estimated total';
      totalPriceElem.before(heading);
    }
  }
  totalPriceElem.textContent = formatPrice(total);

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.currentTarget.dataset.id;
      removeFromCart(id);
      loadCart();
    });
  });
}

function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('shoppingCart', JSON.stringify(cart));
}

checkoutBtn.addEventListener('click', async () => {
  if (!confirm('Proceed to checkout?')) return;
  const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
  const res = await fetch('/api/cart/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify(cart)
  });

  if (res.ok) {
    localStorage.removeItem('shoppingCart');
    await loadCart();
    alert('Thank you for your purchase!');
  } else {
    const err = await res.text();
    alert('Checkout failed: ' + err);
  }
  
});
window.addEventListener('DOMContentLoaded', loadCart);