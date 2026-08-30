# tyblaho69 · KK systém

Tvůj design (grunge/popel styl, taby, admin panel) rozdělený do
profesionální souborové struktury a napojený na backend. Vizuál je
1:1 stejný jako v původním souboru — jen je teď v samostatných
souborech a data jdou přes API místo natvrdo v JS.

## Co se změnilo oproti tvému souboru

- **CSS, HTML a JS jsou oddělené** (`public/css`, `public/js`) a JS je
  navíc rozsekaný podle zodpovědnosti (leaderboard, shop, inventář,
  admin, obecné UI) — jednodušší se v tom orientuje a rozšiřuje.
- **⚠️ Bezpečnostní oprava:** v tvém souboru bylo admin heslo
  (`tyblaho69`) přímo v JavaScriptu stránky — kdokoliv by si ho přečetl
  přes "zobrazit zdrojový kód". Teď se ověřuje na serveru
  (`routes/admin.js`) proti heslu v `.env`, které se do prohlížeče
  vůbec neposílá.
- **Data teď jdou přes `/api/...` endpointy** místo pole v paměti
  stránky — díky tomu se ti při refreshi nic neztratí (leaderboard,
  shop i nákupy zůstávají na serveru) a jde je snadno napojit na
  reálnou databázi.

## Struktura

```
tyblaho69/
  public/
    index.html          — kostra stránky (design beze změny)
    css/style.css        — veškerý styl
    js/
      api.js             — veškerá komunikace s backendem (JEDNO místo)
      ui.js               — taby, FAQ akordeon, popel, admin modal
      leaderboard.js       — žebříček
      shop.js               — shop + nákup
      inventory.js           — inventář
      admin.js                — admin CRUD a přihlášení
      main.js                  — spouští všechno po načtení stránky
  server.js              — Express server
  routes/
    api.js               — leaderboard / shop / inventář / nákup
    admin.js              — admin login + CRUD nad výhrami
    auth.js                — Kick OAuth přihlášení diváků
    webhook.js              — příjem eventů z Kicku (chat, subs)
  data/store.js          — datová vrstva (zatím v paměti procesu)
```

## Databáze — už napojená na Postgres

`data/store.js` teď mluví se skutečným Postgresem přes `db/pool.js`.
Schéma (`db/schema.sql`) se **vytvoří automaticky při startu serveru** —
nemusíš nic ručně spouštět v Railway konzoli.

### Nastavení na Railway

1. V projektu na Railway přidej **PostgreSQL** (`+ New` → `Database` →
   `Add PostgreSQL`), pokud jsi to ještě neudělal.
2. U tvého Node serveru (ne u databáze) zkontroluj v **Variables**, že
   tam je `DATABASE_URL` (Railway to obvykle propojí automaticky v
   rámci projektu).
3. Přidej tam i zbytek proměnných z `.env.example`:
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD` — přihlášení do administrace
   - `SESSION_SECRET` — libovolný náhodný dlouhý řetězec
   - `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`, `KICK_REDIRECT_URI` — až
     budeš mít založenou Kick OAuth appku (redirect URI musí být tvoje
     Railway doména, ne localhost)
   - `KICK_WEBHOOK_SECRET` — až budeš registrovat webhooky
4. Redeploy. V logu by se mělo objevit `✅ Databázové schéma je
   připravené.`

### Lokální vývoj s Postgresem

Pokud chceš appku zkoušet i lokálně, budeš potřebovat běžící Postgres
(např. přes Docker: `docker run -e POSTGRES_PASSWORD=dev -p 5432:5432
postgres`) a v `.env` nastavit `DATABASE_URL` na něj. Bez `DATABASE_URL`
appka naběhne (statické stránky fungují), ale API volání do databáze
spadnou — hodí se to jen na rychlou kontrolu frontendu.

## Vercel vs Railway — na co myslet

Appka je teď napsaná jako běžný Express server s vlastním Postgres
připojením (`pg` pool) — to je přesně to, jak Railway očekává, že appky
fungují (dlouhotrvající proces). Klidně tam zůstaň.

Pokud by ses přece jen chtěl přesunout na Vercel: Vercel běží na
serverless funkcích, takže dlouhotrvající `pg.Pool` připojení (tak jak
je teď napsané v `db/pool.js`) by potřebovalo upravit na "serverless
friendly" klienta (např. Neon nebo Vercel Postgres s HTTP driverem) a
appku by bylo čistší přepsat na Next.js API routes. Není to nutné, jen
ať víš, že přechod není jen "zkopírovat soubory".

## Spuštění lokálně

```bash
npm install
cp .env.example .env
```

V `.env` uprav hlavně:
- `ADMIN_PASSWORD` — heslo do administrace (v tvém starém souboru bylo
  natvrdo `tyblaho69`, doporučuju změnit)
- Kick OAuth proměnné až budeš mít založenou appku u Kicku (viz
  předchozí konverzace — potřebuješ, aby tyblaho69 appku odsouhlasil)

```bash
npm start
```

Web poběží na `http://localhost:3000`.

## Co zůstává stejné jako v tvém návrhu

- Design, animace, layout — nic vizuálního jsem neměnil.
- Logika tierů (Bronze/Silver/Gold/Diamond/Legend).
- Chování admin formuláře (přidat/upravit/smazat výhru).
- Prázdné stavy ("žebříček je zatím prázdný" atd.) — pořád se
  zobrazují, dokud nejsou reálná data.
