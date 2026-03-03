import { ethers, run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Sepolia 测试网配置
const SEPOLIA_CONFIG = {
  USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia USDC
  CHAIN_ID: 11155111,
};

// 部署配置
interface DeployConfig {
  network: string;
  usdcAddress: string;
  treasuryAddress: string;
  verifyContracts: boolean;
}

// 部署记录
interface DeploymentRecord {
  network: string;
  chainId: number;
  deployer: string;
  timestamp: string;
  contracts: {
    GeneRegistry: ContractRecord;
    GeneToken: ContractRecord;
    PaymentHandler: ContractRecordWithArgs;
    GeneExchange: ContractRecordWithArgs;
    GeneMerging: ContractRecordWithArgs;
  };
}

interface ContractRecord {
  address: string;
  txHash: string;
  blockNumber: number;
  verified: boolean;
}

interface ContractRecordWithArgs extends ContractRecord {
  constructorArgs: any[];
}

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

async function main() {
  log("🚀 GenLoop 2.0 智能合约部署", "info");
  log(`网络: ${network.name}`, "info");
  log(`链ID: ${network.config.chainId}`, "info");

  // 获取部署者
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployerBalance = await ethers.provider.getBalance(deployerAddress);

  log(`部署者地址: ${deployerAddress}`, "info");
  log(`部署者余额: ${ethers.formatEther(deployerBalance)} ETH`, "info");

  if (deployerBalance < ethers.parseEther("0.01")) {
    log("⚠️ 警告: 部署者余额可能不足以完成部署", "warning");
    log("请从 Sepolia 水龙头获取测试ETH:", "warning");
    log("  - https://sepoliafaucet.com/", "warning");
    log("  - https://www.infura.io/faucet/sepolia", "warning");
  }

  // 配置
  const config: DeployConfig = {
    network: network.name,
    usdcAddress: process.env.USDC_ADDRESS || SEPOLIA_CONFIG.USDC,
    treasuryAddress: process.env.TREASURY_ADDRESS || deployerAddress,
    verifyContracts: process.env.VERIFY_CONTRACTS !== "false",
  };

  log(`USDC地址: ${config.usdcAddress}`, "info");
  log(`金库地址: ${config.treasuryAddress}`, "info");

  // 初始化部署记录
  const deployment: DeploymentRecord = {
    network: network.name,
    chainId: network.config.chainId || 0,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    contracts: {} as any,
  };

  // ==================== 1. 部署 GeneRegistry ====================
  log("\n========================================", "info");
  log("步骤 1/5: 部署 GeneRegistry (基因注册)", "info");
  log("========================================", "info");

  const GeneRegistry = await ethers.getContractFactory("GeneRegistry");
  const geneRegistry = await GeneRegistry.deploy();
  await geneRegistry.waitForDeployment();

  const geneRegistryAddress = await geneRegistry.getAddress();
  const geneRegistryTx = geneRegistry.deploymentTransaction();

  deployment.contracts.GeneRegistry = {
    address: geneRegistryAddress,
    txHash: geneRegistryTx?.hash || "",
    blockNumber: geneRegistryTx?.blockNumber || 0,
    verified: false,
  };

  log(`✅ GeneRegistry 部署成功!`, "success");
  log(`   地址: ${geneRegistryAddress}`, "success");
  log(`   交易: ${geneRegistryTx?.hash}`, "success");

  await geneRegistry.deploymentTransaction()?.wait(2);

  // ==================== 2. 部署 GeneToken ====================
  log("\n========================================", "info");
  log("步骤 2/5: 部署 GeneToken (基因NFT)", "info");
  log("========================================", "info");

  const GeneToken = await ethers.getContractFactory("GeneToken");
  const geneToken = await GeneToken.deploy();
  await geneToken.waitForDeployment();

  const geneTokenAddress = await geneToken.getAddress();
  const geneTokenTx = geneToken.deploymentTransaction();

  deployment.contracts.GeneToken = {
    address: geneTokenAddress,
    txHash: geneTokenTx?.hash || "",
    blockNumber: geneTokenTx?.blockNumber || 0,
    verified: false,
  };

  log(`✅ GeneToken 部署成功!`, "success");
  log(`   地址: ${geneTokenAddress}`, "success");
  log(`   交易: ${geneTokenTx?.hash}`, "success");

  await geneToken.deploymentTransaction()?.wait(2);

  // ==================== 3. 部署 PaymentHandler ====================
  log("\n========================================", "info");
  log("步骤 3/5: 部署 PaymentHandler (支付处理)", "info");
  log("   支持: ETH + USDC + 法币(支付宝/微信)", "info");
  log("========================================", "info");

  const PaymentHandler = await ethers.getContractFactory("PaymentHandler");
  const paymentHandler = await PaymentHandler.deploy(
    config.treasuryAddress,
    config.usdcAddress
  );
  await paymentHandler.waitForDeployment();

  const paymentHandlerAddress = await paymentHandler.getAddress();
  const paymentHandlerTx = paymentHandler.deploymentTransaction();

  deployment.contracts.PaymentHandler = {
    address: paymentHandlerAddress,
    txHash: paymentHandlerTx?.hash || "",
    blockNumber: paymentHandlerTx?.blockNumber || 0,
    verified: false,
    constructorArgs: [config.treasuryAddress, config.usdcAddress],
  };

  log(`✅ PaymentHandler 部署成功!`, "success");
  log(`   地址: ${paymentHandlerAddress}`, "success");
  log(`   交易: ${paymentHandlerTx?.hash}`, "success");
  log(`   参数: [${config.treasuryAddress}, ${config.usdcAddress}]`, "info");

  await paymentHandler.deploymentTransaction()?.wait(2);

  // ==================== 4. 部署 GeneExchange ====================
  log("\n========================================", "info");
  log("步骤 4/5: 部署 GeneExchange (基因交易)", "info");
  log("   支持: ETH + USDC + 法币支付", "info");
  log("========================================", "info");

  const GeneExchange = await ethers.getContractFactory("GeneExchange");
  const geneExchange = await GeneExchange.deploy(
    geneTokenAddress,
    paymentHandlerAddress
  );
  await geneExchange.waitForDeployment();

  const geneExchangeAddress = await geneExchange.getAddress();
  const geneExchangeTx = geneExchange.deploymentTransaction();

  deployment.contracts.GeneExchange = {
    address: geneExchangeAddress,
    txHash: geneExchangeTx?.hash || "",
    blockNumber: geneExchangeTx?.blockNumber || 0,
    verified: false,
    constructorArgs: [geneTokenAddress, paymentHandlerAddress],
  };

  log(`✅ GeneExchange 部署成功!`, "success");
  log(`   地址: ${geneExchangeAddress}`, "success");
  log(`   交易: ${geneExchangeTx?.hash}`, "success");

  await geneExchange.deploymentTransaction()?.wait(2);

  // ==================== 5. 部署 GeneMerging ====================
  log("\n========================================", "info");
  log("步骤 5/5: 部署 GeneMerging (基因融合)", "info");
  log("========================================", "info");

  const startGeneId = 1;

  const GeneMerging = await ethers.getContractFactory("GeneMerging");
  const geneMerging = await GeneMerging.deploy(
    geneTokenAddress,
    geneRegistryAddress,
    paymentHandlerAddress,
    geneExchangeAddress,
    startGeneId
  );
  await geneMerging.waitForDeployment();

  const geneMergingAddress = await geneMerging.getAddress();
  const geneMergingTx = geneMerging.deploymentTransaction();

  deployment.contracts.GeneMerging = {
    address: geneMergingAddress,
    txHash: geneMergingTx?.hash || "",
    blockNumber: geneMergingTx?.blockNumber || 0,
    verified: false,
    constructorArgs: [
      geneTokenAddress,
      geneRegistryAddress,
      paymentHandlerAddress,
      geneExchangeAddress,
      startGeneId,
    ],
  };

  log(`✅ GeneMerging 部署成功!`, "success");
  log(`   地址: ${geneMergingAddress}`, "success");
  log(`   交易: ${geneMergingTx?.hash}`, "success");

  await geneMerging.deploymentTransaction()?.wait(2);

  // ==================== 配置权限 ====================
  log("\n========================================", "info");
  log("配置合约权限关系", "info");
  log("========================================", "info");

  // 1. GeneMerging 获得 GeneToken 的 MINTER_ROLE
  log("1. 授予 GeneMerging MINTER_ROLE...", "info");
  const MINTER_ROLE = await geneToken.MINTER_ROLE();
  await (await geneToken.grantRole(MINTER_ROLE, geneMergingAddress)).wait();
  log("   ✅ MINTER_ROLE 授予成功", "success");

  // 2. GeneMerging 获得 GeneRegistry 的 REGISTRAR_ROLE
  log("2. 授予 GeneMerging REGISTRAR_ROLE...", "info");
  const REGISTRAR_ROLE = await geneRegistry.REGISTRAR_ROLE();
  await (await geneRegistry.grantRole(REGISTRAR_ROLE, geneMergingAddress)).wait();
  log("   ✅ REGISTRAR_ROLE 授予成功", "success");

  // 3. GeneExchange 获得 PaymentHandler 的 FIAT_PAYMENT_ROLE
  log("3. 授予 GeneExchange FIAT_PAYMENT_ROLE...", "info");
  const FIAT_PAYMENT_ROLE = await paymentHandler.FIAT_PAYMENT_ROLE();
  await (await paymentHandler.grantRole(FIAT_PAYMENT_ROLE, geneExchangeAddress)).wait();
  log("   ✅ FIAT_PAYMENT_ROLE 授予成功", "success");

  // ==================== 保存部署记录 ====================
  log("\n========================================", "info");
  log("保存部署记录", "info");
  log("========================================", "info");

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));
  log(`✅ 部署记录已保存: ${filepath}`, "success");

  // 同时保存为最新部署
  const latestPath = path.join(deploymentsDir, `${network.name}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deployment, null, 2));
  log(`✅ 最新部署记录: ${latestPath}`, "success");

  // 生成 config.ts 配置
  const configContent = generateConfigTs(deployment);
  const configPath = path.join(__dirname, "..", "config", "contract-addresses.ts");
  if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
  }
  fs.writeFileSync(configPath, configContent);
  log(`✅ 合约地址配置已更新: ${configPath}`, "success");

  // ==================== 合约验证 ====================
  if (config.verifyContracts && network.name !== "hardhat" && network.name !== "localhost") {
    log("\n========================================", "info");
    log("开始合约验证", "info");
    log("========================================", "info");

    log("等待 30 秒以确保合约可被验证...", "info");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    for (const [name, contract] of Object.entries(deployment.contracts)) {
      if (!contract) continue;

      try {
        log(`验证 ${name}...`, "info");

        const verifyArgs: any = {
          address: contract.address,
          constructorArguments: (contract as any).constructorArgs || [],
        };

        await run("verify:verify", verifyArgs);

        (contract as any).verified = true;
        log(`✅ ${name} 验证成功!`, "success");
      } catch (error: any) {
        if (error.message.includes("Already Verified")) {
          log(`⚠️ ${name} 已经验证过`, "warning");
          (contract as any).verified = true;
        } else {
          log(`❌ ${name} 验证失败: ${error.message}`, "error");
        }
      }

      // 更新部署记录
      fs.writeFileSync(latestPath, JSON.stringify(deployment, null, 2));
    }
  }

  // ==================== 部署摘要 ====================
  log("\n========================================", "info");
  log("🎉 部署完成摘要", "success");
  log("========================================", "info");

  console.log("\n");
  console.log(`${colors.bright}网络:${colors.reset} ${deployment.network} (Chain ID: ${deployment.chainId})`);
  console.log(`${colors.bright}部署者:${colors.reset} ${deployment.deployer}`);
  console.log(`${colors.bright}时间:${colors.reset} ${deployment.timestamp}`);
  console.log("\n");

  console.log(`${colors.bright}已部署合约:${colors.reset}`);
  console.log("----------------------------------------");

  for (const [name, contract] of Object.entries(deployment.contracts)) {
    if (contract) {
      const verified = (contract as any).verified ? "✅" : "❌";
      console.log(`${colors.cyan}${name}:${colors.reset}`);
      console.log(`  地址: ${contract.address}`);
      console.log(`  交易: ${contract.txHash}`);
      console.log(`  验证: ${verified}`);
      console.log("");
    }
  }

  console.log(`${colors.yellow}⚠️ 重要: 请保存以上合约地址，用于前端配置${colors.reset}`);
  console.log(`${colors.yellow}⚠️ 法币支付需要后端服务配合，确保后端有 FIAT_PAYMENT_ROLE 权限${colors.reset}`);
}

// 生成 config.ts 文件内容
function generateConfigTs(deployment: DeploymentRecord): string {
  return `// GenLoop 2.0 合约地址配置
// 自动生成于: ${deployment.timestamp}
// 网络: ${deployment.network}
// 链ID: ${deployment.chainId}

export const CONTRACT_ADDRESSES = {
  ${deployment.network}: {
    chainId: ${deployment.chainId},
    GeneRegistry: "${deployment.contracts.GeneRegistry.address}",
    GeneToken: "${deployment.contracts.GeneToken.address}",
    PaymentHandler: "${deployment.contracts.PaymentHandler.address}",
    GeneExchange: "${deployment.contracts.GeneExchange.address}",
    GeneMerging: "${deployment.contracts.GeneMerging.address}",
    USDC: "${SEPOLIA_CONFIG.USDC}",
  },
} as const;

export type NetworkType = keyof typeof CONTRACT_ADDRESSES;
export type ContractName = keyof typeof CONTRACT_ADDRESSES[NetworkType];

// 获取当前网络的合约地址
export function getContractAddresses(network: string = "${deployment.network}") {
  const addresses = CONTRACT_ADDRESSES[network as NetworkType];
  if (!addresses) {
    throw new Error(\`Unsupported network: \${network}\`);
  }
  return addresses;
}

// 获取指定合约地址
export function getContractAddress(
  contractName: ContractName,
  network: string = "${deployment.network}"
): string {
  const addresses = getContractAddresses(network);
  return addresses[contractName] as string;
}
`;
}

// 错误处理
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
