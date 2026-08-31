const express = require('express');
const crypto = require('crypto');
const fetch = require('node-fetch');
const router = express.Router();
const store = require('../data/store');

const KICK_AUTH_URL = 'https://id.kick.com/oauth/authorize';
const KICK_TOKEN_URL = 'https://id.kick.com/oauth/token';
const KICK_API_BASE = 'https://api.kick.com/public/v1';

// Krok 1: presmerovani na Kick, at uzivatel odsouhlasi pristup
router.get('/kick/login', (req, res) => {
  if (!process.env.KICK_CLIENT_ID) {
    return res.status(500).send('Kick OAuth zatím není nakonfigurovaný (chybí KICK_CLIENT_ID v .env).');
  }

  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  req.session.oauth_state = state;
  req.session.code_verifier = codeVerifier;

  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const params = new URLSearchParams({
    client_id: process.env.KICK_CLIENT_ID,
    redirect_uri: process.env.KICK_REDIRECT_URI,
    response_type: 'code',
    scope: 'user:read chat:read channel:read events:subscribe',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  res.redirect(`${KICK_AUTH_URL}?${params.toString()}`);
});

// Krok 2: Kick presmeruje zpet s "code"
router.get('/kick/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || state !== req.session.oauth_state) {
    return res.status(400).send('Neplatný stav OAuth. Zkus se přihlásit znovu.');
  }

  try {
    const tokenRes = await fetch(KICK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KICK_CLIENT_ID,
        client_secret: process.env.KICK_CLIENT_SECRET,
        redirect_uri: process.env.KICK_REDIRECT_URI,
        code,
        code_verifier: req.session.code_verifier,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Kick token error:', tokenData);
      return res.status(500).send('Nepodařilo se získat token od Kicku.');
    }

    // ULOŽ TOKEN DO SESSION - potřebujeme ho pro /kick/subscribe-webhooks
    req.session.access_token = tokenData.access_token;

    const userRes = await fetch(`${KICK_API_BASE}/users`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();
    const kickUser = userData?.data?.[0] || userData?.data || {};

    const user = await store.upsertUser({
      kick_user_id: String(kickUser.user_id || kickUser.id),
      username: kickUser.name || kickUser.username || 'Neznámý',
      avatar_url: kickUser.profile_picture || null,
    });

    req.session.user_id = user.kick_user_id;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Chyba při přihlášení přes Kick.');
  }
});

// NOVÁ ROUTE - spustíš RUČNĚ JEDNOU, jako ty (broadcaster), po přihlášení.
// Vytvoří webhook subscription u Kicku pro tvůj kanál.
router.get('/kick/subscribe-webhooks', async (req, res) => {
  if (!req.session.user_id || !req.session.access_token) {
    return res.status(401).send('Musíš být přihlášený jako broadcaster (přes /api/auth/kick/login).');
  }

  try {
    const subRes = await fetch(`${KICK_API_BASE}/events/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${req.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        broadcaster_user_id: Number(req.session.user_id),
        events: [
          { name: 'chat.message.sent', version: 1 },
          { name: 'channel.subscription.new', version: 1 },
          { name: 'channel.subscription.renewal', version: 1 },
          { name: 'channel.subscription.gifts', version: 1 },
        ],
        method: 'webhook',
      }),
    });
    const data = await subRes.json();
    console.log('Kick subscription result:', JSON.stringify(data));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Chyba při vytváření subscription.');
  }
});

router.get('/logout', (req, res) => {
  req.session.user_id = null;
  req.session.access_token = null;
  res.redirect('/');
});

module.exports = router;
