import dotenv from 'dotenv';
dotenv.config();

import * as localSei from '../utils/seiService.js';

let pluginSei = null;
let pluginActions = null;
let pluginProviders = null;

/**
 * Attempt to dynamically import the official @elizaos/plugin-sei.
 * The plugin is designed to be used inside the Eliza runtime; its
 * exported shape may vary across versions. We try several common forms:
 *  - named export: { seiPlugin }
 *  - default export
 *  - package export that already exposes actions/providers
 *
 * If the plugin is not available or does not expose callable actions,
 * we fall back to the local seiService adapter (localSei).
 */
async function loadPlugin() {
  if (pluginSei !== null) return;
  try {
    const mod = await import('@elizaos/plugin-sei');
    // common variants
    pluginSei = mod.seiPlugin || mod.default || mod;
    // try to locate actions/providers
    pluginActions = pluginSei?.actions || pluginSei?.plugin?.actions || pluginSei;
    pluginProviders = pluginSei?.providers || pluginSei?.plugin?.providers || pluginSei?.providers || null;

    console.log('[elizaShim] Loaded @elizaos/plugin-sei. Detected exports:', {
      hasActions: !!pluginActions,
      hasProviders: !!pluginProviders
    });
  } catch (e) {
    console.log('[elizaShim] @elizaos/plugin-sei not installed or failed to load. Falling back to local seiService.', e?.message || e);
    pluginSei = null;
    pluginActions = null;
    pluginProviders = null;
  }
}

/**
 * Try to call SEND_TOKEN action exposed by plugin; otherwise call localSei.sendSEINative / sendERC20
 */
export async function sendTokenViaPluginOrLocal({ to, amount, tokenAddress }) {
  await loadPlugin();
  // prefer plugin action if available
  if (pluginActions && typeof pluginActions.SEND_TOKEN === 'function') {
    try {
      const res = await pluginActions.SEND_TOKEN({ to, amount, tokenAddress });
      return { source: 'plugin', result: res };
    } catch (e) {
      console.error('[elizaShim] plugin SEND_TOKEN failed', e);
      // fallthrough to local
    }
  }

  // fallback local
  try {
    if (!tokenAddress) {
      const tx = await localSei.sendSEINative(to, amount);
      return { source: 'local', result: tx };
    } else {
      const tx = await localSei.sendERC20(tokenAddress, to, amount);
      return { source: 'local', result: tx };
    }
  } catch (e) {
    console.error('[elizaShim] local send failed', e);
    throw e;
  }
}

/**
 * Try to read balance via plugin providers or local adapter
 */
export async function getBalanceViaPluginOrLocal(address) {
  await loadPlugin();
  if (pluginProviders && pluginProviders.walletProvider && typeof pluginProviders.walletProvider.getBalance === 'function') {
    try {
      const b = await pluginProviders.walletProvider.getBalance(address);
      return { source: 'plugin', balance: b };
    } catch (e) {
      console.error('[elizaShim] plugin getBalance failed', e);
    }
  }

  // fallback
  const b = await localSei.getBalanceSEI(address);
  return { source: 'local', balance: b };
}

/**
 * This function is used by the bot: given free text, the shim will
 * try to interpret and (if possible) call plugin actions. If plugin
 * isn't present or can't handle the request, returns null so the
 * normal local agent can parse the text.
 *
 * Returns:
 *  - { reply } to send a textual reply to user, OR
 *  - { intent } for the bot to call handleCommand(intent)
 *  - null if shim didn't handle it
 */
export async function elizaForward(text, msg) {
  // quick heuristic patterns
  const lower = String(text || '').toLowerCase();

  // "send X to 0x..."
  let m = lower.match(/send\\s+(\\d+(?:\\.\\d+)?)\\s+\\w*\\s+to\\s+(0x[a-f0-9]{40}|sei1[a-z0-9]{38,})/i);
  if (m) {
    const amount = m[1];
    const to = m[2];
    // try plugin/local send
    try {
      const out = await sendTokenViaPluginOrLocal({ to, amount, tokenAddress: null });
      return { reply: `✅ Sent ${amount} (via ${out.source}). Result: ${JSON.stringify(out.result)}` };
    } catch (e) {
      return { reply: `⚠️ Failed to send: ${e?.message || String(e)}` };
    }
  }

  // "balance of ADDRESS"
  m = lower.match(/balance of\\s+(0x[a-f0-9]{40}|sei1[a-z0-9]{38,})/i);
  if (m) {
    const addr = m[1];
    try {
      const res = await getBalanceViaPluginOrLocal(addr);
      return { reply: `💰 Balance (${res.source}): ${res.balance}` };
    } catch (e) {
      return { reply: `⚠️ Failed to fetch balance: ${e?.message || String(e)}` };
    }
  }

  // if plugin is present, offer to let Eliza agent process (advanced)
  await loadPlugin();
  if (pluginSei) {
    // many Eliza plugins are designed to be called by agent planner rather than direct API.
    // We return null to let the main agent or local OpenAI parser decide the exact action.
    return null;
  }

  // not handled
  return null;
}
