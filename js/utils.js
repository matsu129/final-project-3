export function fetchJSON(url) {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  })
}

export function formatPrice(number) {
  return '¥' + number.toLocaleString();
}