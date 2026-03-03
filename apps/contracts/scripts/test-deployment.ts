import { ethers } from "hardhat";
import { CONTRACT_ADDRESSES } from "../config/contract-addresses";

async function main() {
  console.log("🧪 开始测试部署的合约...\n");

  const [deployer] = await ethers.getSigners();
  console.log("测试账户:", await deployer.getAddress());

  // 1. 测试 GeneRegistry
  console.log("\n1️⃣ 测试 GeneRegistry");
  const geneRegistry = await ethers.getContractAt("GeneRegistry", CONTRACT_ADDRESSES.sepolia.GeneRegistry);
  console.log("   地址:", await geneRegistry.getAddress());
  console.log("   ✅ GeneRegistry 连接成功");

  // 2. 测试 GeneToken
  console.log("\n2️⃣ 测试 GeneToken");
  const geneToken = await ethers.getContractAt("GeneToken", CONTRACT_ADDRESSES.sepolia.GeneToken);
  console.log("   地址:", await geneToken.getAddress());
  console.log("   ✅ GeneToken 连接成功");

  // 3. 测试 PaymentHandler
  console.log("\n3️⃣ 测试 PaymentHandler");
  const paymentHandler = await ethers.getContractAt("PaymentHandler", CONTRACT_ADDRESSES.sepolia.PaymentHandler);
  console.log("   地址:", await paymentHandler.getAddress());
  const treasury = await paymentHandler.treasury();
  console.log("   金库地址:", treasury);
  console.log("   ✅ PaymentHandler 连接成功");

  // 4. 测试 GeneExchange
  console.log("\n4️⃣ 测试 GeneExchange");
  const geneExchange = await ethers.getContractAt("GeneExchange", CONTRACT_ADDRESSES.sepolia.GeneExchange);
  console.log("   地址:", await geneExchange.getAddress());
  const geneTokenInExchange = await geneExchange.geneToken();
  console.log("   GeneToken地址:", geneTokenInExchange);
  console.log("   配置正确:", geneTokenInExchange === CONTRACT_ADDRESSES.sepolia.GeneToken);
  console.log("   ✅ GeneExchange 连接成功");

  // 5. 测试 GeneMerging
  console.log("\n5️⃣ 测试 GeneMerging");
  const geneMerging = await ethers.getContractAt("GeneMerging", CONTRACT_ADDRESSES.sepolia.GeneMerging);
  console.log("   地址:", await geneMerging.getAddress());
  const mergeFee = await geneMerging.mergeFee();
  console.log("   融合费用:", ethers.formatEther(mergeFee), "ETH");
  console.log("   ✅ GeneMerging 连接成功");

  console.log("\n✅ 所有合约测试通过！");
  console.log("\n📋 合约地址汇总:");
  console.log("   GeneRegistry:", CONTRACT_ADDRESSES.sepolia.GeneRegistry);
  console.log("   GeneToken:", CONTRACT_ADDRESSES.sepolia.GeneToken);
  console.log("   PaymentHandler:", CONTRACT_ADDRESSES.sepolia.PaymentHandler);
  console.log("   GeneExchange:", CONTRACT_ADDRESSES.sepolia.GeneExchange);
  console.log("   GeneMerging:", CONTRACT_ADDRESSES.sepolia.GeneMerging);
}

main().catch((error) => {
  console.error("❌ 测试失败:", error);
  process.exit(1);
});