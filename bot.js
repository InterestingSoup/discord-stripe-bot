const { Client, GatewayIntentBits } = require('discord.js');

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

discordClient.once('ready', () => {
  console.log(`✨ Logged in as ${discordClient.user.tag}`);
});

// The only role this bot hands out, and only after a verified Stripe payment.
// This used to be a public POST /assign-role taking any username and any role
// name, so anyone could grant themselves VIP (or any role below the bot's)
// without paying. It is now a plain function that only stripe.js calls.
const VIP_ROLE = 'VIP Clan Member';

const assignVipRole = async (discordUsername) => {
  if (!discordUsername) {
    return { ok: false, error: 'Missing discordUsername' };
  }

  const guild = discordClient.guilds.cache.first();
  if (!guild) {
    return { ok: false, error: 'Guild not found' };
  }

  await guild.members.fetch();
  const member = guild.members.cache.find(
    (m) => m.user.username.toLowerCase() === discordUsername.toLowerCase()
  );

  if (!member) {
    console.error(`❌ Member not found for username: ${discordUsername}`);
    return { ok: false, error: 'User not found in guild' };
  }

  const roleObj = guild.roles.cache.find(
    (r) => r.name.toLowerCase() === VIP_ROLE.toLowerCase()
  );

  if (!roleObj) {
    console.error(`❌ Role not found: ${VIP_ROLE}`);
    return { ok: false, error: 'Role not found' };
  }

  await member.roles.add(roleObj);
  console.log(`✅ Role "${VIP_ROLE}" assigned to ${discordUsername}`);

  // Find a valid text channel the bot has permission to send messages in
  const channel = guild.channels.cache.get('1223856559990509612');
  if (channel && channel.isTextBased() && channel.permissionsFor(guild.members.me).has('SendMessages')) {
    await channel.send(
      `🎉 <@${member.user.id}> just became a **${roleObj.name}**! Welcome to the elite.`
    );
    console.log(`📣 Sent welcome message in #${channel.name}`);
  } else {
    console.warn("⚠️ Could not access the channel or lack send permissions.");
  }

  return { ok: true };
};

module.exports = {
  discordClient,
  assignVipRole,
};
