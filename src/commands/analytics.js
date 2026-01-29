import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BagsAPI } from '../api/bags.js';
import { TransactionBuilder } from '../utils/transaction.js';

export const analyticsCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('token')
      .setDescription('Get detailed token information and statistics')
      .addStringOption(option =>
        option.setName('mint')
          .setDescription('Token mint address (Base58)')
          .setRequired(true)
      ),
    async execute(interaction) {
      await interaction.deferReply();

      try {
        const mint = interaction.options.getString('mint');

        if (!TransactionBuilder.isValidSolanaAddress(mint)) {
          await interaction.editReply('❌ Invalid Solana address format');
          return;
        }

        const [feesData, statsData, creatorsData] = await Promise.allSettled([
          BagsAPI.getTokenLifetimeFees(mint),
          BagsAPI.getTokenClaimStats(mint),
          BagsAPI.getTokenLaunchCreators(mint)
        ]);

        const embed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle('🪙 Token Information')
          .addFields(
            { name: 'Token Mint', value: `\`${mint}\``, inline: false },
            { name: 'Short Address', value: TransactionBuilder.truncateAddress(mint, 6), inline: true }
          );

        if (feesData.status === 'fulfilled' && feesData.value.success) {
          const feesLamports = feesData.value.response; // response is a string
          embed.addFields(
            { name: 'Lifetime Fees', value: `${TransactionBuilder.lamportsToSol(feesLamports || '0')} SOL`, inline: true }
          );
        }

        if (statsData.status === 'fulfilled' && statsData.value.success) {
          const stats = statsData.value.response; // response is an array
          if (stats && stats.length > 0) {
            const totalClaimed = stats.reduce((sum, s) => sum + parseInt(s.totalClaimed || '0'), 0);
            embed.addFields(
              { name: 'Total Claimers', value: `${stats.length}`, inline: true },
              { name: 'Total Claimed', value: `${TransactionBuilder.lamportsToSol(totalClaimed.toString())} SOL`, inline: true }
            );
          }
        }

        if (creatorsData.status === 'fulfilled' && creatorsData.value.success) {
          const creators = creatorsData.value.response; // response is an array
          if (creators && creators.length > 0) {
            const creatorInfo = creators.slice(0, 3).map((c, i) =>
              `${i + 1}. \`${TransactionBuilder.truncateAddress(c.wallet)}\` (${c.provider || 'Unknown'})`
            ).join('\n');
            embed.addFields({ name: 'Creators', value: creatorInfo, inline: false });
          }
        }

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
      .setName('fees')
      .setDescription('Get lifetime fees for a token')
      .addStringOption(option =>
        option.setName('mint')
          .setDescription('Token mint address (Base58)')
          .setRequired(true)
      ),
    async execute(interaction) {
      await interaction.deferReply();

      try {
        const mint = interaction.options.getString('mint');

        if (!TransactionBuilder.isValidSolanaAddress(mint)) {
          await interaction.editReply('❌ Invalid Solana address format');
          return;
        }

        const data = await BagsAPI.getTokenLifetimeFees(mint);

        if (!data.success) {
          await interaction.editReply(`❌ Error: ${data.error || 'Unknown error'}`);
          return;
        }

        const feesLamports = data.response; // response is a string
        const embed = new EmbedBuilder()
          .setColor(0x00FF99)
          .setTitle('💎 Token Lifetime Fees')
          .addFields(
            { name: 'Token', value: `\`${TransactionBuilder.truncateAddress(mint, 6)}\``, inline: false },
            { name: 'Total Fees', value: `${TransactionBuilder.lamportsToSol(feesLamports || '0')} SOL`, inline: true }
          )
          .setFooter({ text: '✅ Safe Command - Read Only' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        await interaction.editReply(`❌ Error: ${error.message}`);
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('claim-events')
      .setDescription('Get claim history for a token')
      .addStringOption(option =>
        option.setName('mint')
          .setDescription('Token mint address (Base58)')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option.setName('limit')
          .setDescription('Number of events to fetch (max 25)')
          .setRequired(false)
      ),
    async execute(interaction) {
      await interaction.deferReply();

      try {
        const mint = interaction.options.getString('mint');
        const limit = Math.min(interaction.options.getInteger('limit') || 10, 25);

        if (!TransactionBuilder.isValidSolanaAddress(mint)) {
          await interaction.editReply('❌ Invalid Solana address format');
          return;
        }

        const data = await BagsAPI.getTokenClaimEvents(mint, { limit });

        if (!data.success) {
          await interaction.editReply(`❌ Error: ${data.error || 'Unknown error'}`);
          return;
        }

        const events = data.response; // response is an array

        if (!events || events.length === 0) {
          await interaction.editReply('No claim events found for this token.');
          return;
        }

        const embed = new EmbedBuilder()
          .setColor(0xFF9900)
          .setTitle('📜 Token Claim Events')
          .addFields(
            { name: 'Token', value: `\`${TransactionBuilder.truncateAddress(mint, 6)}\``, inline: false }
          );

        events.slice(0, 10).forEach((event, index) => {
          const claimer = TransactionBuilder.truncateAddress(event.claimer || 'Unknown');
          const amount = TransactionBuilder.lamportsToSol(event.amount || 0);
          const timestamp = event.timestamp ? new Date(event.timestamp).toLocaleDateString() : 'Unknown';

          embed.addFields({
            name: `Claim ${index + 1}`,
            value: `Claimer: \`${claimer}\`\nAmount: ${amount} SOL\nDate: ${timestamp}`,
            inline: true
          });
        });

        embed.setFooter({ text: `✅ Safe Command - Read Only • Showing ${Math.min(events.length, 10)} of ${events.length} events` })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        await interaction.editReply(`❌ Error: ${error.message}`);
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('creators')
      .setDescription('Get launch creators for a token')
      .addStringOption(option =>
        option.setName('mint')
          .setDescription('Token mint address (Base58)')
          .setRequired(true)
      ),
    async execute(interaction) {
      await interaction.deferReply();

      try {
        const mint = interaction.options.getString('mint');

        if (!TransactionBuilder.isValidSolanaAddress(mint)) {
          await interaction.editReply('❌ Invalid Solana address format');
          return;
        }

        const data = await BagsAPI.getTokenLaunchCreators(mint);

        if (!data.success) {
          await interaction.editReply(`❌ Error: ${data.error || 'Unknown error'}`);
          return;
        }

        const creators = data.response; // response is an array

        const embed = new EmbedBuilder()
          .setColor(0xFF0099)
          .setTitle('👥 Token Launch Creators')
          .addFields(
            { name: 'Token', value: `\`${TransactionBuilder.truncateAddress(mint, 6)}\``, inline: false }
          );

        if (creators && creators.length > 0) {
          creators.slice(0, 10).forEach((creator, index) => {
            const displayName = creator.providerUsername || creator.username || 'Unknown';
            embed.addFields({
              name: `Creator ${index + 1}`,
              value: `${displayName}\nWallet: \`${TransactionBuilder.truncateAddress(creator.wallet || 'Unknown')}\`\nProvider: ${creator.provider || 'Unknown'}`,
              inline: true
            });
          });
        } else {
          embed.addFields({ name: 'Creators', value: 'No creators found', inline: false });
        }

        embed.setFooter({ text: '✅ Safe Command - Read Only' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        await interaction.editReply(`❌ Error: ${error.message}`);
      }
    }
  }
];
