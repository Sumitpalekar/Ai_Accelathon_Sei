import { ethers } from 'ethers'; import dotenv from 'dotenv'; dotenv.config(); const provider = new ethers.JsonRpcProvider(process.env.SEI_RPC_URL);
const ERC20_ABI = ['function decimals() view returns (uint8)', 'function approve(address spender, uint256 amount) returns (bool)', 'function allowance(address owner, address spender) view returns (uint256)'];
const ROUTER_ABI = ['function swapExactTokensForTokens(uint256,uint256,address[],address,uint256) returns (uint256[])', 'function swapExactETHForTokens(uint256,address[],address,uint256) payable returns (uint256[])'];
export async function swapExactTokensForTokens(tokenIn, tokenOut, amount, recipient, privateKey) {
  if (!process.env.DEX_ROUTER) throw new Error('DEX_ROUTER not set');
  const signer = new ethers.Wallet(privateKey || process.env.SEI_PRIVATE_KEY, provider);
  const router = new ethers.Contract(process.env.DEX_ROUTER, ROUTER_ABI, signer);
  const erc20 = new ethers.Contract(tokenIn, ERC20_ABI, signer);
  const decimals = Number(await erc20.decimals().catch(() => 18));
  const amtIn = ethers.parseUnits(String(amount), decimals);
  const allowance = await erc20.allowance(await signer.getAddress(), router.target || router.address);
  if (BigInt(allowance) < BigInt(amtIn)) {
    const aTx = await erc20.approve(router.target || router.address, amtIn);
    await aTx.wait();
  }
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const tx = await router.swapExactTokensForTokens(amtIn, 0, [tokenIn, tokenOut], recipient, deadline);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}
export async function swapExactETHForTokens(tokenOut, amountEther, recipient, privateKey) {
  if (!process.env.DEX_ROUTER) throw new Error('DEX_ROUTER not set');
  const signer = new ethers.Wallet(privateKey || process.env.SEI_PRIVATE_KEY, provider);
  const router = new ethers.Contract(process.env.DEX_ROUTER, ROUTER_ABI, signer);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const tx = await router.swapExactETHForTokens(0, [process.env.WSEI, tokenOut], recipient, deadline, { value: ethers.parseEther(String(amountEther)) });
  const receipt = await tx.wait();
  return receipt.transactionHash;
}
