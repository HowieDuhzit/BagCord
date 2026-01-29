import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { BagsAPI } from '../api/bags.js';
import { TransactionBuilder } from '../utils/transaction.js';
import { securityManager } from '../security/permissions.js';

// Store launch data temporarily (in production, use Redis or similar)
const launchWizardStore = new Map();

export const launchCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('launch')
      .setDescription('Start token launch wizard (requires permissions)')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Token name')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('symbol')
          .setDescription('Token symbol')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('description')
          .setDescription('Token description')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('image-url')
          .setDescription('Token image URL')
          .setRequired(false)
      )
      .addStringOption(option =>
        option.setName('twitter')
          .setDescription('Twitter handle (without @)')
          .setRequired(false)
      )
      .addStringOption(option =>
        option.setName('telegram')
          .setDescription('Telegram link')
          .setRequired(false)
      )
      .addStringOption(option =>
        option.setName('website')
          .setDescription('Website URL')
          .setRequired(false)
      ),
    async execute(interaction) {
      // SECURITY CHECK 1: Role permissions
      if (!securityManager.canUseLaunchCommand(interaction.member)) {
        await interaction.reply({
          content: '❌ You don\'t have permission to use this command. Contact a server admin.',
          ephemeral: true
        });
        return;
      }

      // SECURITY CHECK 2: User cooldown
      const userCooldown = securityManager.checkCooldown(interaction.user.id, 'launch');
      if (!userCooldown.allowed) {
        await interaction.reply({
          content: `⏳ Launch cooldown active. Please wait ${securityManager.formatTimeRemaining(userCooldown.timeRemaining)}`,
          ephemeral: true
        });
        return;
      }

      // SECURITY CHECK 3: Server cooldown
      if (!interaction.channel.isDMBased()) {
        const serverCooldown = securityManager.checkServerLaunchCooldown(interaction.guildId);
        if (!serverCooldown.allowed) {
          await interaction.reply({
            content: `⏳ Server launch cooldown active. Please wait ${securityManager.formatTimeRemaining(serverCooldown.timeRemaining)}`,
            ephemeral: true
          });
          return;
        }
      }

      // SECURITY: Move to DMs for actual transaction building
      if (!interaction.channel.isDMBased()) {
        await interaction.reply({
          content: '🔒 For security, I\'ll continue the launch process in your DMs.',
          ephemeral: true
        });

        try {
          await interaction.user.send('Let\'s continue your token launch here...');
        } catch (error) {
          await interaction.followUp({
            content: '❌ I couldn\'t send you a DM. Please enable DMs from server members and try again.',
            ephemeral: true
          });
          return;
        }
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const tokenData = {
          name: interaction.options.getString('name'),
          symbol: interaction.options.getString('symbol'),
          description: interaction.options.getString('description'),
          imageUrl: interaction.options.getString('image-url'),
          twitter: interaction.options.getString('twitter'),
          telegram: interaction.options.getString('telegram'),
          website: interaction.options.getString('website')
        };

        // Basic validation
        if (tokenData.symbol.length > 10) {
          await interaction.editReply('❌ Token symbol must be 10 characters or less');
          return;
        }

        if (tokenData.name.length > 32) {
          await interaction.editReply('❌ Token name must be 32 characters or less');
          return;
        }

        // Show preview and require confirmation
        const embed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle('🚀 Token Launch Preview')
          .setDescription('**⚠️ Review carefully before confirming**')
          .addFields(
            { name: 'Name', value: tokenData.name, inline: true },
            { name: 'Symbol', value: tokenData.symbol, inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
            { name: 'Description', value: tokenData.description, inline: false }
          );

        if (tokenData.imageUrl) {
          embed.setThumbnail(tokenData.imageUrl);
        }

        if (tokenData.twitter || tokenData.telegram || tokenData.website) {
          let socials = '';
          if (tokenData.twitter) socials += `Twitter: @${tokenData.twitter}\n`;
          if (tokenData.telegram) socials += `Telegram: ${tokenData.telegram}\n`;
          if (tokenData.website) socials += `Website: ${tokenData.website}\n`;
          embed.addFields({ name: 'Socials', value: socials, inline: false });
        }

        embed.addFields({
          name: '⚠️ Security Checklist',
          value: '✅ You control the creator wallet\n✅ You will sign the transaction\n✅ The bot never holds your keys\n✅ You understand the launch process',
          inline: false
        });

        embed.setFooter({ text: 'Click Confirm to proceed to transaction building' })
          .setTimestamp();

        const launchId = `launch_${Date.now()}_${interaction.user.id}`;
        launchWizardStore.set(launchId, {
          tokenData,
          userId: interaction.user.id,
          expiresAt: Date.now() + 600000 // 10 minutes
        });

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`launch_confirm_${launchId}`)
              .setLabel('✅ Confirm Launch')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`launch_cancel_${launchId}`)
              .setLabel('❌ Cancel')
              .setStyle(ButtonStyle.Danger)
          );

        await interaction.editReply({ embeds: [embed], components: [row] });
      } catch (error) {
        await interaction.editReply(`❌ Error: ${error.message}`);
      }
    }
  }
];

// Handle button interactions for launch confirmation
export async function handleLaunchButtons(interaction) {
  if (!interaction.isButton()) return;

  const [action, confirmAction, launchId] = interaction.customId.split('_');

  if (action !== 'launch') return;

  if (confirmAction === 'cancel') {
    launchWizardStore.delete(launchId);
    await interaction.update({
      content: '❌ Token launch cancelled.',
      embeds: [],
      components: []
    });
    return;
  }

  if (confirmAction !== 'confirm') return;

  await interaction.deferUpdate();

  try {
    const launchData = launchWizardStore.get(launchId);

    if (!launchData) {
      await interaction.editReply({
        content: '❌ Launch data not found or expired. Please start over.',
        embeds: [],
        components: []
      });
      return;
    }

    if (launchData.userId !== interaction.user.id) {
      await interaction.followUp({
        content: '❌ This launch belongs to another user.',
        ephemeral: true
      });
      return;
    }

    if (Date.now() > launchData.expiresAt) {
      launchWizardStore.delete(launchId);
      await interaction.editReply({
        content: '❌ Launch data expired. Please start over.',
        embeds: [],
        components: []
      });
      return;
    }

    // Ask for wallet address to build transaction
    await interaction.editReply({
      content: '📝 Please reply with your **creator wallet address** (the wallet that will sign and launch the token):',
      embeds: [],
      components: []
    });

    // Set up message collector for wallet address
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({
      filter,
      max: 1,
      time: 120000 // 2 minutes
    });

    collector.on('collect', async (message) => {
      const wallet = message.content.trim();

      if (!TransactionBuilder.isValidSolanaAddress(wallet)) {
        await message.reply('❌ Invalid wallet address. Please try the `/launch` command again.');
        launchWizardStore.delete(launchId);
        return;
      }

      await message.reply('⏳ Building your token launch transaction...');

      try {
        // Create token info/metadata
        const tokenInfoData = await BagsAPI.createTokenInfo(launchData.tokenData, null);

        if (!tokenInfoData.success) {
          await message.reply(`❌ Error creating token info: ${tokenInfoData.error}`);
          launchWizardStore.delete(launchId);
          return;
        }

        const tokenMint = tokenInfoData.data.tokenMint;

        // Create launch transaction
        const txData = await BagsAPI.createLaunchTransaction({
          tokenMint,
          creatorPublicKey: wallet,
          initialBuyAmount: 0 // Can be customized
        });

        if (!txData.success) {
          await message.reply(`❌ Error creating launch transaction: ${txData.error}`);
          launchWizardStore.delete(launchId);
          return;
        }

        const transaction = txData.data.transaction;

        const txInfo = TransactionBuilder.formatTransactionMessage(transaction, {
          action: 'launch',
          name: launchData.tokenData.name,
          symbol: launchData.tokenData.symbol
        });

        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ Token Launch Transaction Ready')
          .setDescription(txInfo.description)
          .addFields(
            { name: 'Token Mint', value: `\`${tokenMint}\``, inline: false },
            { name: 'Creator Wallet', value: `\`${TransactionBuilder.truncateAddress(wallet)}\``, inline: false },
            { name: 'Transaction (Base64)', value: `\`\`\`${transaction.slice(0, 100)}...\`\`\``, inline: false },
            { name: '⚠️ Important', value: '**Review the transaction carefully before signing**\nThis bot never stores your private keys', inline: false }
          )
          .setFooter({ text: '🔒 Transaction built - Sign in your wallet' })
          .setTimestamp();

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel('Sign Transaction')
              .setURL(txInfo.signingUrl)
              .setStyle(ButtonStyle.Link)
          );

        // Set cooldowns
        securityManager.setCooldown(interaction.user.id, 'launch');
        if (interaction.guildId) {
          securityManager.setServerLaunchCooldown(interaction.guildId);
        }

        await message.reply({ embeds: [embed], components: [row] });

        // Clean up
        launchWizardStore.delete(launchId);
      } catch (error) {
        await message.reply(`❌ Error: ${error.message}`);
        launchWizardStore.delete(launchId);
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.followUp('⏱️ Wallet address collection timed out. Please try `/launch` again.');
        launchWizardStore.delete(launchId);
      }
    });
  } catch (error) {
    await interaction.editReply({
      content: `❌ Error: ${error.message}`,
      embeds: [],
      components: []
    });
  }
}

// Clean up expired launch data every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [launchId, launchData] of launchWizardStore.entries()) {
    if (now > launchData.expiresAt) {
      launchWizardStore.delete(launchId);
    }
  }
}, 300000);
