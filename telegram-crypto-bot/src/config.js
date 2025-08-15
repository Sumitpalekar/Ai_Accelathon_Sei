import 'dotenv/config';

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
export const PUBLIC_URL = process.env.PUBLIC_URL || '';
export const DEFAULT_CHAIN = (process.env.DEFAULT_CHAIN || 'sei').toLowerCase();

export const RPC = {
  ethereum: process.env.ETHEREUM_RPC || '',
  polygon: process.env.POLYGON_RPC || '',
  sei: process.env.SEI_RPC || '',
};

export const CUSTODIAL_PRIVATE_KEY = process.env.CUSTODIAL_PRIVATE_KEY || '';

export const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || '';
export const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || '';

export function requireEnv(name, value) {
  if (!value) throw new Error(`Missing env: ${name}`);
}
