# BagCord Coolify Deployment Guide

This guide will walk you through deploying the BagCord Discord bot to your Coolify instance at `cool.howieduhzit.best`.

## Prerequisites

- Coolify instance running at `cool.howieduhzit.best`
- Discord bot token and client ID
- Bags.fm API key
- Git repository (recommended) or local deployment capability

## Deployment Options

### Option 1: Deploy from Git Repository (Recommended)

1. **Push your code to a Git repository** (GitHub, GitLab, etc.)
   ```bash
   cd /home/howie/Documents/BagCord
   git init
   git add .
   git commit -m "Initial commit: BagCord bot"
   git remote add origin <your-git-repo-url>
   git push -u origin main
   ```

2. **Create a new service in Coolify:**
   - Go to `https://cool.howieduhzit.best`
   - Click "New Resource" → "Docker Compose"
   - Select your Git repository
   - Coolify will detect the `docker-compose.yml` file

3. **Configure environment variables in Coolify UI:**
   - Navigate to your service's "Environment Variables" section
   - Add the following required variables:
     ```
     DISCORD_TOKEN=<your_discord_bot_token>
     DISCORD_CLIENT_ID=<your_discord_client_id>
     BAGS_API_KEY=<your_bags_fm_api_key>
     ```

   - Optional variables:
     ```
     SIGNER_WEB_URL=<your_transaction_signer_url>
     LAUNCH_ALLOWED_ROLES=<comma_separated_role_ids>
     TOKEN_DENYLIST=<comma_separated_token_addresses>
     ```

4. **Deploy:**
   - Click "Deploy" in the Coolify UI
   - Monitor the build logs to ensure successful deployment

### Option 2: Deploy with Coolify API

You can also deploy using the Coolify API with your API key.

```bash
# Example: Create deployment via API
curl -X POST https://cool.howieduhzit.best/api/v1/deploy \
  -H "Authorization: Bearer YOUR_COOLIFY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "bagcord",
    "environment_variables": {
      "DISCORD_TOKEN": "your_token_here",
      "DISCORD_CLIENT_ID": "your_client_id_here",
      "BAGS_API_KEY": "your_api_key_here"
    }
  }'
```

## Important Notes

### Non-HTTP Service Configuration

BagCord is a Discord gateway bot that does NOT expose any HTTP ports. This is important for Coolify configuration:

- **No reverse proxy needed**: The bot connects to Discord's gateway, not the other way around
- **No domain needed**: Unlike web services, you don't need to configure a domain
- **Health checks**: The bot uses process-based health checks instead of HTTP endpoints

### Environment Variables

All environment variables should be configured through Coolify's UI or API:

#### Required Variables:
- `DISCORD_TOKEN` - Your Discord bot token from the Discord Developer Portal
- `DISCORD_CLIENT_ID` - Your Discord application's client ID
- `BAGS_API_KEY` - API key for Bags.fm service

#### Optional Variables:
- `SIGNER_WEB_URL` - URL where users will sign transactions (default: https://example.com/sign)
- `LAUNCH_ALLOWED_ROLES` - Comma-separated Discord role IDs that can use /launch command
- `TOKEN_DENYLIST` - Comma-separated token addresses to block (security feature)

### Monitoring

Since this is a non-HTTP service, you'll monitor it differently:

1. **Container logs**: Check Coolify's log viewer for bot activity
2. **Process health**: The health check verifies the Node.js process is running
3. **Discord status**: Verify the bot appears online in your Discord server

### Resource Configuration

The default configuration allocates:
- **Memory limit**: 512MB
- **Memory reservation**: 256MB
- **CPU limit**: 0.5 cores
- **CPU reservation**: 0.25 cores

Adjust these in the `docker-compose.yml` if needed based on your server's load.

## Post-Deployment Steps

1. **Register slash commands:**
   After first deployment, you may need to register Discord slash commands:
   ```bash
   # SSH into your Coolify server
   docker exec -it bagcord-bot npm run deploy-commands
   ```

   Note: Check if `src/deploy-commands.js` has a corresponding npm script.

2. **Verify bot is online:**
   - Check your Discord server to see if the bot appears online
   - Try running `/claim` or other commands

3. **Monitor logs:**
   - In Coolify UI, view the logs to see the startup message
   - You should see: "🤖 BagCord Bot Ready"

## Troubleshooting

### Bot doesn't come online
- Check environment variables are set correctly
- Verify DISCORD_TOKEN is valid and not expired
- Check logs for authentication errors

### Commands not working
- Ensure slash commands are registered (see Post-Deployment Steps)
- Check bot has proper permissions in Discord server
- Verify DISCORD_CLIENT_ID matches your application

### Memory issues
- Increase memory limits in docker-compose.yml
- Monitor logs for out-of-memory errors

### API errors
- Verify BAGS_API_KEY is valid
- Check network connectivity from Coolify to Bags.fm API
- Review logs for specific API error messages

## Updating the Bot

To update the bot after making changes:

1. **If using Git:**
   ```bash
   git add .
   git commit -m "Update bot code"
   git push
   ```
   Then trigger a redeploy in Coolify UI

2. **If using local deployment:**
   - Update your files
   - Redeploy through Coolify UI

## Security Best Practices

1. **Never commit sensitive data**: Keep `.env` in `.gitignore`
2. **Use Coolify's secret management**: Store tokens as encrypted secrets
3. **Regular updates**: Keep dependencies updated for security patches
4. **Monitor logs**: Watch for suspicious activity or errors
5. **Use role restrictions**: Configure `LAUNCH_ALLOWED_ROLES` in production

## Support

For issues specific to:
- **BagCord bot**: Check application logs and Discord API status
- **Coolify deployment**: Consult Coolify documentation or your instance admin
- **Discord.js**: Reference Discord.js v14 documentation

---

**Your Coolify Instance**: https://cool.howieduhzit.best
