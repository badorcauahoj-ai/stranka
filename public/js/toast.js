// Malé oznámení v pravém dolním rohu místo ošklivého window.alert().
// Použití: showToast('Nákup proběhl úspěšně!') nebo showToast('Chyba…', 'error')

function ensureToastContainer() {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    document.body.appendChild(wrap);
  }
  return wrap;
}

function showToast(message, type = 'success', duration = 4000) {
  const wrap = ensureToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'error' ? '✕' : '✓'}</span>
    <span class="toast-text"></span>
  `;
  toast.querySelector('.toast-text').textContent = message;

  wrap.appendChild(toast);
  // vynutí reflow, ať se animace spustí od začátku i při rychlém opakování
  void toast.offsetWidth;
  toast.classList.add('show');

  const remove = () => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  };

  const timer = setTimeout(remove, duration);
  toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
}
