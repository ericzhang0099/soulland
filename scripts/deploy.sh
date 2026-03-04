#!/bin/bash

# GenLoop 3.0 部署脚本

set -e

echo "🚀 GenLoop 3.0 Deployment Script"
echo "================================"

# 检查环境变量
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not set"
    exit 1
fi

if [ -z "$SEPOLIA_RPC_URL" ]; then
    echo "❌ SEPOLIA_RPC_URL not set"
    exit 1
fi

# 部署合约
echo ""
echo "📦 Deploying Contracts..."
cd apps/contracts
npx hardhat run deploy/00_deploy_core.js --network sepolia

# 保存合约地址
echo ""
echo "💾 Saving contract addresses..."
CONTRACT_ADDRESSES=$(cat deployments/sepolia.json)
echo "$CONTRACT_ADDRESSES"

# 部署后端
echo ""
echo "🔧 Deploying Backend..."
cd ../api
npm ci
npm run build

# 部署前端
echo ""
echo "🎨 Deploying Frontend..."
cd ../web
npm ci
npm run build

echo ""
echo "✅ Deployment Complete!"
echo "========================"
