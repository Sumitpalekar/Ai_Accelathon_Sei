import dotenv from 'dotenv';
import { ethers } from 'ethers';
dotenv.config();
const RPC = process.env.SEI_RPC_URL; if (!RPC) throw new Error('SEI_RPC_URL not set in .env');
const provider = new ethers.JsonRpcProvider(RPC);
export function getSigner(opts = {}) {
  const pk = opts.privateKey || process.env.SEI_PRIVATE_KEY;
  const mnemonic = opts.mnemonic || process.env.SEI_MNEMONIC;
  if (pk) { if (!String(pk).startsWith('0x')) throw new Error('SEI private key must begin with 0x'); return new ethers.Wallet(pk, provider); }
  if (mnemonic) { return ethers.Wallet.fromPhrase(mnemonic).connect(provider); }
  return null;
}
export async function getBalanceSEI(address) { if (!address) throw new Error('address required'); const bal = await provider.getBalance(address); return ethers.formatEther(bal); }
export async function sendSEINative(to, amountSEI, opts = {}) { const signer = getSigner(opts); if (!signer) throw new Error('No signer available (set SEI_PRIVATE_KEY or SEI_MNEMONIC)'); const tx = await signer.sendTransaction({ to, value: ethers.parseEther(String(amountSEI)), gasLimit: opts.gasLimit || undefined, }); const receipt = await tx.wait(); return receipt.transactionHash; }
const ERC20_ABI = ['function decimals() view returns (uint8)', 'function transfer(address to, uint256 amount) returns (bool)', 'function approve(address spender, uint256 amount) returns (bool)', 'function allowance(address owner, address spender) view returns (uint256)', 'function balanceOf(address owner) view returns (uint256)'];
export async function sendERC20(tokenAddress, to, amount, opts = {}) { if (!tokenAddress) throw new Error('tokenAddress required'); const signer = getSigner(opts); if (!signer) throw new Error('No signer available (set SEI_PRIVATE_KEY or SEI_MNEMONIC)'); const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer); const decimals = Number(await token.decimals().catch(() => 18)); const amt = ethers.parseUnits(String(amount), decimals); const tx = await token.transfer(to, amt, { gasLimit: opts.gasLimit || undefined }); const receipt = await tx.wait(); return receipt.transactionHash; }
export function normalizeAddress(addr) { if (!addr) return addr; if (addr.startsWith('0x') || addr.startsWith('sei1')) return addr; return addr; }
