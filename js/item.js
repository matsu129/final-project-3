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
  const quantityInput = document.querySelector('#quantity');
  quantityInput.value = 1;
  quantityInput.min = 1;
  quantityInput.max = product.stock;
  if (product.stock === 1) {
    quantityInput.readOnly = true;
  }

  const addBtn = document.querySelector('#add-to-cart');
  if(product.stock === 0) {
    addBtn.textContent = 'Sold out';
    addBtn.disabled = true;
    addBtn.style.backgroundColor ='#ccc';
    addBtn.style.cursor = 'not-allowed';
  } else {
    addBtn.textContent ='Add to Cart';
    addBtn.disabled = false;
    addBtn.style.backgroundColor = '';
    addBtn.style.cursor = 'pointer';
  }

  document.querySelectorAll('.thumbnail-gallery img').forEach(thumbnail => {
    thumbnail.addEventListener('click', () => {
      document.querySelector('#main-img').src = thumbnail.src;

      document.querySelectorAll('.thumbnail-gallery img').forEach(img => {
        img.classList.remove('selected');
      });
      thumbnail.classList.add('selected');
    })
  })
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
  const starsInput = document.querySelector('#stars');
  const commentInput = document.querySelector('#comment');
  const stars = +starsInput.value;
  const comment = commentInput.value;

  fetch(`/api/reviews`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ productId, stars, comment })
  })
  .then(async () => {
    alert('Review submitted!');

    starsInput.value = '';
    commentInput.value = '';

    const allReviews = await fetchJSON('/api/reviews');
    const productReviews = allReviews.filter(r => String(r.productId) === String(productId));
    displayReviews(productReviews);
  })
  .catch(err => console.error('Failed to submit review:', err));
}

function addToCart() {
  const quantity = +document.querySelector('#quantity').value;
  const maxStock = +document.querySelector('#quantity').max;
  if (quantity > maxStock) {
    alert(`Sorry, only ${maxStock} item(s) in stock.`);
    return;
  }

  const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
  const existing = cart.find(i => i.id === productId);
  const currentQuantity = existing ? existing.quantity : 0;
  const newTotal = currentQuantity + quantity;

  if (newTotal > maxStock) {
    alert(`You already have ${currentQuantity} item(s) in your cart. Only ${max-Stock - currentQuantity} more can be added.`);
    return
  }
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
