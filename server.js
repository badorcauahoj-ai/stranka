require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const { initSchema } = require('./db/pool');

const app = express();

app.use(express.json({
  // Obrázky výher se posílají jako base64 přímo v JSON těle (žádný
  // souborový storage), takže defaultní limit Expressu (100kb) by
  // u větších fotek padal na PayloadTooLargeError. Multer dovoluje
  // soubor do 3 MB, base64 z něj je zhruba o třetinu větší, takže
  // dáváme rezervu na 5 MB.
  limit: '5mb',
  verify: (req, res, buf) => { req.rawBody = buf; },
}));
app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET || 'CO TI JE DO TOHO KARECKU',
  maxAge: 30 * 24 * 60 * 60 * 1000,
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/webhooks', require('./routes/webhook'));
app.use('/api', require('./routes/api'));

app.use(express.static(path.join(__dirname, 'public')));

// Jednotné zpracování chyb z async routes (viz `next(err)` v routes/*.js)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Interní chyba serveru' });
});

const PORT = process.env.PORT || 3000;

initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`tyblaho69 KK server běží na http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Nepodařilo se inicializovat databázi:', err);
    process.exit(1);
  });
