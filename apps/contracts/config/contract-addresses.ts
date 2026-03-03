// GenLoop 2.0 合约地址配置
// 自动生成于: 2026-03-03T02:36:04.727Z
// 网络: sepolia
// 链ID: 11155111

export const CONTRACT_ADDRESSES = {
  sepolia: {
    chainId: 11155111,
    GeneRegistry: "0x69eE5b18C7d698B065b12B9bCC033Cda7F1BFe44",
    GeneToken: "0x6e8e47d3c846Ddf0677D8864504707c33fDfd790",
    PaymentHandler: "0xD4f0ac032E35deB8C9830166Cf5EDDB5352B5436",
    GeneExchange: "0x2CB9Ab014e4D4032CAEbf34bB6778164BE7ACF20",
    GeneMerging: "0x56a8205E10812f4aae2A8e8d034630eEcd29feba",
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
} as const;

export type NetworkType = keyof typeof CONTRACT_ADDRESSES;
export type ContractName = keyof typeof CONTRACT_ADDRESSES[NetworkType];

// 获取当前网络的合约地址
export function getContractAddresses(network: string = "sepolia") {
  const addresses = CONTRACT_ADDRESSES[network as NetworkType];
  if (!addresses) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return addresses;
}

// 获取指定合约地址
export function getContractAddress(
  contractName: ContractName,
  network: string = "sepolia"
): string {
  const addresses = getContractAddresses(network);
  return addresses[contractName] as string;
}
