import { config } from '../config.js';

export class TransactionBuilder {
  /**
   * Generates a signing URL for a transaction
   * Users will be redirected to this URL to sign the transaction
   */
  static generateSigningUrl(transactionBase64, metadata = {}) {
    const signerUrl = config.signerWebUrl || 'https://example.com/sign';

    const params = new URLSearchParams({
      tx: transactionBase64,
      action: metadata.action || 'unknown',
      ...(metadata.token && { token: metadata.token }),
      ...(metadata.amount && { amount: metadata.amount })
    });

    return `${signerUrl}?${params.toString()}`;
  }

  /**
   * Creates a formatted transaction message for Discord
   */
  static formatTransactionMessage(transaction, metadata) {
    const { action, token, amount, from, to } = metadata;

    let description = '**Transaction Details:**\n\n';

    switch (action) {
      case 'swap':
        description += `🔄 **Swap**\n`;
        description += `From: \`${from}\`\n`;
        description += `To: \`${to}\`\n`;
        description += `Amount: ${amount}\n\n`;
        break;

      case 'claim':
        description += `💰 **Claim Fees**\n`;
        description += `Token: \`${token}\`\n`;
        description += `Amount: ${amount}\n\n`;
        break;

      case 'launch':
        description += `🚀 **Launch Token**\n`;
        description += `Name: ${metadata.name}\n`;
        description += `Symbol: ${metadata.symbol}\n\n`;
        break;
    }

    description += '⚠️ **Security Reminder:**\n';
    description += '• Review all transaction details carefully\n';
    description += '• Verify the token mint address\n';
    description += '• Only sign if you understand what the transaction does\n';
    description += '• This bot never holds your private keys\n';

    return {
      description,
      transactionBase64: transaction,
      signingUrl: this.generateSigningUrl(transaction, metadata)
    };
  }

  /**
   * Truncates a Solana address for display
   */
  static truncateAddress(address, chars = 4) {
    if (!address) return 'N/A';
    if (address.length <= chars * 2 + 3) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }

  /**
   * Validates a Solana address (Base58)
   */
  static isValidSolanaAddress(address) {
    if (!address || typeof address !== 'string') return false;
    // Base58 regex: 1-9 A-H J-N P-Z a-k m-z
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  }

  /**
   * Formats lamports to SOL
   */
  static lamportsToSol(lamports) {
    return (lamports / 1e9).toFixed(4);
  }

  /**
   * Formats SOL to lamports
   */
  static solToLamports(sol) {
    return Math.floor(sol * 1e9);
  }
}
