import { ethers } from 'ethers'; import dotenv from 'dotenv'; dotenv.config(); const provider = new ethers.JsonRpcProvider(process.env.SEI_RPC_URL);
const MARKET_ABI = ['function list(address,uint256,uint256) external', 'function buy(address,uint256) external payable', 'function cancel(address,uint256) external'];
const ERC721_ABI = ['function balanceOf(address owner) view returns (uint256)', 'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)', 'function ownerOf(uint256 tokenId) view returns (address)', 'function approve(address to, uint256 tokenId) external'];
export async function listNFTForSale(marketplaceAddress, nftContract, tokenId, priceSEI, privateKey) {
  const signer = new ethers.Wallet(privateKey || process.env.SEI_PRIVATE_KEY, provider);
  const market = new ethers.Contract(marketplaceAddress, MARKET_ABI, signer);
  const tx = await market.list(nftContract, BigInt(tokenId), ethers.parseEther(String(priceSEI)));
  const receipt = await tx.wait();
  return receipt.transactionHash;
}
export async function buyNFT(marketplaceAddress, nftContract, tokenId, priceSEI, privateKey) {
  const signer = new ethers.Wallet(privateKey || process.env.SEI_PRIVATE_KEY, provider);
  const market = new ethers.Contract(marketplaceAddress, MARKET_ABI, signer);
  const tx = await market.buy(nftContract, BigInt(tokenId), { value: ethers.parseEther(String(priceSEI)) });
  const receipt = await tx.wait();
  return receipt.transactionHash;
}
export async function getMyNFTs(nftContractAddress, ownerAddress) {
  const nft = new ethers.Contract(nftContractAddress, ERC721_ABI, provider);
  const balance = Number(await nft.balanceOf(ownerAddress).catch(() => 0n));
  const ids = [];
  const cap = Math.min(balance, 200);
  for (let i = 0; i < cap; i++) {
    try {
      const tid = await nft.tokenOfOwnerByIndex(ownerAddress, i);
      ids.push(tid.toString());
    } catch (e) {
      break;
    }
  }
  return ids;
}
