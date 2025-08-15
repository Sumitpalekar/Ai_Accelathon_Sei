import { getAsset } from '../services/opensea.js';
import { parseChainHint } from '../utils/validation.js';

export function registerNft(bot) {
  bot.command('nft', async (ctx) => {
    try {
      // /nft azuki 1234 on ethereum
      const m = ctx.message.text.match(/^\/nft\s+(\S+)\s+(\S+)(.*)$/);
      if (!m) return ctx.reply('Usage: /nft <collectionSlug> <tokenId> [on <chain>]');
      const [_, collection, tokenId, rest] = m;
      const chain = parseChainHint(rest, 'ethereum');
      const data = await getAsset(chain, collection, tokenId);
      const nft = data?.nft || data;
      if (!nft) return ctx.reply('Not found on OpenSea.');
      const img = nft.image_url || nft.display_image_url || nft.preview_image_url;
      if (img) await ctx.replyWithPhoto(img, { caption: `${nft.name || `${collection} #${tokenId}`}` });
      else await ctx.reply(`${nft.name || `${collection} #${tokenId}`}`);
    } catch (e) {
      await ctx.reply('NFT fetch failed: ' + (e?.message || e));
    }
  });
}
