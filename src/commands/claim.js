import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { BagsAPI } from '../api/bags.js';
import { TransactionBuilder } from '../utils/transaction.js';
import { securityManager } from '../security/permissions.js';

export const claimCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('claimable')
      .setDescription('Check claimable fee positions for a wallet')
      .addStringOption(option =>
        option.setName('wallet')
          .setDescription('Wallet address (Base58)')
          .setRequired(true)
      ),
    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });

      try {
        const wallet = interaction.options.getString('wallet');

        if (!TransactionBuilder.isValidSolanaAddress(wallet)) {
          await interaction.editReply('❌ Invalid wallet address format');
          return;
        }

        const data = await BagsAPI.getClaimablePositions(wallet);

        if (!data.success) {
          await interaction.editReply(`❌ Error: ${data.error || 'Unknown error'}`);
          return;
        }

        const positions = data.response; // response is an array
        const totalPositions = positions?.length || 0;

        if (totalPositions === 0) {
          await interaction.editReply('💰 No claimable positions found for this wallet.');
          return;
        }

        const embed = new EmbedBuilder()
          .setColor(0x9900FF)
          .setTitle('💰 Claimable Fee Positions')
          .setDescription('**These are your claimable fee positions. Use `/claim` to build claim transactions.**')
          .addFields(
            { name: 'Wallet', value: `\`${TransactionBuilder.truncateAddress(wallet, 6)}\``, inline: false },
            { name: 'Total Positions', value: `${totalPositions}`, inline: true }
          );

        let totalClaimable = 0;

        positions.slice(0, 10).forEach((position, index) => {
          const amount = position.totalClaimableLamportsUserShare || 0;
          totalClaimable += amount;

          const tokenMint = position.baseMint || 'Unknown';
          const poolType = position.isMigrated ? 'DAMM v2' : 'Virtual Pool';

          embed.addFields({
            name: `Position ${index + 1}`,
            value: `Token: \`${TransactionBuilder.truncateAddress(tokenMint)}\`\nAmount: ${TransactionBuilder.lamportsToSol(amount.toString())} SOL\nType: ${poolType}`,
            inline: true
          });
        });

        if (totalPositions > 10) {
          embed.addFields({
            name: 'More Positions',
            value: `+ ${totalPositions - 10} more positions`,
            inline: false
          });
        }

        embed.addFields({
          name: 'Total Claimable',
          value: `${TransactionBuilder.lamportsToSol(totalClaimable.toString())} SOL`,
          inline: false
        });

        embed.setFooter({ text: '✅ Safe Command - Read Only' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        await interaction.editReply(`❌ Error: ${error.message}`);
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('claim')
      .setDescription('Build claim transaction (returns unsigned transaction)')
      .addStringOption(option =>
        option.setName('wallet')
          .setDescription('Your wallet address (will sign the transaction)')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('token')
          .setDescription('Token mint address to claim fees for')
          .setRequired(true)
      ),
    async execute(interaction) {
      // SECURITY: Send transaction building to DMs
      if (!interaction.channel.isDMBased()) {
        await interaction.reply({
          content: '🔒 For security, transaction building is only available in DMs. I\'ll send you a DM.',
          ephemeral: true
        });

        try {
          await interaction.user.send('Use `/claim` here to build your transaction safely.');
        } catch (error) {
          await interaction.followUp({
            content: '❌ I couldn\'t send you a DM. Please enable DMs from server members and try again.',
            ephemeral: true
          });
        }
        return;
      }

      await interaction.deferReply();

      try {
        const wallet = interaction.options.getString('wallet');
        const tokenMint = interaction.options.getString('token');

        // Validate addresses
        if (!TransactionBuilder.isValidSolanaAddress(wallet)) {
          await interaction.editReply('❌ Invalid wallet address format');
          return;
        }

        if (tokenMint && !TransactionBuilder.isValidSolanaAddress(tokenMint)) {
          await interaction.editReply('❌ Invalid token mint address format');
          return;
        }

        // Check cooldown
        const cooldownCheck = securityManager.checkCooldown(interaction.user.id, 'claim');
        if (!cooldownCheck.allowed) {
          await interaction.editReply(
            `⏳ Cooldown active. Please wait ${securityManager.formatTimeRemaining(cooldownCheck.timeRemaining)}`
          );
          return;
        }

        // Check claimable positions first
        const positionsData = await BagsAPI.getClaimablePositions(wallet);
        if (!positionsData.success || !positionsData.data || positionsData.data.length === 0) {
          await interaction.editReply('💰 No claimable positions found for this wallet.');
          return;
        }

        // Token mint is required for claim API
        if (!tokenMint) {
          await interaction.editReply('❌ Please specify a token mint to claim fees for. Use the `token` parameter.');
          return;
        }

        // Build claim transaction
        const txData = await BagsAPI.createClaimTransactions(wallet, tokenMint, {
          claimVirtualPoolFees: true,
          claimDammV2Fees: true
        });

        if (!txData.success) {
          await interaction.editReply(`❌ Error: ${txData.error || 'Failed to build transaction'}`);
          return;
        }

        const transactions = txData.data.transactions || [];

        if (transactions.length === 0) {
          await interaction.editReply('❌ No claim transactions to build');
          return;
        }

        // For simplicity, show the first transaction
        const transaction = transactions[0];

        const txInfo = TransactionBuilder.formatTransactionMessage(transaction, {
          action: 'claim',
          token: tokenMint ? TransactionBuilder.truncateAddress(tokenMint) : 'All',
          amount: `${positionsData.data.length} position${positionsData.data.length !== 1 ? 's' : ''}`
        });

        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ Claim Transaction Ready')
          .setDescription(txInfo.description)
          .addFields(
            { name: 'Transaction (Base64)', value: `\`\`\`${transaction.slice(0, 100)}...\`\`\``, inline: false },
            { name: '⚠️ Important', value: '**Review the transaction carefully before signing**\nThis bot never stores your private keys', inline: false }
          );

        if (transactions.length > 1) {
          embed.addFields({
            name: 'Multiple Transactions',
            value: `This claim requires ${transactions.length} transactions. Showing the first one.`,
            inline: false
          });
        }

        embed.setFooter({ text: '🔒 Transaction built - Sign in your wallet' })
          .setTimestamp();

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel('Sign Transaction')
              .setURL(txInfo.signingUrl)
              .setStyle(ButtonStyle.Link)
          );

        // Set cooldown
        securityManager.setCooldown(interaction.user.id, 'claim');

        await interaction.editReply({ embeds: [embed], components: [row] });
      } catch (error) {
        await interaction.editReply(`❌ Error: ${error.message}`);
      }
    }
  }
];
