import { fetchJSON, formatPrice } from './utils.js';

async function loadProducts() {
  const products =  await fetchJSON('/api/products');

  const sections = {
    new: document.getElementById('section-new'),
    plush: document.getElementById('section-plush'),
    mascot: document.getElementById('section-mascot'),
  };

  Object.values(sections).forEach(section => section.innerHTML = '');

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.position = 'relative';
    const soldOutLabel = document.createElement('div');
    soldOutLabel.textContent = 'SOLD OUT';
    soldOutLabel.className = 'sold-out';
    if (product.stock === 0) {
      card.appendChild(soldOutLabel);
    }
    card.innerHTML += `
        <a href="./item.html?id=${product.id}">
          <img src="${product.image}" alt= "${product.name}">
          <h3>${product.name}</h3>
          <p>${formatPrice(product.price)}(tax included)</p>
        </a>
      `;
    const category = product.category;
    if (sections[category]) {
      sections[category].appendChild(card);
    }
  });
}

loadProducts();