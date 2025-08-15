# Telegram Crypto Bot (SeiLink-style) — JavaScript

Telegram bot that mirrors SeiLink features but uses **Telegram + Telegraf** and **JavaScript**.

## Features
- `/start` onboarding, custody choice (non-custodial vs custodial hot wallet)
- Prices via CoinGecko: `/price SEI`
- Token sends: `/send 10 USDC 0xABC... on polygon`
- Approvals: `/approve USDC 0xRouter 1000 on ethereum`
- Allowance check: `/allowances USDC 0xRouter on ethereum`
- NFTs (OpenSea): `/nft azuki 1234` (read), `/buy ...`, `/sell ...` (stubs unless API key + wallet available)

## Run (Polling)
```bash
cp .env.example .env
# fill TELEGRAM_BOT_TOKEN and RPCs
npm i
npm run dev:polling
```

## Deploy (Vercel Webhook)
- Set `PUBLIC_URL` to your deployment URL (e.g. https://your-app.vercel.app)
- Deploy to Vercel. The bot sets webhook to `${PUBLIC_URL}/api/telegram` on cold start.
- Alternatively call `/setwebhook` command in chat to force set.

## Env
See `.env.example`.

## Notes
- Custodial mode uses `CUSTODIAL_PRIVATE_KEY` if provided; otherwise prepares unsigned txs.
- Code is simplified and focuses on core flows. Review and harden before production.
