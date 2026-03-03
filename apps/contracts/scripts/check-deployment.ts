import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message: string, type: "info" | "success" | "warning" | "error" = "info") {
  const color = {
    info: colors.cyan,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red,
  }[type];
  console.log(`${color}${colors.bright}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

interface DeploymentData {
  network: string;
  contracts: Record<string, { address: string }>;
}

async function main() {
  const [checker] = await ethers.getSigners();
  const checkerAddress = await checker.getAddress();

  log("🔍 检查 GenLoop 2.0 部署状态", "info");
  log(`检查者地址: ${checkerAddress}`, "info");

  // 读取部署记录
  const networkName = process.env.HARDHAT_NETWORK || "sepolia";
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const latestFile = path.join(deploymentsDir, `${networkName}-latest.json`);

  if (!fs.existsSync(latestFile)) {
    log(`❌ 未找到 ${networkName} 的部署记录`, "error");
    return;
  }

  const deployment: DeploymentData = JSON.parse(fs.readFileSync(latestFile, "utf-8"));

  log(`\n网络: ${deployment.network}`, "info");
  log("========================================", "info");

  let allHealthy = true;

  // 检查每个合约
  for (const [name, contractInfo] of Object.entries(deployment.contracts)) {
    if (!contractInfo?.address) continue;

    try {
      log(`\n检查 ${name}...`, "info");
      log(`地址: ${contractInfo.address}`, "info");

      // 获取代码
      const code = await ethers.provider.getCode(contractInfo.address);

      if (code === "0x") {
        log(`  ❌ 该地址没有合约代码`, "error");
        allHealthy = false;
        continue;
      }

      log(`  ✅ 合约代码存在`, "success");
      log(`  代码大小: ${(code.length - 2) / 2} bytes`, "info");

      // 尝试获取合约实例并调用基本函数
      try {
        const contract = await ethers.getContractAt(name, contractInfo.address);

        if (name === "GeneToken") {
          const symbol = await contract.symbol();
          const name_str = await contract.name();
          log(`  名称: ${name_str}`, "success");
          log(`  符号: ${symbol}`, "success");
        } else if (name === "GeneRegistry") {
          const totalGenes = await contract.totalGenes();
          const nextGeneId = await contract.nextGeneId();
          log(`  总基因数: ${totalGenes}`, "success");
          log(`  下一个基因ID: ${nextGeneId}`, "success");
        } else if (name === "PaymentHandler") {
          const treasury = await contract.treasury();
          const platformFee = await contract.PLATFORM_FEE_BPS();
          const usdc = await contract.usdcAddress();
          log(`  金库地址: ${treasury}`, "success");
          log(`  USDC地址: ${usdc}`, "success");
          log(`  平台费率: ${platformFee} bps (1%)`, "success");
        } else if (name === "GeneExchange") {
          const nextOrderId = await contract.nextOrderId();
          log(`  下一个订单ID: ${nextOrderId}`, "success");
        } else if (name === "GeneMerging") {
          const mergeFee = await contract.mergeFee();
          const totalMerges = await contract.totalMerges();
          log(`  融合费用: ${ethers.formatEther(mergeFee)} ETH`, "success");
          log(`  总融合数: ${totalMerges}`, "success");
        }

        log(`  ✅ ${name} 运行正常`, "success");
      } catch (callError: any) {
        log(`  ⚠️ 合约存在但调用失败: ${callError.message}`, "warning");
      }
    } catch (error: any) {
      log(`  ❌ 检查失败: ${error.message}`, "error");
      allHealthy = false;
    }
  }

  // 检查权限配置
  log("\n========================================", "info");
  log("检查权限配置", "info");
  log("========================================", "info");

  try {
    const geneToken = await ethers.getContractAt("GeneToken", deployment.contracts.GeneToken.address);
    const geneRegistry = await ethers.getContractAt("GeneRegistry", deployment.contracts.GeneRegistry.address);
    const paymentHandler = await ethers.getContractAt("PaymentHandler", deployment.contracts.PaymentHandler.address);
    const geneMergingAddress = deployment.contracts.GeneMerging.address;
    const geneExchangeAddress = deployment.contracts.GeneExchange.address;

    // 检查 MINTER_ROLE
    const MINTER_ROLE = await geneToken.MINTER_ROLE();
    const hasMinterRole = await geneToken.hasRole(MINTER_ROLE, geneMergingAddress);
    log(`\nGeneMerging 在 GeneToken 中的 MINTER_ROLE:`, "info");
    log(`  ${hasMinterRole ? "✅ 已授予" : "❌ 未授予"}`, hasMinterRole ? "success" : "error");
    if (!hasMinterRole) allHealthy = false;

    // 检查 REGISTRAR_ROLE
    const REGISTRAR_ROLE = await geneRegistry.REGISTRAR_ROLE();
    const hasRegistrarRole = await geneRegistry.hasRole(REGISTRAR_ROLE, geneMergingAddress);
    log(`\nGeneMerging 在 GeneRegistry 中的 REGISTRAR_ROLE:`, "info");
    log(`  ${hasRegistrarRole ? "✅ 已授予" : "❌ 未授予"}`, hasRegistrarRole ? "success" : "error");
    if (!hasRegistrarRole) allHealthy = false;

    // 检查 FIAT_PAYMENT_ROLE
    const FIAT_PAYMENT_ROLE = await paymentHandler.FIAT_PAYMENT_ROLE();
    const hasFiatPaymentRole = await paymentHandler.hasRole(FIAT_PAYMENT_ROLE, geneExchangeAddress);
    log(`\nGeneExchange 在 PaymentHandler 中的 FIAT_PAYMENT_ROLE:`, "info");
    log(`  ${hasFiatPaymentRole ? "✅ 已授予" : "❌ 未授予"}`, hasFiatPaymentRole ? "success" : "error");
    if (!hasFiatPaymentRole) allHealthy = false;

  } catch (error: any) {
    log(`权限检查失败: ${error.message}`, "error");
    allHealthy = false;
  }

  // 最终摘要
  log("\n========================================", "info");
  log("检查完成摘要", "info");
  log("========================================", "info");

  if (allHealthy) {
    log("✅ 所有合约运行正常，权限配置正确", "success");
  } else {
    log("⚠️ 发现一些问题，请查看上方详细信息", "warning");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
