const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const store = require('../data/store');

const CHAT_INTERVAL_SECONDS = parseInt(process.env.CHAT_INTERVAL_SECONDS || '300', 10);
const POINTS_CHAT = parseInt(process.env.POINTS_PER_CHAT_MESSAGE || '10', 10);
const POINTS_CHAT_SUB = parseInt(process.env.POINTS_PER_CHAT_MESSAGE_SUB || '20', 10);
const POINTS_NEW_SUB = parseInt(process.env.POINTS_PER_NEW_SUB || '100', 10);
const POINTS_GIFTED_SUB = parseInt(process.env.POINTS_PER_GIFTED_SUB || '100', 10);

function verifySignature(req) {
  const signature = req.headers['kick-event-signature'];
  const secret = process.env.KICK_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(req.rawBody || '').digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

router.post('/kick', express.json({
  verify: (req, res, buf) => { req.rawBody = buf; },
}), async (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Neplatný podpis webhooku' });
  }

  const { type, data } = req.body;

  try {
    switch (type) {
      case 'chat.message.sent': {
        const uid = String(data.sender.user_id);
        await store.upsertUser({
          kick_user_id: uid,
          username: data.sender.username,
          avatar_url: data.sender.profile_picture || null,
          is_subscriber: Boolean(data.sender.is_subscriber),
        });

        // Pocet zprav se pocita za kazdou zpravu bez ohledu na interval body.
        await store.incrementMessageCount(uid);

        const bucket = Math.floor(Date.now() / 1000 / CHAT_INTERVAL_SECONDS);
        const isNewInterval = await store.hasChatIntervalPassed(uid, bucket);
        if (!isNewInterval) return res.json({ ok: true, awarded: 0 });

        const amount = data.sender.is_subscriber ? POINTS_CHAT_SUB : POINTS_CHAT;
        await store.addPoints(uid, amount, 'chat_message', { bucket });
        return res.json({ ok: true, awarded: amount });
      }

      case 'channel.subscription.new':
      case 'channel.subscription.renewal': {
        const uid = String(data.subscriber.user_id);
        await store.upsertUser({
          kick_user_id: uid,
          username: data.subscriber.username,
          avatar_url: data.subscriber.profile_picture || null,
          is_subscriber: true,
        });
        await store.addPoints(uid, POINTS_NEW_SUB, 'new_sub');
        return res.json({ ok: true, awarded: POINTS_NEW_SUB });
      }

      case 'channel.subscription.gifts': {
        const uid = String(data.gifter.user_id);
        await store.upsertUser({
          kick_user_id: uid,
          username: data.gifter.username,
          avatar_url: data.gifter.profile_picture || null,
        });
        const quantity = data.quantity || (data.gifted_users ? data.gifted_users.length : 1);
        const amount = POINTS_GIFTED_SUB * quantity;
        await store.addPoints(uid, amount, 'gifted_sub', { quantity });
        return res.json({ ok: true, awarded: amount });
      }

      default:
        return res.json({ ok: true, ignored: type });
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Interní chyba při zpracování eventu' });
  }
});

module.exports = router;
