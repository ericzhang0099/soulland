/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_IDENTITY_NFT_ADDRESS: process.env.NEXT_PUBLIC_IDENTITY_NFT_ADDRESS,
    NEXT_PUBLIC_AGC_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_AGC_TOKEN_ADDRESS,
    NEXT_PUBLIC_GENE_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_GENE_TOKEN_ADDRESS,
  },
}

module.exports = nextConfig
