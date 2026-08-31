## 📁 Struktura projektu

```text
tyblaho69/
├── 📁 data/
│   └── store.js          # Správa a dočasné ukládání aplikačních dat / stavů
├── 📁 db/
│   ├── pool.js           # Nastavení a správa připojení k PostgreSQL databázi
│   └── schema.sql        # SQL schéma (definice tabulek pro uživatele, shop, body)
├── 📁 public/            # Statické soubory přístupné pro veřejnost / prohlížeč
│   ├── 📁 css/
│   │   └── style.css     # Hlavní styly a vizuální design celé aplikace
│   ├── 📁 icons/         # PWA a webové ikony v různých rozlišeních (16px–512px)
│   ├── 📁 images/
│   │   ├── 📁 social/    # Ikony sociálních sítí (Instagram, Kick)
│   │   └── 📁 sponsors/  # Loga partnerů a sponzorů (Jabkolevne, Lynx)
│   ├── 📁 js/            # Klientské JavaScriptové skripty (běží v prohlížeči)
│   │   ├── admin.js      # Logika a ovládání administrátorského rozhraní
│   │   ├── api.js        # Pomocné funkce pro komunikaci frontendu s backendovým API
│   │   ├── inventory.js  # Načítání a správa osobního inventáře uživatele
│   │   ├── leaderboard.js# Vykreslování a aktualizace žebříčku nejlepších hráčů
│   │   ├── main.js       # Hlavní klientský skript (inicializace aplikace)
│   │   ├── shop.js       # Logika obchodu (zobrazení zboží, nákupy)
│   │   └── ui.js         # Obsluha uživatelského rozhraní (okna, notifikace, modaly)
│   ├── favicon.ico       # Ikona webu pro záložku v prohlížeči
│   └── index.html        # Hlavní HTML stránka webové aplikace
├── 📁 routes/            # Backendové API směrování (Express routery)
│   ├── admin.js          # Zabezpečené endpoiny pro správce (správa uživatelů/shopu)
│   ├── api.js            # Hlavní API endpoiny pro data obchodu, profilu a žebříčku
│   ├── auth.js           # Přihlašování, registrace a autentizace uživatelů
│   └── webhook.js        # Zpracování příchozích událostí z externích služeb (Kick/Donate)
├── package.json          # Definice závislostí, skriptů a metadat Node.js projektu
├── package-lock.json     # Přesný záznam verzí instalovaných knihoven
├── README.md             # Hlavní dokumentace projektu
└── server.js             # Vstupní bod backendu (Express server)
