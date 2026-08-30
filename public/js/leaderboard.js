function tierOf(kk) {
  if (kk >= 13000) return ['legend', 'Legend'];
  if (kk >= 9000) return ['diamond', 'Diamond'];
  if (kk >= 5000) return ['gold', 'Gold'];
  if (kk >= 3000) return ['silver', 'Silver'];
  return ['bronze', 'Bronze'];
}

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
    const [tierClass, tierLabel] = tierOf(u.kk_points);
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
            <span class="tier-tag tier-${tierClass}">${tierLabel}</span>
            <span class="sub-flame">${u.sub_streak || 0} sub streak</span>
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
  const labelEl = document.getElementById('yourProgressLabel');
  const fillEl = document.getElementById('yourProgressFill');

  if (!me) {
    statsEl.textContent = '— · 0 KK';
    labelEl.textContent = 'Přihlas se přes Kick pro zobrazení postupu';
    fillEl.style.width = '0%';
    return;
  }

  statsEl.textContent = `#${me.rank || '—'} · ${me.kk_points.toLocaleString('cs-CZ')} KK`;
  const [, tierLabel] = tierOf(me.kk_points);
  labelEl.textContent = `Tier: ${tierLabel}`;
  fillEl.style.width = Math.min(100, (me.kk_points % 4000) / 40) + '%';
}
