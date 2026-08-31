function initials(name) {
  return name.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(' ').filter(Boolean)
    .slice(0, 2).map(s => s[0].toUpperCase()).join('') || name[0].toUpperCase();
}

async function renderLeaderboard(filter = '') {
  const wrap = document.getElementById('rankList');
  wrap.innerHTML = '';

  const users = await API.getLeaderboard(filter);
  document.getElementById('playerCount').textContent = users.length + ' hráčů v žebříčku';

  if (users.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><strong>Žebříček je zatím prázdný</strong>Databáze ještě není napojená — jakmile se diváci začnou přihlašovat přes Kick, objeví se tu.</div>`;
    return;
  }

  users.forEach((u, idx) => {
    const rank = idx + 1;
    const messageCount = u.message_count || 0;

    const avatarHtml = u.avatar_url
      ? `<img src="${u.avatar_url}" class="tb69-avatar" alt="${u.username}" loading="lazy" onerror="this.outerHTML='<div class=&quot;tb69-avatar&quot;>${initials(u.username)}</div>'">`
      : `<div class="tb69-avatar">${initials(u.username)}</div>`;

    const row = document.createElement('div');
    row.className = 'tb69-row' + (rank === 1 ? ' top' : '') + (rank === 2 || rank === 3 ? ' top2' : '');
    row.style.animationDelay = (Math.min(rank, 12) * 0.03) + 's';
    row.innerHTML = `
      <div class="tb69-num">${rank}</div>
      <div class="tb69-main">
        ${avatarHtml}
        <div>
          <div class="tb69-name">${u.username}</div>
          <div class="tb69-meta">
            <span class="msg-tag">${messageCount.toLocaleString('cs-CZ')} ${messageCount === 1 ? 'zpráva' : (messageCount >= 2 && messageCount <= 4 ? 'zprávy' : 'zpráv')}</span>
          </div>
        </div>
      </div>
      <div class="tb69-kk">${u.kk_points.toLocaleString('cs-CZ')}<small> KK</small></div>
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

  const avatarHtml = me.avatar_url
    ? `<img src="${me.avatar_url}" class="you-avatar" alt="${me.username}" onerror="this.style.display='none'">`
    : '';

  statsEl.textContent = `${me.username} · #${me.rank || '—'} · ${me.kk_points.toLocaleString('cs-CZ')} KK`;
  messagesEl.textContent = (me.message_count || 0).toLocaleString('cs-CZ');
  pointsEl.textContent = me.kk_points.toLocaleString('cs-CZ');
}
