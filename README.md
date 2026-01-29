# BagCord - Bags.fm Discord Bot

**A safe, non-custodial Discord bot for interacting with the Bags.fm API**

## 🔒 Security First

**This bot is NOT a custodian. It NEVER:**
- ❌ Holds private keys
- ❌ Stores wallet credentials
- ❌ Executes trades on behalf of users
- ❌ Has access to user funds

**What it DOES:**
- ✅ Fetches read-only analytics data
- ✅ Builds unsigned transactions
- ✅ Returns transactions to users for signing
- ✅ Enforces security guardrails (cooldowns, permissions, confirmations)

## Features

### 📊 Analytics (Safe - Read Only)
- Get token statistics and lifetime fees
- View claim events and history
- Check token creators and deployers
- All analytics are public data with no wallet interaction

### 💱 Trading (Returns Unsigned Transactions)
- Get swap quotes between tokens
- Build unsigned swap transactions
- Users sign in their own wallets
- Token denylist protection against known scams

### 💰 Fee Claiming (Returns Unsigned Transactions)
- Check claimable fee positions
- Build unsigned claim transactions
- Multi-transaction support
- Users maintain full custody

### 🚀 Token Launch (Returns Unsigned Transactions)
- Interactive launch wizard
- Role-based permissions
- Server and user cooldowns
- Two-step confirmation process
- Metadata and image upload support

## Security Features

### Role-Based Permissions
- Configure which roles can use `/launch` command
- Prevents unauthorized token launches
- Protects against spam and abuse

### Cooldowns
- **User Launch Cooldown:** 1 hour per user
- **Server Launch Cooldown:** 10 minutes per server
- **Swap Cooldown:** 30 seconds per user
- **Claim Cooldown:** 1 minute per user

### Token Denylist
- Maintain a list of known scam tokens
- Automatically blocks trades involving denied tokens
- Configurable via environment variables

### Transaction Building in DMs
- All transaction building happens in private DMs
- Reduces phishing risk in public channels
- Users sign transactions privately

### Two-Step Confirmations
- Launch wizard requires explicit confirmation
- Shows preview before transaction building
- Security checklist for user awareness

## Prerequisites

- Node.js 18+ installed
- A Discord Bot Token
- A Bags.fm API Key
- (Optional) Web interface for transaction signing

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Copy the bot token
5. Enable these Privileged Gateway Intents:
   - **SERVER MEMBERS INTENT**
   - **MESSAGE CONTENT INTENT** (required for launch wizard)
6. Go to "OAuth2" > "URL Generator"
7. Select scopes: `bot` and `applications.commands`
8. Select bot permissions:
   - Send Messages
   - Send Messages in Threads
   - Embed Links
   - Attach Files
   - Read Message History
   - Use Slash Commands
9. Copy the generated URL and invite the bot to your server

### 3. Get Bags.fm API Key

1. Visit the [Bags Developer Dashboard](https://bags.fm/developer)
2. Generate an API key
3. Keep it secure (never commit to git)

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Required
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
BAGS_API_KEY=your_bags_fm_api_key

# Optional but recommended
SIGNER_WEB_URL=https://yourdomain.com/sign
LAUNCH_ALLOWED_ROLES=role_id_1,role_id_2
TOKEN_DENYLIST=scam_token_1,scam_token_2
```

#### Getting Role IDs
1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click a role in Server Settings > Roles
3. Click "Copy Role ID"

### 5. Deploy Slash Commands

```bash
node src/deploy-commands.js
```

### 6. Start the Bot

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Available Commands

### Analytics Commands (Safe - Read Only)

#### `/token <mint>`
Get comprehensive token information including fees, stats, and creators.

**Example:**
```
/token mint:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

#### `/fees <mint>`
Get lifetime fees collected for a specific token.

**Example:**
```
/fees mint:So11111111111111111111111111111111111111112
```

#### `/claim-events <mint> [limit]`
Get claim history and events for a token.

**Example:**
```
/claim-events mint:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v limit:10
```

#### `/creators <mint>`
Get the launch creators and deployers for a token.

**Example:**
```
/creators mint:So11111111111111111111111111111111111111112
```

### Trading Commands (Returns Unsigned TX)

#### `/quote <from> <to> <amount> [slippage]`
Get a trade quote for swapping between tokens. Returns a quote ID for use with `/swap`.

**Parameters:**
- `from`: Input token mint address
- `to`: Output token mint address
- `amount`: Amount in SOL (for SOL) or token units
- `slippage`: Optional slippage in basis points (default: 100 = 1%)

**Example:**
```
/quote from:So11111111111111111111111111111111111111112 to:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v amount:1 slippage:100
```

#### `/swap <quote-id> <wallet>`
Build an unsigned swap transaction from a quote. **Use in DMs for security.**

**Parameters:**
- `quote-id`: Quote ID from `/quote` command
- `wallet`: Your wallet address (will sign the transaction)

**Example:**
```
/swap quote-id:quote_1234567890_userid wallet:YourWalletAddress
```

**Security Notes:**
- This command only works in DMs
- Returns unsigned transaction as Base64
- Includes "Sign Transaction" button
- 30-second cooldown between swaps

### Fee Claiming Commands (Returns Unsigned TX)

#### `/claimable <wallet>`
Check all claimable fee positions for a wallet address.

**Example:**
```
/claimable wallet:YourWalletAddress
```

#### `/claim <wallet> [token]`
Build unsigned claim transaction. **Use in DMs for security.**

**Parameters:**
- `wallet`: Your wallet address (will sign the transaction)
- `token`: Optional specific token to claim (leave empty for all)

**Example:**
```
/claim wallet:YourWalletAddress
/claim wallet:YourWalletAddress token:SpecificTokenMint
```

**Security Notes:**
- This command only works in DMs
- Returns unsigned transaction as Base64
- May generate multiple transactions
- 1-minute cooldown between claims

### Token Launch Command (Returns Unsigned TX)

#### `/launch`
Start the interactive token launch wizard. **Requires role permissions.**

**Parameters:**
- `name`: Token name (max 32 characters)
- `symbol`: Token symbol (max 10 characters)
- `description`: Token description
- `image-url`: Token image URL (optional)
- `twitter`: Twitter handle without @ (optional)
- `telegram`: Telegram link (optional)
- `website`: Website URL (optional)

**Example:**
```
/launch name:"My Token" symbol:MTK description:"A cool token" image-url:https://example.com/image.png twitter:mytoken
```

**Launch Process:**
1. Submit initial token details
2. Review preview and confirmation checklist
3. Click "Confirm Launch"
4. Bot moves to DMs for security
5. Provide your creator wallet address
6. Bot builds unsigned launch transaction
7. Sign transaction in your wallet
8. Send transaction to Solana network

**Security Notes:**
- Requires configured role permissions
- 1-hour cooldown per user
- 10-minute cooldown per server
- Two-step confirmation required
- Transaction building in DMs only
- Preview shows all details before building

### Help Command

#### `/help`
Show all available commands and bot information.

## Transaction Signing

The bot returns unsigned transactions as Base64 strings. You have two options to sign:

### Option 1: Web Signer (Recommended)
1. Set up a web interface at `SIGNER_WEB_URL`
2. Bot generates deep links to your signer
3. User clicks "Sign Transaction" button
4. Wallet connects and signs transaction
5. User sends signed transaction

### Option 2: Manual Signing
1. Copy the Base64 transaction from bot
2. Use a Solana wallet or tool to sign
3. Paste transaction into signing interface
4. Send signed transaction manually

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Discord bot token |
| `DISCORD_CLIENT_ID` | Yes | Discord application client ID |
| `BAGS_API_KEY` | Yes | Bags.fm API key |
| `SIGNER_WEB_URL` | No | URL to your transaction signing interface |
| `LAUNCH_ALLOWED_ROLES` | No | Comma-separated role IDs for `/launch` permission |
| `TOKEN_DENYLIST` | No | Comma-separated token mints to block |

### Role Configuration

To restrict `/launch` to specific roles:

1. Get role IDs (Developer Mode > Right-click role > Copy Role ID)
2. Add to `.env`:
   ```env
   LAUNCH_ALLOWED_ROLES=123456789012345678,987654321098765432
   ```
3. Restart the bot

To allow everyone (not recommended in production):
```env
LAUNCH_ALLOWED_ROLES=
```

### Token Denylist

To block known scam tokens:

1. Add token mint addresses to `.env`:
   ```env
   TOKEN_DENYLIST=ScamToken1Mint,ScamToken2Mint
   ```
2. Restart the bot

Users attempting to trade denied tokens will receive an error message.

## Project Structure

```
BagCord/
├── src/
│   ├── api/
│   │   └── bags.js              # Bags.fm API wrapper
│   ├── commands/
│   │   ├── analytics.js         # Read-only analytics commands
│   │   ├── trading.js           # Swap/quote commands
│   │   ├── claim.js             # Fee claiming commands
│   │   ├── launch.js            # Token launch wizard
│   │   └── index.js             # Command aggregator
│   ├── security/
│   │   └── permissions.js       # Security manager (cooldowns, roles, denylist)
│   ├── utils/
│   │   └── transaction.js       # Transaction formatting utilities
│   ├── config.js                # Configuration loader
│   ├── index.js                 # Main bot entry point
│   └── deploy-commands.js       # Slash command deployment
├── .env                         # Environment variables (not in repo)
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore file
├── package.json                 # Dependencies
└── README.md                    # This file
```

## Security Best Practices

### For Bot Operators

1. **Never commit `.env` to version control**
   - API keys and tokens should be kept secret
   - Use `.env.example` as a template only

2. **Configure role permissions for `/launch`**
   - Restrict to trusted roles
   - Monitor launch activity

3. **Maintain token denylist**
   - Add known scam tokens
   - Update regularly

4. **Monitor cooldowns**
   - Ensure they're appropriate for your community
   - Adjust in `src/security/permissions.js` if needed

5. **Run behind HTTPS**
   - If hosting a web signer, use HTTPS only
   - Never transmit transactions over HTTP

6. **Keep dependencies updated**
   ```bash
   npm audit
   npm update
   ```

### For Users

1. **Always verify transaction details**
   - Check token addresses
   - Verify amounts
   - Review what the transaction does

2. **Only sign transactions you understand**
   - If unsure, don't sign
   - Ask questions in your community

3. **Use DMs for transaction building**
   - Never share transactions publicly
   - Prevents phishing

4. **Verify the bot**
   - Ensure you're using the official bot
   - Check bot username and avatar

5. **Enable 2FA on Discord**
   - Protects your account
   - Prevents unauthorized access

## API Rate Limits

The Bags.fm API has the following rate limits:
- 1,000 requests per hour per user
- 1,000 requests per hour per IP

The bot does not implement rate limiting internally. If you hit rate limits, you'll receive error messages.

## Troubleshooting

### Commands not showing up in Discord

Run the deploy script again:
```bash
node src/deploy-commands.js
```

Wait a few minutes for Discord to propagate the commands.

### API errors

- Verify your Bags.fm API key is correct and active
- Check that addresses are in Base58 format (Solana standard)
- Ensure you haven't exceeded rate limits (1,000/hour)

### Bot not responding

- Check the bot is online in your Discord server
- Verify the bot has proper permissions (Send Messages, Use Slash Commands)
- Check console logs for errors
- Ensure `MESSAGE_CONTENT_INTENT` is enabled (for launch wizard)

### "I couldn't send you a DM" error

- Enable DMs from server members: Server Settings > Privacy Settings > Allow direct messages from server members
- If issue persists, check that you haven't blocked the bot

### Launch command not working

- Verify you have a configured role (if `LAUNCH_ALLOWED_ROLES` is set)
- Check if you're on cooldown (1 hour per user)
- Ensure the server isn't on cooldown (10 minutes per server)

### Transaction signing issues

- Verify `SIGNER_WEB_URL` is set correctly
- Ensure your web signer is accessible
- Check that the transaction is in valid Base64 format

## Development

### Running in development mode

```bash
npm run dev
```

This uses Node's `--watch` flag for auto-reload on file changes.

### Testing commands locally

1. Create a test Discord server
2. Invite the bot to the test server
3. Test commands without affecting production

### Extending the bot

To add new commands:

1. Create a new file in `src/commands/` (e.g., `mynewcommand.js`)
2. Export command objects with `data` and `execute` properties
3. Import and add to `src/commands/index.js`
4. Run `node src/deploy-commands.js`

Example:
```javascript
// src/commands/mynewcommand.js
import { SlashCommandBuilder } from 'discord.js';

export const myCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('mycommand')
      .setDescription('My new command'),
    async execute(interaction) {
      await interaction.reply('Hello!');
    }
  }
];

// src/commands/index.js
import { myCommands } from './mynewcommand.js';
export const commands = [...analyticsCommands, ...myCommands, ...];
```

## Resources

- [Bags.fm Documentation](https://docs.bags.fm)
- [Bags.fm API Reference](https://docs.bags.fm/api-reference/introduction)
- [Discord.js Guide](https://discordjs.guide)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Solana Documentation](https://docs.solana.com)

## Contributing

Contributions are welcome! Please ensure:

1. All security best practices are followed
2. No custodial features are added
3. Code is well-documented
4. Testing is performed before submitting PRs

## License

MIT

## Disclaimer

**This bot is provided as-is with no warranties. Users are responsible for:**
- Reviewing all transactions before signing
- Understanding the risks of token launches and trading
- Securing their private keys and wallet credentials
- Complying with local laws and regulations

**The bot developers are not responsible for:**
- Lost funds due to user error
- Bugs in the Bags.fm API
- Malicious tokens or scams
- Financial losses from trading

**Always DYOR (Do Your Own Research) before launching or trading tokens.**
