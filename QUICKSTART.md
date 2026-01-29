# Quick Start Guide

Get BagCord running in 5 minutes.

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- Discord account
- Bags.fm API key ([Get one](https://bags.fm/developer))

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Discord Bot

1. Go to https://discord.com/developers/applications
2. Click **"New Application"**
3. Name it (e.g., "BagCord")
4. Go to **"Bot"** section → Click **"Add Bot"**
5. Copy the bot token (keep it secret!)
6. Enable these intents:
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT
7. Go to **"OAuth2"** → **"URL Generator"**
8. Select scopes: `bot`, `applications.commands`
9. Select permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`
10. Copy the URL and open it to invite bot to your server

### 3. Configure Environment

```bash
cp .env.example .env
nano .env  # or use your favorite editor
```

Add your credentials:

```env
DISCORD_TOKEN=your_bot_token_from_step_2
DISCORD_CLIENT_ID=your_client_id_from_discord
BAGS_API_KEY=your_bags_fm_api_key
```

**Where to find Client ID:**
- Discord Developer Portal → Your Application → Copy "Application ID"

### 4. Deploy Commands

```bash
node src/deploy-commands.js
```

You should see:
```
✅ Successfully reloaded X application (/) commands.
```

### 5. Start Bot

```bash
npm start
```

You should see:
```
╔══════════════════════════════════════════╗
║          🤖 BagCord Bot Ready           ║
╚══════════════════════════════════════════╝

✅ Logged in as: YourBot#1234
🌐 Serving 1 servers
📊 12 commands loaded
```

### 6. Test It!

In your Discord server, try:

```
/help
```

You should see a help message with all commands.

Try a safe read-only command:

```
/token mint:So11111111111111111111111111111111111111112
```

You should see SOL token information.

## Done! 🎉

Your bot is now running and ready to use.

## Optional Configuration

### Restrict Launch Command to Specific Roles

1. Get role ID:
   - Discord → Enable Developer Mode (Settings → Advanced)
   - Server Settings → Roles → Right-click role → Copy Role ID

2. Add to `.env`:
   ```env
   LAUNCH_ALLOWED_ROLES=123456789012345678,987654321098765432
   ```

3. Restart bot

### Add Token Denylist (Scam Protection)

Add known scam tokens to `.env`:

```env
TOKEN_DENYLIST=ScamToken1Mint,ScamToken2Mint
```

Restart bot.

### Set Up Web Signer (Optional)

1. Host `web-signer-example.html` on your domain (HTTPS required)
2. Add to `.env`:
   ```env
   SIGNER_WEB_URL=https://yourdomain.com/sign.html
   ```
3. Restart bot

Users will now get a "Sign Transaction" button that opens your web signer.

## Common Issues

### "Commands not showing up"

Wait 5-10 minutes for Discord to sync, then try:

```bash
node src/deploy-commands.js
```

### "Bot not responding"

Check console for errors. Ensure:
- Bot is online in your server
- Bot has permissions (Send Messages, Use Slash Commands)
- MESSAGE_CONTENT_INTENT is enabled

### "I couldn't send you a DM"

User needs to enable DMs:
- Server Settings → Privacy Settings → Allow direct messages from server members

### "API errors"

Verify:
- Bags.fm API key is correct
- You haven't hit rate limits (1,000/hour)
- Addresses are in Base58 format

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Review [SECURITY.md](SECURITY.md) for security best practices
- Join Bags.fm community for support

## Development Mode

For auto-reload during development:

```bash
npm run dev
```

## Production Deployment

Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start src/index.js --name bagcord
pm2 save
pm2 startup
```

## Support

- [Bags.fm Documentation](https://docs.bags.fm)
- [Discord.js Guide](https://discordjs.guide)
- [Issues](https://github.com/yourusername/bagcord/issues)

---

**Remember:** This bot never holds private keys. Users always sign transactions in their own wallets. Stay safe! 🔒
