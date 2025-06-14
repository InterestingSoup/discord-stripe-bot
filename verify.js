// verify.js
const express = require('express');
const router = express.Router();
const { discordClient } = require('./bot');

router.post('/verify-discord-user', async (req, res) => {
  const { discordUsername } = req.body;

  if (!discordUsername || typeof discordUsername !== 'string') {
    return res.status(400).json({ valid: false, error: 'Missing or invalid username' });
  }

  const guild = discordClient.guilds.cache.first();
  if (!guild) {
    return res.status(500).json({ valid: false, error: 'Guild not found' });
  }

  try {
    await guild.members.fetch(); // Ensure the cache is loaded

    const member = guild.members.cache.find(
      (m) => m.user.username.toLowerCase() === discordUsername.toLowerCase()
    );

    if (member) {
      console.log(`✅ Verified Discord user: ${discordUsername}`);
      return res.status(200).json({ valid: true });
    } else {
      console.warn(`❌ Discord user not found: ${discordUsername}`);
      return res.status(200).json({ valid: false });
    }
  } catch (err) {
    console.error('❌ Error verifying user:', err);
    return res.status(500).json({ valid: false, error: err.message });
  }
});

module.exports = router;

