import { config } from '../config.js';

export class SecurityManager {
  constructor() {
    // Role IDs that can use launch command
    this.launchAllowedRoles = config.launchAllowedRoles || [];

    // Cooldowns: userId -> { command -> lastUsed }
    this.cooldowns = new Map();

    // Cooldown durations in ms
    this.cooldownDurations = {
      launch: 3600000, // 1 hour per user
      swap: 30000,     // 30 seconds
      claim: 60000     // 1 minute
    };

    // Server-wide launch cooldowns: serverId -> lastLaunch
    this.serverLaunchCooldowns = new Map();
    this.serverLaunchCooldown = 600000; // 10 minutes per server

    // Token denylist (known scams)
    this.tokenDenylist = new Set(config.tokenDenylist || []);
  }

  canUseLaunchCommand(member) {
    if (this.launchAllowedRoles.length === 0) {
      return true; // No restrictions if not configured
    }

    return member.roles.cache.some(role =>
      this.launchAllowedRoles.includes(role.id)
    );
  }

  checkCooldown(userId, command) {
    if (!this.cooldownDurations[command]) return { allowed: true };

    const userCooldowns = this.cooldowns.get(userId) || {};
    const lastUsed = userCooldowns[command];
    const cooldownDuration = this.cooldownDurations[command];

    if (!lastUsed) return { allowed: true };

    const timePassed = Date.now() - lastUsed;
    const timeRemaining = cooldownDuration - timePassed;

    if (timePassed < cooldownDuration) {
      return {
        allowed: false,
        timeRemaining: Math.ceil(timeRemaining / 1000) // seconds
      };
    }

    return { allowed: true };
  }

  setCooldown(userId, command) {
    const userCooldowns = this.cooldowns.get(userId) || {};
    userCooldowns[command] = Date.now();
    this.cooldowns.set(userId, userCooldowns);
  }

  checkServerLaunchCooldown(serverId) {
    const lastLaunch = this.serverLaunchCooldowns.get(serverId);

    if (!lastLaunch) return { allowed: true };

    const timePassed = Date.now() - lastLaunch;
    const timeRemaining = this.serverLaunchCooldown - timePassed;

    if (timePassed < this.serverLaunchCooldown) {
      return {
        allowed: false,
        timeRemaining: Math.ceil(timeRemaining / 1000)
      };
    }

    return { allowed: true };
  }

  setServerLaunchCooldown(serverId) {
    this.serverLaunchCooldowns.set(serverId, Date.now());
  }

  isTokenDenied(tokenMint) {
    return this.tokenDenylist.has(tokenMint);
  }

  addToTokenDenylist(tokenMint) {
    this.tokenDenylist.add(tokenMint);
  }

  removeFromTokenDenylist(tokenMint) {
    this.tokenDenylist.delete(tokenMint);
  }

  formatTimeRemaining(seconds) {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

export const securityManager = new SecurityManager();
