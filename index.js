const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ADMIN_ID = process.env.ADMIN_ID;
const WEB_URL = process.env.WEB_URL;

let users = [];

const sendMessage = async (chatId, text, buttons) => {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: buttons
    }
  };
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

app.post('/webhook', async (req, res) => {
  const message = req.body.message;
  if (!message) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text;

  if (!users.includes(chatId)) {
    users.push(chatId);
    await sendMessage(ADMIN_ID, `Täze ulanyjy goşuldy: ${chatId}`, []);
  }

  if (text === "/start") {
    await sendMessage(chatId, "Kanalymyza agza boluň:", [
      [{ text: "Agza bolmak", url: `https://t.me/${CHANNEL_ID.replace('@', '')}` }],
      [{ text: "Agza boldum", callback_data: "joined" }]
    ]);
  }
  
  res.sendStatus(200);
});

app.post('/webhook/callback', async (req, res) => {
  const callbackQuery = req.body.callback_query;
  if (!callbackQuery) return res.sendStatus(200);

  const chatId = callbackQuery.from.id;
  const data = callbackQuery.data;

  if (data === "joined") {
    await sendMessage(chatId, "Habarlary oka:", [
      [{ text: "Saýta gir", url: WEB_URL }]
    ]);
  }

  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('Bot işläp dur!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server başlady PORT: ${PORT}`);
});

// Admin üçin habar ugratmak
app.get('/send-news', async (req, res) => {
  const secret = req.query.secret;
  const text = req.query.text || "Täze habar goşuldy!";

  if (secret !== ADMIN_ID) return res.status(403).send("Rugsat ýok");

  for (const userId of users) {
    await sendMessage(userId, text, [
      [{ text: "Habary oka", url: WEB_URL }]
    ]);
  }
  
  res.send('Habarlar ugradyldy!');
});
