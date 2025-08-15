import { ethers } from 'ethers';
import { RPC, DEFAULT_CHAIN, CUSTODIAL_PRIVATE_KEY } from '../config.js';

export function providerFor(chain=DEFAULT_CHAIN) {
  const url = RPC[chain];
  if (!url) throw new Error(`Missing RPC for chain: ${chain}`);
  return new ethers.JsonRpcProvider(url);
}

export function signerFor(chain=DEFAULT_CHAIN) {
  const provider = providerFor(chain);
  if (!CUSTODIAL_PRIVATE_KEY) return null;
  return new ethers.Wallet(CUSTODIAL_PRIVATE_KEY, provider);
}

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

export function erc20(token, provider) {
  return new ethers.Contract(token, ERC20_ABI, provider);
}

export function parseUnits(amount, decimals) {
  return ethers.parseUnits(String(amount), decimals);
}
