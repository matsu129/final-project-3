import { fetchJSON, formatPrice } from './utils.js';

const params = new URLSearchParams(location.search);
const productId = params.get('id');

async function loadProducts() {
  console.log('Fetched product for ID:', productId);
  const Allproducts = await fetchJSON(`/api/products`);
  const product = Allproducts.find(p => String(p.id) === String(productId));
  if (!product) {
    console.error('Not found the product', productId);
    return;
  }
  displayProduct(product);

  const allReviews = await fetchJSON('/api/reviews');
  const productReviews = allReviews.filter(r => String(r.productId) === String(productId));
  displayReviews(productReviews);
}

function displayProduct(product) {
  document.querySelector('#product-name').textContent = product.name;
  document.querySelector('#main-img').src = product.image;
  document.querySelector('#thumbnail-1').src = product.thumbnails[0];
  document.querySelector('#thumbnail-2').src = product.thumbnails[1];
  document.querySelector('#thumbnail-3').src = product.thumbnails[2];
  document.querySelector('#price').textContent = formatPrice(product.price);
  document.querySelector('#description').textContent = product.description;
}

function displayReviews(productReviews) {
  const reviewList = document.querySelector('#review-List');
  reviewList.innerHTML = '';
  if (productReviews.length === 0) {
    const noReview = document.createElement('li');
    noReview.textContent = 'No reviews yet';
    reviewList.appendChild(noReview);
    return;
  }
  
  productReviews.forEach(r => {
    const li = document.createElement('li');
    const stars = '★'.repeat(r.stars) + '⭐︎'.repeat(5 - r.stars);
    li.innerHTML = `${stars} - ${r.comment}`;
    reviewList.appendChild(li);
  });
}

function handleReviewSubmit(event) {
  event.preventDefault();
  const stars = +document.querySelector('#stars').value;
  const comment = document.querySelector('#comment').value;

  fetch(`/api/reviews`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ productId, stars, comment })
  })
  .then(() => {
    alert('Review submitted!');
    loadProduct();
  })
  .catch(err => console.error('Failed to submit review:', err));
}

function addToCart() {
  const quantity = +document.querySelector('#quantity').value;
  const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id: productId, quantity });
  }

  localStorage.setItem('shoppingCart', JSON.stringify(cart));
  alert('Item added to your cart!')
}

document.querySelector('#review-form')?.addEventListener('submit', handleReviewSubmit);
document.querySelector('#add-to-cart')?.addEventListener('click', addToCart);
window.addEventListener('DOMContentLoaded', loadProducts);
