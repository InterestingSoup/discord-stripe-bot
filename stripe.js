const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { assignVipRole } = require('./bot');
const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { realtime: { transport: ws } }
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
    const { discordUsername } = session.metadata;

    try {
      const result = await assignVipRole(discordUsername);
      console.log(`[BOT] Role assignment result:`, result);
    } catch (err) {
      console.error('❌ Failed to assign the VIP role:', err.message);
    }

    // Invite the new VIP to the CRCMZ App (app.crcmz.me). The app creates their
    // account and sends the branded email; the session id stops a retried
    // webhook from emailing twice.
    const email = session.metadata.email || session.customer_details?.email;
    if (process.env.CRCMZ_APP_URL && process.env.VIP_INVITE_SECRET && email
        && session.payment_status !== 'unpaid') {
      try {
        const response = await fetch(`${process.env.CRCMZ_APP_URL}/api/invites/vip`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Invite-Secret': process.env.VIP_INVITE_SECRET,
          },
          body: JSON.stringify({
            email,
            discordUsername,
            gamerTag: session.metadata.gamerTag,
            platform: session.metadata.platform,
            stripeSessionId: session.id,
            source: 'stripe',
          }),
        });
        console.log('[APP] VIP invite result:', response.status, await response.text());
      } catch (err) {
        console.error('❌ Failed to send the CRCMZ App invite:', err.message);
      }
    }
  }

  res.status(200).send('Webhook received');
};
