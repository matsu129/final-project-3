import { fetchJSON, formatPrice } from "./utils";

async function loadCart() {
  const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
  const cartContainer = document.querySelector('#cart-items');
  const totalPriceElem = document.querySelector('#total-price');
  cartContainer.innerHTML = '';
  totalPriceElem.textContent = '';

  if (cart.length === 0) {
    cartContainere.innerHTML = '<p>Your cart is empty.</p>'
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
        <p>${formatPrice(product.price)} * ${item.quantity} = ${formatPrice(itemTotal)}}</p>
        <button class="remove-btn" data-id="${product.id}">Remove</button>
      </div>
    `;
    cartContainer.appendChild(div);
  });

  totalPriceElem.textContent = formatPrice(total);

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.dataset.id;
      removeFromCart(id);
      loadCart();
    })
  })

  function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('shoppingCart', JSONstringfy(cart));
  }

  window.addEventListener('DOMContentLoaded', loadCart);
}