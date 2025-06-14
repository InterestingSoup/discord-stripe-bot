const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://bot.crcmz.me");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { discordUsername, platform, gamerTag, email } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1RUqK2DiAgUsVuQ6FE8odQce',
          quantity: 1,
        },
      ],
      metadata: {
        discordUsername,
        platform,
        gamerTag,
        email,
      },
      success_url: 'https://crcmz.me/success',
      cancel_url: 'https://crcmz.me/cancel',
    });

    return res.status(200).json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('Stripe Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


