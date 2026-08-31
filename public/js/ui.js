// Taby (Leaderboard / Shop / Inventář / FAQ / Admin)
function kkAlert(message, options = {}) {
  const { title = 'Upozornění', type = 'info' } = options;

  let overlay = document.querySelector('.kk-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'kk-modal-overlay';
    overlay.innerHTML = `
      <div class="kk-modal-box">
        <span class="kk-modal-icon"></span>
        <div class="kk-modal-title"></div>
        <div class="kk-modal-message"></div>
        <button class="kk-modal-btn">OK</button>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('.kk-modal-btn').addEventListener('click', () => {
      overlay.classList.remove('show');
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('show');
    });
  }

  const icons = { error: '⚠', success: '✓', info: 'ℹ' };
  overlay.querySelector('.kk-modal-icon').textContent = icons[type] || icons.info;
  overlay.querySelector('.kk-modal-icon').className = `kk-modal-icon ${type}`;
  overlay.querySelector('.kk-modal-title').textContent = title;
  overlay.querySelector('.kk-modal-message').textContent = message;

  overlay.classList.add('show');
}

function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('view-' + tab.dataset.view).classList.add('active');
    });
  });
}

// FAQ akordeon
function initFaqAccordion() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const a = item.querySelector('.faq-a');
    item.querySelector('.faq-q').addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!open) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });
}

// Ambientní popelové částice na pozadí
function initAshParticles() {
  const ashLayer = document.getElementById('ashLayer');
  if (!ashLayer) return;
  for (let n = 0; n < 28; n++) {
    const p = document.createElement('i');
    const dur = 14 + Math.random() * 16;
    const delay = Math.random() * 20;
    const left = Math.random() * 100;
    const drift = (Math.random() * 80 - 40) + 'px';
    const size = (1.5 + Math.random() * 2.5) + 'px';
    p.style.left = left + 'vw';
    p.style.width = size;
    p.style.height = size;
    p.style.setProperty('--drift', drift);
    p.style.animationDuration = dur + 's';
    p.style.animationDelay = '-' + delay + 's';
    ashLayer.appendChild(p);
  }
}

// Zjistí, jestli je uživatel přihlášený přes Kick, a podle toho
// přepne hlavičku mezi tlačítkem "Přihlásit" a jménem/odhlášením.
async function initKickAuthStatus() {
  const me = await API.getMe();
  const loginBtn = document.getElementById('kickLoginBtn');
  const userBox = document.getElementById('kickUserBox');
  const usernameEl = document.getElementById('kickUsername');

  if (me) {
    loginBtn.style.display = 'none';
    userBox.style.display = 'flex';
    usernameEl.textContent = me.username;
  } else {
    loginBtn.style.display = 'inline-block';
    userBox.style.display = 'none';
  }
}

function initKickLogout() {
  document.getElementById('kickLogoutBtn').addEventListener('click', () => {
    window.location.href = '/api/auth/logout';
  });
}

// Admin login modal (otevření/zavření okna) - samotné ověření je v admin.js
function initAdminModal() {
  const overlay = document.getElementById('adminModalOverlay');
  document.getElementById('openAdminBtn').addEventListener('click', () => overlay.classList.add('open'));
  document.getElementById('adminCancelBtn').addEventListener('click', () => overlay.classList.remove('open'));
}

function thumbHtml(img) {
  if (img) {
    return `<img class="img-box" src="${img}" onerror="this.outerHTML='<div class=&quot;thumb-empty&quot; style=&quot;width:100%;height:100%;&quot;>chybí obrázek</div>'" />`;
  }
  return `<div class="thumb-empty" style="width:100%;height:100%;">bez obrázku</div>`;
}
