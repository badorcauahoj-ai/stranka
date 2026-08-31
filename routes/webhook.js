const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const store = require('../data/store');

const CHAT_INTERVAL_SECONDS = parseInt(process.env.CHAT_INTERVAL_SECONDS || '300', 10);
const POINTS_CHAT = parseInt(process.env.POINTS_PER_CHAT_MESSAGE || '10', 10);
const POINTS_CHAT_SUB = parseInt(process.env.POINTS_PER_CHAT_MESSAGE_SUB || '20', 10);
const POINTS_NEW_SUB = parseInt(process.env.POINTS_PER_NEW_SUB || '100', 10);
const POINTS_GIFTED_SUB = parseInt(process.env.POINTS_PER_GIFTED_SUB || '100', 10);

const KICK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq/+l1WnlRrGSolDMA+A8
6rAhMbQGmQ2SapVcGM3zq8ANXjnhDWocMqfWcTd95btDydITa10kDvHzw9WQOqp2
MZI7ZyrfzJuz5nhTPCiJwTwnEtWft7nV14BYRDHvlfqPUaZ+1KR4OCaO/wWIk/rQ
L/TjY0M70gse8rlBkbo2a8rKhu69RQTRsoaf4DVhDPEeSeI5jVrRDGAMGL3cGuyY
6CLKGdjVEM78g3JfYOvDU/RvfqD7L89TZ3iN94jrmWdGz34JNlEI5hqK8dd7C5EF
BEbZ5jgB8s8ReQV8H+MkuffjdAj3ajDDX3DOJMIut1lBrUVD1AaSrGCKHooWoL2e
twIDAQAB
-----END PUBLIC KEY-----`;

function verifySignature(req) {
  const messageId = req.headers['kick-event-message-id'];
  const timestamp = req.headers['kick-event-message-timestamp'];
  const signature = req.headers['kick-event-signature'];

  if (!messageId || !timestamp || !signature || !req.rawBody) {
    console.error('Webhook: chybí data pro ověření podpisu', {
      hasMessageId: Boolean(messageId),
      hasTimestamp: Boolean(timestamp),
      hasSignature: Boolean(signature),
      hasRawBody: Boolean(req.rawBody),
    });
    return false;
  }

  const signedPayload = Buffer.concat([
    Buffer.from(`${messageId}.${timestamp}.`, 'utf8'),
    req.rawBody,
  ]);

  try {
    const valid = crypto.verify(
      'sha256',
      signedPayload,
      { key: KICK_PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(signature, 'base64')
    );
    if (!valid) console.error('Webhook: podpis neodpovídá');
    return valid;
  } catch (err) {
    console.error('Webhook: chyba při ověřování podpisu', err);
    return false;
  }
}

router.post('/kick', async (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Neplatný podpis webhooku' });
  }

  const type = req.headers['kick-event-type'];
const data = req.body;
console.log('Webhook přijat:', type);

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
