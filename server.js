require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET || 'dev-secret-zmen-v-produkci',
  maxAge: 30 * 24 * 60 * 60 * 1000,
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/webhooks', require('./routes/webhook'));
app.use('/api', require('./routes/api'));

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`tyblaho69 KK server běží na http://localhost:${PORT}`));
