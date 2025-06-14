# Discord Stripe Bot

Automatically assigns a Discord role to users who complete a Stripe Checkout payment.

## Features
- Stripe webhook verification
- Supabase event deduplication
- Discord role assignment
- Health check endpoint

## Setup

1. **Create a `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Fill in all required keys.

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run locally:**
   ```bash
   npm start
   ```

4. **Deploy to Coolify:**
   - Connect your GitHub repo.
   - Set build command to `npm install`.
   - Set start command to `node server.js`.

## Endpoints
- `POST /stripe-webhook` → Stripe will call this.
- `POST /assign-role` → Internal call from webhook.
- `GET /health` → For uptime checks.

## Notes
- Discord bot must be in the server and have permission to assign roles.
- Ensure the role exists and the bot is **above the target role** in the Discord role hierarchy.
# discord-stripe-bot
# discord-stripe-bot
