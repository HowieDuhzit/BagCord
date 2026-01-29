import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { analyticsCommands } from './analytics.js';
import { tradingCommands } from './trading.js';
import { claimCommands } from './claim.js';
import { launchCommands } from './launch.js';

const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands and bot information'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🤖 BagCord - Bags.fm Discord Bot')
      .setDescription('**A safe, non-custodial bot for Bags.fm API**\n\n🔒 This bot NEVER holds private keys or executes trades for you.\nIt only fetches data and builds unsigned transactions for you to sign.')
      .addFields(
        {
          name: '📊 Analytics Commands (Safe - Read Only)',
          value: '`/token <mint>` - Get detailed token info\n`/fees <mint>` - Get lifetime fees\n`/claim-events <mint>` - Get claim history\n`/creators <mint>` - Get launch creators',
          inline: false
        },
        {
          name: '💱 Trading Commands (Returns Unsigned TX)',
          value: '`/quote <from> <to> <amount>` - Get trade quote\n`/swap <quote-id> <wallet>` - Build swap transaction\n\n⚠️ Use in DMs for security',
          inline: false
        },
        {
          name: '💰 Fee Claiming (Returns Unsigned TX)',
          value: '`/claimable <wallet>` - Check claimable positions\n`/claim <wallet>` - Build claim transaction\n\n⚠️ Use in DMs for security',
          inline: false
        },
        {
          name: '🚀 Token Launch (Returns Unsigned TX)',
          value: '`/launch` - Start token launch wizard\n\n⚠️ Requires role permissions\n⚠️ Has cooldowns to prevent spam',
          inline: false
        },
        {
          name: '🔒 Security Features',
          value: '• All addresses validated (Base58)\n• Token denylist (scam protection)\n• Role-based permissions for launch\n• Cooldowns (user + server)\n• Two-step confirmations\n• Transaction building in DMs only',
          inline: false
        },
        {
          name: '📝 How Transactions Work',
          value: '1. Bot builds unsigned transaction\n2. You receive Base64 transaction\n3. You sign in YOUR wallet (not the bot)\n4. You send the transaction\n\n**The bot NEVER has access to your private keys**',
          inline: false
        }
      )
      .setFooter({ text: 'Powered by Bags.fm API | Non-custodial & Safe' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

export const commands = [
  ...analyticsCommands,
  ...tradingCommands,
  ...claimCommands,
  ...launchCommands,
  helpCommand
];
