/* Wishlist page: renders the saved products; removing a heart updates the grid. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  function draw() {
    const items = store.wish.map(getProduct).filter(Boolean);
    $('#wishGrid').innerHTML = items.map(cardHTML).join(''); $('#wishEmpty').hidden = !!items.length; $('#wishGrid').hidden = !items.length;
    if (typeof revealAll === 'function') revealAll($('#wishGrid'));
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-wish]')) setTimeout(draw, 350); });
  addEventListener('app:ready', draw);
})();
