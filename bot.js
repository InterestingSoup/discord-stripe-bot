const { Client, GatewayIntentBits } = require('discord.js');

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

discordClient.once('ready', () => {
  console.log(`✨ Logged in as ${discordClient.user.tag}`);
});

const assignRoleHandler = async (req, res) => {
  const { discordUsername, role } = req.body;

  if (!discordUsername || !role) {
    return res.status(400).json({ error: 'Missing discordUsername or role' });
  }

  const guild = discordClient.guilds.cache.first();
  if (!guild) {
    return res.status(500).json({ error: 'Guild not found' });
  }

  try {
    await guild.members.fetch();
    const member = guild.members.cache.find(
      (m) => m.user.username.toLowerCase() === discordUsername.toLowerCase()
    );

    if (!member) {
      return res.status(404).json({ error: 'User not found in guild' });
    }

    const roleObj = guild.roles.cache.find(
      (r) => r.name.toLowerCase() === role.toLowerCase()
    );

    if (!roleObj) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await member.roles.add(roleObj);

    const channel = guild.channels.cache.find(
      (ch) => ch.name === 'general' && ch.isTextBased()
    );

    if (channel) {
      await channel.send(
        `🎉 <@${member.user.id}> just became a **${role}**! Welcome!`
      );
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Error assigning role:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  discordClient,
  assignRoleHandler,
};
