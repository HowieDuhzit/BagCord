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

  static async createTokenInfo(tokenData, imageFile) {
    try {
      const formData = new FormData();
      formData.append('name', tokenData.name);
      formData.append('symbol', tokenData.symbol);
      formData.append('description', tokenData.description);
      if (tokenData.twitter) formData.append('twitter', tokenData.twitter);
      if (tokenData.telegram) formData.append('telegram', tokenData.telegram);
      if (tokenData.website) formData.append('website', tokenData.website);
      if (imageFile) formData.append('image', imageFile);

      const response = await api.post('/token-launch/create-token-info', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create token info: ${error.response?.data?.error || error.message}`);
    }
  }

  static async createLaunchTransaction(launchData) {
    try {
      const response = await api.post('/token-launch/create-launch-transaction', launchData);
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

  static async createClaimTransactions(wallet, tokenMint = null) {
    try {
      const params = { wallet };
      if (tokenMint) params.tokenMint = tokenMint;

      const response = await api.post('/token-launch/claim-transactions', params);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create claim transactions: ${error.response?.data?.error || error.message}`);
    }
  }

  // ========== FEE SHARING ==========

  static async createFeeShareConfig(tokenMint, feeClaimers) {
    try {
      const response = await api.post('/fee-share/create-config', {
        tokenMint,
        feeClaimers
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create fee share config: ${error.response?.data?.error || error.message}`);
    }
  }
}
