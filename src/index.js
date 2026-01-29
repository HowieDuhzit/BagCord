import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from './config.js';
import { commands } from './commands/index.js';
import { handleLaunchButtons } from './commands/launch.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: ['CHANNEL'] // Required for DM support
});

client.commands = new Collection();

for (const command of commands) {
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║                                          ║');
  console.log('║          🤖 BagCord Bot Ready           ║');
  console.log('║                                          ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log();
  console.log(`✅ Logged in as: ${client.user.tag}`);
  console.log(`🌐 Serving ${client.guilds.cache.size} servers`);
  console.log(`📊 ${commands.length} commands loaded`);
  console.log();
  console.log('🔒 Security Features:');
  console.log('   • Non-custodial (never holds private keys)');
  console.log('   • Role-based launch permissions');
  console.log('   • User & server cooldowns');
  console.log('   • Transaction building in DMs');
  console.log('   • Token denylist protection');
  console.log();
  console.log('📝 Ready to build unsigned transactions!');
  console.log();
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('Error executing command:', error);

      const errorMessage = '❌ There was an error executing this command!';

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }

  // Handle button interactions (for launch wizard)
  if (interaction.isButton()) {
    try {
      await handleLaunchButtons(interaction);
    } catch (error) {
      console.error('Error handling button interaction:', error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ There was an error processing this action.',
          ephemeral: true
        });
      }
    }
  }
});

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Login
client.login(config.discordToken).catch(error => {
  console.error('Failed to login:', error);
  process.exit(1);
});
