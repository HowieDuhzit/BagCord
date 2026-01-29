import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Discord configuration
  discordToken: process.env.DISCORD_TOKEN,
  discordClientId: process.env.DISCORD_CLIENT_ID,

  // Bags.fm API configuration
  bagsApiKey: process.env.BAGS_API_KEY,
  bagsApiBaseUrl: 'https://public-api-v2.bags.fm/api/v1',

  // Web signer URL (for transaction signing)
  // This should point to your web interface where users sign transactions
  signerWebUrl: process.env.SIGNER_WEB_URL || 'https://example.com/sign',

  // Security: Launch command role restrictions
  // Add Discord role IDs that are allowed to use /launch command
  // Leave empty to allow everyone (not recommended)
  launchAllowedRoles: process.env.LAUNCH_ALLOWED_ROLES
    ? process.env.LAUNCH_ALLOWED_ROLES.split(',')
    : [],

  // Security: Token denylist (known scam tokens)
  // Add token mint addresses that should be blocked
  tokenDenylist: process.env.TOKEN_DENYLIST
    ? process.env.TOKEN_DENYLIST.split(',')
    : []
};
