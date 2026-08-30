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

## Zatím v paměti, ne v databázi

`data/store.js` drží data v proměnných procesu — funguje to na test,
ale **při restartu serveru se všechno smaže** a na Vercelu (serverless)
by se to mazalo mezi jednotlivými requesty. Tohle je přesně to místo,
kam se zapojí databáze, až budeš mít hosting hotový — stačí přepsat
funkce v tomto jednom souboru, zbytek appky (routes, frontend) se
nemusí měnit.

## Vercel vs Railway — na co myslet

- **Railway** — tenhle Express server (`server.js`) tam poběží tak,
  jak je, protože Railway drží dlouhotrvající proces. Přidáš tam
  Postgres add-on a napojíš ho v `data/store.js`.
- **Vercel** — je postavený na serverless funkcích, takže dlouhotrvající
  Express proces (a hlavně data v paměti) tam nefunguje spolehlivě.
  Buď by šlo `server.js` obalit jako serverless funkci (funguje, ale je
  to trochu obcházení), nebo by bylo čistší appku převést na Next.js
  API routes. Řekni, kam se nakonec rozhodneš dát hosting, ať to
  případně doladíme přesně pod něj.

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
