function initials(name) {
  return name.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(' ').filter(Boolean)
    .slice(0, 2).map(s => s[0].toUpperCase()).join('') || name[0].toUpperCase();
}

async function renderLeaderboard(filter = '') {
  const wrap = document.getElementById('rankList');
  wrap.innerHTML = '';

  const users = await API.getLeaderboard(filter);
  console.log(users[0]);
  document.getElementById('playerCount').textContent = users.length + ' hráčů v žebříčku';

  if (users.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><strong>Žebříček je zatím prázdný</strong>Databáze ještě není napojená — jakmile se diváci začnou přihlašovat přes Kick, objeví se tu.</div>`;
    return;
    
  }

  users.forEach((u, idx) => {
    const rank = idx + 1;
    const messageCount = u.message_count || 0;
    const row = document.createElement('div');
    row.className = 'rank-row' + (rank === 1 ? ' top' : '') + (rank === 2 || rank === 3 ? ' top2' : '');
    row.style.animationDelay = (Math.min(rank, 12) * 0.03) + 's';
    row.innerHTML = `
      <div class="rank-num">${rank}</div>
      <div class="r-main">
        <div class="r-avatar">${initials(u.username)}</div>
        <div>
          <div class="r-name">${u.username}</div>
          <div class="r-meta">
            <span class="msg-tag">${messageCount.toLocaleString('cs-CZ')} ${messageCount === 1 ? 'zpráva' : (messageCount >= 2 && messageCount <= 4 ? 'zprávy' : 'zpráv')}</span>
          </div>
        </div>
      </div>
      <div class="r-kk">${u.kk_points.toLocaleString('cs-CZ')}<small> KK</small></div>
    `;
    wrap.appendChild(row);
  });
}

async function renderYourStats() {
  const me = await API.getMe();
  const statsEl = document.getElementById('yourStats');
  const messagesEl = document.getElementById('yourMessages');
  const pointsEl = document.getElementById('yourPoints');

  if (!me) {
    statsEl.textContent = '— · 0 KK';
    messagesEl.textContent = '0';
    pointsEl.textContent = '0';
    return;
  }

  statsEl.textContent = `${me.username} · #${me.rank || '—'} · ${me.kk_points.toLocaleString('cs-CZ')} KK`;
  messagesEl.textContent = (me.message_count || 0).toLocaleString('cs-CZ');
  pointsEl.textContent = me.kk_points.toLocaleString('cs-CZ');
}
