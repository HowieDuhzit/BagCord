import axios from 'axios';
import { config } from '../config.js';

const api = axios.create({
  baseURL: config.bagsApiBaseUrl,
  headers: {
    'x-api-key': config.bagsApiKey,
    'Content-Type': 'application/json'
  }
});

export class BagsAPI {
  // ========== ANALYTICS (Safe - Read Only) ==========

  static async getTokenLifetimeFees(tokenMint) {
    try {
      const response = await api.get('/token-launch/lifetime-fees', {
        params: { tokenMint }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch token fees: ${error.response?.data?.error || error.message}`);
    }
  }

  static async getTokenClaimStats(tokenMint) {
    try {
      const response = await api.get('/token-launch/claim-stats', {
        params: { tokenMint }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch claim stats: ${error.response?.data?.error || error.message}`);
    }
  }

  static async getTokenClaimEvents(tokenMint, options = {}) {
    try {
      const params = {
        tokenMint,
        mode: options.mode || 'offset',
        limit: options.limit || 10,
        offset: options.offset || 0
      };
      const response = await api.get('/fee-share/token/claim-events', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch claim events: ${error.response?.data?.error || error.message}`);
    }
  }

  static async getTokenLaunchCreators(tokenMint) {
    try {
      const response = await api.get('/token-launch/creator/v3', {
        params: { tokenMint }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch token creators: ${error.response?.data?.error || error.message}`);
    }
  }

  // ========== TRADING (Safe - Returns Unsigned TX) ==========

  static async getTradeQuote(inputMint, outputMint, amount, slippageBps = 100) {
    try {
      const response = await api.get('/trade/quote', {
        params: {
          inputMint,
          outputMint,
          amount,
          slippageMode: 'manual',
          slippageBps
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get trade quote: ${error.response?.data?.error || error.message}`);
    }
  }

  static async createSwapTransaction(quoteResponse, userPublicKey) {
    try {
      const response = await api.post('/trade/swap', {
        quoteResponse,
        userPublicKey
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create swap transaction: ${error.response?.data?.error || error.message}`);
    }
  }

  // ========== TOKEN LAUNCH (Safe - Returns Unsigned TX) ==========

  static async createTokenInfo(tokenData) {
    try {
      // For now, we'll use JSON instead of FormData since we're not handling file uploads
      const body = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description
      };

      if (tokenData.imageUrl) body.imageUrl = tokenData.imageUrl;
      if (tokenData.twitter) body.twitter = tokenData.twitter;
      if (tokenData.telegram) body.telegram = tokenData.telegram;
      if (tokenData.website) body.website = tokenData.website;

      const response = await api.post('/token-launch/create-token-info', body);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create token info: ${error.response?.data?.error || error.message}`);
    }
  }

  static async createFeeShareConfig(payer, baseMint, claimersArray, basisPointsArray) {
    try {
      const response = await api.post('/fee-share/config', {
        payer,
        baseMint,
        claimersArray,
        basisPointsArray
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create fee share config: ${error.response?.data?.error || error.message}`);
    }
  }

  static async createLaunchTransaction(ipfs, tokenMint, wallet, initialBuyLamports, configKey) {
    try {
      const response = await api.post('/token-launch/create-launch-transaction', {
        ipfs,
        tokenMint,
        wallet,
        initialBuyLamports,
        configKey
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create launch transaction: ${error.response?.data?.error || error.message}`);
    }
  }

  // ========== FEE CLAIMING (Safe - Returns Unsigned TX) ==========

  static async getClaimablePositions(wallet) {
    try {
      const response = await api.get('/token-launch/claimable-positions', {
        params: { wallet }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch claimable positions: ${error.response?.data?.error || error.message}`);
    }
  }

  static async createClaimTransactions(feeClaimer, tokenMint, options = {}) {
    try {
      const body = {
        feeClaimer,
        tokenMint,
        claimVirtualPoolFees: options.claimVirtualPoolFees !== false,
        claimDammV2Fees: options.claimDammV2Fees !== false
      };

      if (options.virtualPoolAddress) body.virtualPoolAddress = options.virtualPoolAddress;
      if (options.dammV2Position) body.dammV2Position = options.dammV2Position;

      const response = await api.post('/token-launch/claim-txs/v2', body);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create claim transactions: ${error.response?.data?.error || error.message}`);
    }
  }
}
