const express = require('express');
const stripeHandler = require('./stripe');
const { assignRoleHandler, discordClient } = require('./bot');
require('dotenv').config();

const app = express();

app.use('/stripe-webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.post('/stripe-webhook', stripeHandler);
app.post('/assign-role', assignRoleHandler);
app.get('/health', (req, res) => {
  if (discordClient.readyTimestamp) {
    res.status(200).send('Bot is ready');
  } else {
    res.status(503).send('Bot is not ready');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);
