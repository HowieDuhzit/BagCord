# Security Policy

## Non-Custodial Architecture

**BagCord is designed to be completely non-custodial.**

### What This Means

The bot:
- ✅ Fetches public analytics data
- ✅ Builds unsigned transactions
- ✅ Returns transactions to users
- ❌ NEVER holds private keys
- ❌ NEVER stores wallet credentials
- ❌ NEVER executes transactions on behalf of users
- ❌ NEVER has access to user funds

### How It Works

1. **User requests action** (e.g., swap, claim, launch)
2. **Bot builds unsigned transaction** using Bags.fm API
3. **Bot returns Base64 transaction** to user via DM
4. **User signs transaction** in their own wallet
5. **User sends transaction** to Solana network

**The bot is never involved in steps 4-5.**

## Security Features

### 1. Role-Based Access Control

Token launches can be restricted to specific Discord roles:

```env
LAUNCH_ALLOWED_ROLES=role_id_1,role_id_2,role_id_3
```

**Why:** Prevents spam launches and abuse by untrusted users.

**How to configure:**
1. Enable Developer Mode in Discord
2. Right-click role → Copy Role ID
3. Add to `.env` file
4. Restart bot

### 2. Rate Limiting & Cooldowns

Built-in cooldowns prevent abuse:

| Command | User Cooldown | Server Cooldown |
|---------|--------------|-----------------|
| `/launch` | 1 hour | 10 minutes |
| `/swap` | 30 seconds | N/A |
| `/claim` | 1 minute | N/A |

**Why:** Prevents spam, reduces API costs, protects against abuse.

**Customization:** Edit `src/security/permissions.js` to adjust cooldowns.

### 3. Token Denylist

Block known scam tokens from being traded:

```env
TOKEN_DENYLIST=ScamToken1Mint,ScamToken2Mint,ScamToken3Mint
```

**Why:** Protects users from known malicious tokens.

**Maintenance:** Regularly update with known scam tokens.

**Runtime management:**
```javascript
// Add token to denylist
securityManager.addToTokenDenylist('TokenMintAddress');

// Remove token from denylist
securityManager.removeFromTokenDenylist('TokenMintAddress');
```

### 4. Transaction Building in DMs

Commands that build transactions (`/swap`, `/claim`, `/launch`) only work in DMs:

**Why:**
- Prevents phishing in public channels
- Keeps user transactions private
- Reduces social engineering attacks

**User Flow:**
1. User runs command in server
2. Bot sends DM notification
3. User runs command in DM
4. Bot builds transaction privately

### 5. Two-Step Confirmations

Launch wizard requires explicit confirmation:

1. User submits token details
2. Bot shows preview with security checklist
3. User clicks "Confirm Launch"
4. Bot requests wallet address
5. Bot builds transaction

**Why:** Gives users time to review before committing.

### 6. Address Validation

All Solana addresses are validated:

```javascript
TransactionBuilder.isValidSolanaAddress(address)
```

**Checks:**
- Valid Base58 format
- Correct length (32-44 characters)
- Only valid Base58 characters

**Why:** Prevents invalid addresses from causing errors or exploits.

### 7. Input Sanitization

All user inputs are validated:

- Token symbols: Max 10 characters
- Token names: Max 32 characters
- Amounts: Must be positive numbers
- Slippage: Must be valid integer

**Why:** Prevents injection attacks and API errors.

### 8. No API Key Exposure

API keys are stored server-side only:

```javascript
// ✅ CORRECT - Server-side only
headers: {
  'x-api-key': config.bagsApiKey
}

// ❌ WRONG - Never expose in client
<script>const apiKey = 'YOUR_API_KEY';</script>
```

**Why:** Prevents unauthorized API access and abuse.

## Threat Model

### What We Protect Against

| Threat | Protection |
|--------|-----------|
| Private key theft | Bot never touches private keys |
| Unauthorized launches | Role-based permissions |
| Spam/abuse | Cooldowns + rate limits |
| Scam tokens | Token denylist |
| Phishing in public channels | DM-only transaction building |
| Social engineering | Two-step confirmations |
| Invalid addresses | Address validation |
| API abuse | Server-side API key storage |

### What We DON'T Protect Against

| Threat | User Responsibility |
|--------|---------------------|
| User signing malicious transaction | User must review transaction |
| User sharing private keys | User must keep keys secure |
| Compromised user wallet | User must secure wallet |
| User error in transaction review | User must understand transactions |

## Best Practices for Operators

### 1. Environment Security

```bash
# ✅ GOOD - Secure .env file
chmod 600 .env
echo ".env" >> .gitignore

# ❌ BAD - Committing secrets
git add .env
```

### 2. API Key Rotation

- Rotate API keys regularly (quarterly recommended)
- Immediately rotate if compromised
- Use separate keys for dev/staging/production

### 3. Role Configuration

```env
# ✅ GOOD - Specific trusted roles
LAUNCH_ALLOWED_ROLES=123456789,987654321

# ❌ BAD - Empty (allows everyone)
LAUNCH_ALLOWED_ROLES=
```

### 4. Token Denylist Maintenance

- Monitor for new scam tokens
- Add to denylist promptly
- Subscribe to Solana security feeds
- Review community reports

### 5. Monitoring

Log and monitor:
- Failed authentication attempts
- Unusual cooldown patterns
- API rate limit hits
- Error rates

### 6. Updates

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Review changelogs
npm outdated
```

### 7. Deployment

- Use HTTPS for all endpoints
- Deploy web signer on secure domain
- Enable rate limiting at reverse proxy
- Use process manager (PM2, systemd)

## Best Practices for Users

### 1. Transaction Review

**Before signing, verify:**
- ✅ Token addresses match expectations
- ✅ Amounts are correct
- ✅ Action is what you intended
- ✅ Slippage is acceptable

**Never sign if:**
- ❌ Addresses look unfamiliar
- ❌ Amounts seem wrong
- ❌ Action is unclear
- ❌ You don't understand the transaction

### 2. Wallet Security

- ✅ Use hardware wallet when possible
- ✅ Enable wallet transaction confirmation
- ✅ Review wallet prompts carefully
- ❌ Never share seed phrase
- ❌ Never share private keys
- ❌ Never screenshot seed phrase

### 3. Discord Security

- ✅ Enable 2FA on Discord
- ✅ Verify bot identity
- ✅ Check bot permissions
- ❌ Don't accept DMs from fake bots
- ❌ Don't share transaction details publicly

### 4. Scam Awareness

**Red flags:**
- Bot asking for private keys
- Bot asking for seed phrase
- Bot requesting to "hold" funds
- Promises of guaranteed returns
- Pressure to act quickly
- Unsolicited DMs about tokens

**If something feels wrong, STOP and ask questions.**

## Incident Response

### If API Key is Compromised

1. **Immediately revoke** the compromised key
2. **Generate new** API key at Bags.fm dashboard
3. **Update** `.env` with new key
4. **Restart** the bot
5. **Monitor** for unusual activity
6. **Review** logs for unauthorized access

### If Bot Token is Compromised

1. **Immediately regenerate** token in Discord Developer Portal
2. **Update** `.env` with new token
3. **Restart** the bot
4. **Check** bot permissions in all servers
5. **Notify** server admins if needed

### If User Reports Malicious Transaction

1. **Do not panic** - the bot cannot force users to sign
2. **Verify** the transaction was built by your bot
3. **Check** logs for suspicious activity
4. **Add token** to denylist if it's a scam
5. **Warn** other users in the community
6. **Document** the incident

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public GitHub issue
2. **Contact** the bot maintainer privately
3. **Provide** detailed description and reproduction steps
4. **Wait** for confirmation before disclosing publicly

## Compliance

### GDPR

The bot:
- Does not store personal data
- Does not track user activity
- Does not share data with third parties
- Only processes data necessary for operation

### Financial Regulations

The bot:
- Is not a custodian
- Does not execute trades
- Does not provide financial advice
- Is a tool for users to build transactions

**Users are responsible for their own trading decisions and regulatory compliance.**

## Disclaimer

This bot is provided "as-is" without warranties. Security cannot be guaranteed. Users must:
- Review all transactions before signing
- Understand the risks of DeFi and token trading
- Take responsibility for their own security
- Comply with local laws and regulations

**The bot developers are not responsible for:**
- User errors
- Lost funds
- Malicious tokens
- Bugs in third-party services
- Regulatory compliance issues

**Always DYOR (Do Your Own Research).**
