// Kolo štěstí pro losování ve shopu. Admin vybere výhru typu "Losování",
// appka natáhne lístky podle skutečných nákupů (kolikrát kdo koupil,
// tolikrát je na kole) a nechá to roztočit. Po výhře jde vítězův lístek
// rovnou odebrat, ať nejde vylosovat podruhé.

let wheelTickets = []; // [{ kick_user_id, username }]
let wheelRotation = 0;
let wheelItemId = null;

async function populateWheelItemSelect() {
  const select = document.getElementById('wheelItemSelect');
  const items = await API.getShopItems();
  const raffleItems = items.filter(i => i.type === 'Losování');

  select.innerHTML = '';
  if (raffleItems.length === 0) {
    select.innerHTML = '<option value="">Žádné losování ve shopu</option>';
    select.disabled = true;
    return;
  }
  select.disabled = false;
  raffleItems.forEach(i => {
    const opt = document.createElement('option');
    opt.value = i.id;
    opt.textContent = `${i.name} (${i.price.toLocaleString('cs-CZ')} KK)`;
    select.appendChild(opt);
  });
}

function drawWheel(canvas, tickets) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 4;
  const n = tickets.length;
  const arc = (Math.PI * 2) / n;
  const palette = ['#161816', '#1e201d'];

  ctx.clearRect(0, 0, size, size);
  for (let i = 0; i < n; i++) {
    const start = i * arc;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, start + arc);
    ctx.closePath();
    ctx.fillStyle = palette[i % 2];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.stroke();

    if (n <= 42) {
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f3f5f2';
      ctx.font = (n <= 16 ? '18px' : '14px') + " 'DM Sans', sans-serif";
      ctx.fillText(tickets[i].username, radius - 14, 4);
      ctx.restore();
    }
  }
}

function pluralLístek(n) {
  if (n === 1) return 'lístek';
  if (n >= 2 && n <= 4) return 'lístky';
  return 'lístků';
}

function renderWheelArea(tickets, itemName, itemId) {
  const area = document.getElementById('wheelArea');
  area.style.display = 'block';
  area.innerHTML = `
    <div class="wheel-meta">Losuje se z <strong>${itemName}</strong> — ${tickets.length} ${pluralLístek(tickets.length)} na kole.</div>
    <div class="wheel-wrap">
      <div class="wheel-pointer"></div>
      <canvas id="wheelCanvas" width="480" height="480"></canvas>
      <div class="wheel-hub"></div>
    </div>
    <button class="btn-kick" id="wheelSpinBtn" style="max-width:220px;">Roztočit kolo</button>
    <div id="wheelResult" class="wheel-result">
      <div class="wheel-result-label">Vítěz</div>
      <div id="wheelWinner" class="wheel-winner"></div>
      <div class="wheel-result-actions">
        <button class="btn-kick" id="wheelRemoveBtn">Odebrat lístek</button>
        <button class="btn-ghost" id="wheelKeepBtn">Nechat na kole</button>
      </div>
      <div id="wheelStatus" class="wheel-status"></div>
    </div>
  `;

  wheelTickets = tickets;
  wheelItemId = itemId;
  wheelRotation = 0;
  const canvas = document.getElementById('wheelCanvas');
  drawWheel(canvas, wheelTickets);

  let winnerTicket = null;

  document.getElementById('wheelSpinBtn').addEventListener('click', () => {
    const btn = document.getElementById('wheelSpinBtn');
    const result = document.getElementById('wheelResult');
    btn.disabled = true;
    result.classList.remove('show');
    document.getElementById('wheelStatus').textContent = '';

    const n = wheelTickets.length;
    const winnerIndex = Math.floor(Math.random() * n);
    winnerTicket = wheelTickets[winnerIndex];
    const arcDeg = 360 / n;
    const target = winnerIndex * arcDeg + arcDeg / 2;
    const pointerAngle = 270;
    const currentAngle = ((wheelRotation % 360) + 360) % 360;
    const finishDelta = (pointerAngle - target - currentAngle + 360) % 360;
    wheelRotation += 6 * 360 + finishDelta;
    canvas.style.transform = `rotate(${wheelRotation}deg)`;

    setTimeout(() => {
      document.getElementById('wheelWinner').textContent = winnerTicket.username;
      result.classList.add('show');
      btn.disabled = false;
    }, 4700);
  });

  document.getElementById('wheelKeepBtn').addEventListener('click', () => {
    document.getElementById('wheelResult').classList.remove('show');
  });

  document.getElementById('wheelRemoveBtn').addEventListener('click', async () => {
    if (!winnerTicket) return;
    const removeBtn = document.getElementById('wheelRemoveBtn');
    removeBtn.disabled = true;
    document.getElementById('wheelStatus').textContent = 'Odebírám…';

    const result = await API.adminRemoveTicket(wheelItemId, winnerTicket.kick_user_id);
    removeBtn.disabled = false;

    if (!result.ok) {
      document.getElementById('wheelStatus').textContent = '';
      showToast(result.error || 'Odebrání lístku se nezdařilo.', 'error');
      return;
    }

    showToast(`Lístek uživatele ${winnerTicket.username} odebrán.`);
    document.getElementById('wheelResult').classList.remove('show');

    if (result.tickets.length === 0) {
      document.getElementById('wheelArea').style.display = 'none';
      showToast('Na kole už nezbyl žádný lístek.');
      return;
    }
    renderWheelArea(result.tickets, itemName, itemId);
  });
}

function initAdminWheel() {
  document.getElementById('wheelLoadBtn').addEventListener('click', async () => {
    const select = document.getElementById('wheelItemSelect');
    const itemId = select.value;
    const itemName = select.options[select.selectedIndex] ? select.options[select.selectedIndex].textContent : '';
    if (!itemId) {
      showToast('Nejdřív vyber losování ze seznamu.', 'error');
      return;
    }

    const btn = document.getElementById('wheelLoadBtn');
    btn.disabled = true;
    const result = await API.adminGetItemTickets(itemId);
    btn.disabled = false;

    if (!result.ok) {
      showToast(result.error || 'Načtení lístků se nezdařilo.', 'error');
      return;
    }
    if (!result.tickets || result.tickets.length === 0) {
      showToast('Na tuhle výhru si zatím nikdo nekoupil lístek.', 'error');
      document.getElementById('wheelArea').style.display = 'none';
      return;
    }

    renderWheelArea(result.tickets, itemName, itemId);
  });
}
