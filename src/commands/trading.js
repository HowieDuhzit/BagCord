import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { BagsAPI } from '../api/bags.js';
import { TransactionBuilder } from '../utils/transaction.js';
import { securityManager } from '../security/permissions.js';

// Store quotes temporarily (in production, use Redis or similar)
const quoteStore = new Map();

export const tradingCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('quote')
      .setDescription('Get a trade quote (swap preview)')
      .addStringOption(option =>
        option.setName('from')
          .setDescription('Input token mint address')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('to')
          .setDescription('Output token mint address')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('amount')
          .setDescription('Amount in SOL or token units')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option.setName('slippage')
          .setDescription('Slippage tolerance in basis points (default: 100 = 1%)')
          .setRequired(false)
      ),
    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });

      try {
        const fromMint = interaction.options.getString('from');
        const toMint = interaction.options.getString('to');
        const amountStr = interaction.options.getString('amount');
        const slippage = interaction.options.getInteger('slippage') || 100;

        // Validate addresses
        if (!TransactionBuilder.isValidSolanaAddress(fromMint) ||
            !TransactionBuilder.isValidSolanaAddress(toMint)) {
          await interaction.editReply('❌ Invalid Solana address format');
          return;
        }

        // Check token denylist
        if (securityManager.isTokenDenied(fromMint) || securityManager.isTokenDenied(toMint)) {
          await interaction.editReply('❌ One or more tokens are denied (potential scam)');
          return;
        }

        // Parse amount (assume SOL if from is SOL mint, else lamports)
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
          await interaction.editReply('❌ Invalid amount');
          return;
        }

        const lamports = fromMint === 'So11111111111111111111111111111111111111112'
          ? TransactionBuilder.solToLamports(amount)
          : Math.floor(amount);

        const data = await BagsAPI.getTradeQuote(fromMint, toMint, lamports, slippage);

        if (!data.success) {
          await interaction.editReply(`❌ Error: ${data.error || 'Unknown error'}`);
          return;
        }

        const quote = data.data;
        const quoteId = `quote_${Date.now()}_${interaction.user.id}`;

        // Store quote for 5 minutes
        quoteStore.set(quoteId, {
          quote,
          fromMint,
          toMint,
          amount: lamports,
          slippage,
          userId: interaction.user.id,
          expiresAt: Date.now() + 300000
        });

        const embed = new EmbedBuilder()
          .setColor(0xFF9900)
          .setTitle('💱 Trade Quote')
          .setDescription('**⚠️ This is a preview only. No transaction has been created yet.**')
          .addFields(
            { name: 'From Token', value: `\`${TransactionBuilder.truncateAddress(fromMint)}\``, inline: true },
            { name: 'To Token', value: `\`${TransactionBuilder.truncateAddress(toMint)}\``, inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
            { name: 'Input Amount', value: `${amount} ${fromMint === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'tokens'}`, inline: true },
            { name: 'Output Amount', value: `${TransactionBuilder.lamportsToSol(quote.outputAmount || 0)}`, inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
            { name: 'Price Impact', value: `${quote.priceImpact?.toFixed(2) || 'N/A'}%`, inline: true },
            { name: 'Slippage', value: `${(slippage / 100).toFixed(2)}%`, inline: true },
            { name: '\u200b', value: '\u200b', inline: true }
          )
          .addFields({
            name: '📝 Next Steps',
            value: 'Use `/swap` with your Quote ID to generate the transaction.\nQuote ID: `' + quoteId + '`\nExpires in 5 minutes.',
            inline: false
          })
          .setFooter({ text: '✅ Safe Command - No transaction created yet' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        await interaction.editReply(`❌ Error: ${error.message}`);
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('swap')
      .setDescription('Build swap transaction from quote (returns unsigned transaction)')
      .addStringOption(option =>
        option.setName('quote-id')
          .setDescription('Quote ID from /quote command')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('wallet')
          .setDescription('Your wallet address (will sign the transaction)')
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
          await interaction.user.send('Use `/swap` here to build your transaction safely.');
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
        const quoteId = interaction.options.getString('quote-id');
        const wallet = interaction.options.getString('wallet');

        // Validate wallet address
        if (!TransactionBuilder.isValidSolanaAddress(wallet)) {
          await interaction.editReply('❌ Invalid wallet address format');
          return;
        }

        // Check cooldown
        const cooldownCheck = securityManager.checkCooldown(interaction.user.id, 'swap');
        if (!cooldownCheck.allowed) {
          await interaction.editReply(
            `⏳ Cooldown active. Please wait ${securityManager.formatTimeRemaining(cooldownCheck.timeRemaining)}`
          );
          return;
        }

        // Retrieve quote
        const quoteData = quoteStore.get(quoteId);
        if (!quoteData) {
          await interaction.editReply('❌ Quote not found or expired. Please create a new quote with `/quote`');
          return;
        }

        if (quoteData.userId !== interaction.user.id) {
          await interaction.editReply('❌ This quote belongs to another user');
          return;
        }

        if (Date.now() > quoteData.expiresAt) {
          quoteStore.delete(quoteId);
          await interaction.editReply('❌ Quote expired. Please create a new quote with `/quote`');
          return;
        }

        // Build transaction
        const txData = await BagsAPI.createSwapTransaction(quoteData.quote.id, wallet);

        if (!txData.success) {
          await interaction.editReply(`❌ Error: ${txData.error || 'Failed to build transaction'}`);
          return;
        }

        const transaction = txData.data.transaction;

        const txInfo = TransactionBuilder.formatTransactionMessage(transaction, {
          action: 'swap',
          from: TransactionBuilder.truncateAddress(quoteData.fromMint),
          to: TransactionBuilder.truncateAddress(quoteData.toMint),
          amount: quoteData.amount
        });

        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ Swap Transaction Ready')
          .setDescription(txInfo.description)
          .addFields(
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

        // Set cooldown
        securityManager.setCooldown(interaction.user.id, 'swap');

        // Clean up quote
        quoteStore.delete(quoteId);

        await interaction.editReply({ embeds: [embed], components: [row] });
      } catch (error) {
        await interaction.editReply(`❌ Error: ${error.message}`);
      }
    }
  }
];

// Clean up expired quotes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [quoteId, quoteData] of quoteStore.entries()) {
    if (now > quoteData.expiresAt) {
      quoteStore.delete(quoteId);
    }
  }
}, 300000);
