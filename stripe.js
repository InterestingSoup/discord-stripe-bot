const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fetch = require('node-fetch');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

module.exports = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Stripe signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { data: existing } = await supabase
    .from('processed_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();

  if (existing) {
    console.log('⚠️ Duplicate event detected:', event.id);
    return res.status(200).send('Already processed');
  }

  await supabase.from('processed_events').insert({ id: event.id });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { discordUsername, role = 'VIP Clan Member' } = session.metadata;

    try {
      const response = await fetch('http://localhost:3000/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordUsername, role })
      });

      const result = await response.json();
      console.log(`[BOT] Role assignment result:`, result);
    } catch (err) {
      console.error('❌ Failed to call /assign-role:', err.message);
    }
  }

  res.status(200).send('Webhook received');
};
