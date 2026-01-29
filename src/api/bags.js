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
      const response = await api.get(`/analytics/token-lifetime-fees/${tokenMint}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch token fees: ${error.response?.data?.error || error.message}`);
    }
  }

  static async getTokenClaimStats(tokenMint) {
    try {
      const response = await api.get(`/analytics/token-claim-stats/${tokenMint}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch claim stats: ${error.response?.data?.error || error.message}`);
    }
  }

  static async getTokenClaimEvents(tokenMint, options = {}) {
    try {
      const params = {
        limit: options.limit || 10,
        offset: options.offset || 0
      };
      const response = await api.get(`/analytics/token-claim-events/${tokenMint}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch claim events: ${error.response?.data?.error || error.message}`);
    }
  }

  static async getTokenLaunchCreators(tokenMint) {
    try {
      const response = await api.get(`/token/launch/creators/${tokenMint}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch token creators: ${error.response?.data?.error || error.message}`);
    }
  }

  // ========== TRADING (Safe - Returns Unsigned TX) ==========

  static async getTradeQuote(inputMint, outputMint, amount, slippageBps = 100) {
    try {
      const response = await api.post('/trade/quote', {
        inputMint,
        outputMint,
        amount,
        slippageBps
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get trade quote: ${error.response?.data?.error || error.message}`);
    }
  }

  static async createSwapTransaction(quoteId, userPublicKey) {
    try {
      const response = await api.post('/trade/swap', {
        quoteId,
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

      const response = await api.post('/token/info', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create token info: ${error.response?.data?.error || error.message}`);
    }
  }

  static async createLaunchTransaction(launchData) {
    try {
      const response = await api.post('/token/launch', launchData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create launch transaction: ${error.response?.data?.error || error.message}`);
    }
  }

  // ========== FEE CLAIMING (Safe - Returns Unsigned TX) ==========

  static async getClaimablePositions(wallet) {
    try {
      const response = await api.get(`/claim/claimable/${wallet}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch claimable positions: ${error.response?.data?.error || error.message}`);
    }
  }

  static async createClaimTransactions(wallet, tokenMint = null) {
    try {
      const params = tokenMint ? { tokenMint } : {};
      const response = await api.post('/claim/transactions', {
        wallet,
        ...params
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create claim transactions: ${error.response?.data?.error || error.message}`);
    }
  }

  // ========== FEE SHARING ==========

  static async createFeeShareConfig(tokenMint, feeClaimers) {
    try {
      const response = await api.post('/fee-share/config', {
        tokenMint,
        feeClaimers
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create fee share config: ${error.response?.data?.error || error.message}`);
    }
  }
}
