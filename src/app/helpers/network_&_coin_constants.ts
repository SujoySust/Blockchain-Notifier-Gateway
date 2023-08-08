export enum NETWORK_SLUG {
  //testnets slugs
  ETH_GOERLI = 'goerli',
  ETH_SEPOLIA = 'sepolia',
  BINANCE_TESTNET = 'bsctestnet',
  POLYGON_MUMBAI = 'mumbai',
  BTC_TESTNET = 'btctestnet',

  // mainnets slugs
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  BINANCE_MAINNET = 'bscmainnet',
  BTC_MAINNET = 'btcmainnet',
}

export enum ETH_CHAIN_ID {
  //testnets
  GOERLI = '5',
  SEPOLIA = '11155111',
  BINANCE_TESTNET = '97',
  MUMBAI = '80001',

  //mainnets
  ETHEREUM = '1',
  BINANCE_MAINNET = '56',
  POLYGON = '137',
}

export const NETWORK_TRANSACTION_FEE_LIMIT = {
  // testnets
  [NETWORK_SLUG.ETH_GOERLI]: 60000, // gas limit
  [NETWORK_SLUG.ETH_SEPOLIA]: 60000,
  [NETWORK_SLUG.BINANCE_TESTNET]: 60000,
  [NETWORK_SLUG.POLYGON_MUMBAI]: 60000,
  [NETWORK_SLUG.BTC_TESTNET]: 1, // satoshi per byte

  // mainnets
  [NETWORK_SLUG.ETHEREUM]: 60000,
  [NETWORK_SLUG.POLYGON]: 60000,
  [NETWORK_SLUG.BINANCE_MAINNET]: 60000,
  [NETWORK_SLUG.BTC_MAINNET]: 1, // satoshi per byte
};

export const ETH_GAS_PRICE = {
  // testnets
  [NETWORK_SLUG.ETH_GOERLI]: 10000000000, // gas price in wei
  [NETWORK_SLUG.ETH_SEPOLIA]: 10000000000,
  [NETWORK_SLUG.BINANCE_TESTNET]: 10000000000,
  [NETWORK_SLUG.POLYGON_MUMBAI]: 10000000000,

  // mainnets
  [NETWORK_SLUG.ETHEREUM]: 10000000000,
  [NETWORK_SLUG.POLYGON]: 10000000000,
  [NETWORK_SLUG.BINANCE_MAINNET]: 10000000000,
};

export enum NETWORK_BASE_TYPE {
  BTC = 1,
  ETH = 2,
  TRON = 3,
  SOLANA = 4,
}

export enum COIN_TYPE {
  NATIVE = 1,
  TOKEN = 2,
}

export const NETWORK_BASE_TYPE_COIN_TYPE_MAPPING: any = {
  [NETWORK_BASE_TYPE.BTC]: [COIN_TYPE.NATIVE],
  [NETWORK_BASE_TYPE.ETH]: [COIN_TYPE.NATIVE, COIN_TYPE.TOKEN],
  [NETWORK_BASE_TYPE.TRON]: [COIN_TYPE.NATIVE, COIN_TYPE.TOKEN],
  [NETWORK_BASE_TYPE.SOLANA]: [COIN_TYPE.NATIVE /* , COIN_TYPE.TOKEN */],
};

export enum NATIVE_CURRENCY {
  BTC = 'BTC',
  ETH = 'ETH',
  BNB = 'BNB',
  MATIC = 'MATIC',
}

export const NETWORK_SLUG_MAPPING: {
  [network_slug: NETWORK_SLUG | string]: {
    base_type: NETWORK_BASE_TYPE | number;
    chain_id: ETH_CHAIN_ID | string;
    native_currency: NATIVE_CURRENCY | string;
  };
} = {
  //Test net
  [NETWORK_SLUG.BTC_TESTNET]: {
    base_type: NETWORK_BASE_TYPE.BTC,
    chain_id: null,
    native_currency: NATIVE_CURRENCY.BTC,
  },
  [NETWORK_SLUG.ETH_GOERLI]: {
    base_type: NETWORK_BASE_TYPE.ETH,
    chain_id: ETH_CHAIN_ID.GOERLI,
    native_currency: NATIVE_CURRENCY.ETH,
  },
  [NETWORK_SLUG.ETH_SEPOLIA]: {
    base_type: NETWORK_BASE_TYPE.ETH,
    chain_id: ETH_CHAIN_ID.SEPOLIA,
    native_currency: NATIVE_CURRENCY.ETH,
  },
  [NETWORK_SLUG.BINANCE_TESTNET]: {
    base_type: NETWORK_BASE_TYPE.ETH,
    chain_id: ETH_CHAIN_ID.BINANCE_TESTNET,
    native_currency: NATIVE_CURRENCY.BNB,
  },
  [NETWORK_SLUG.POLYGON_MUMBAI]: {
    base_type: NETWORK_BASE_TYPE.ETH,
    chain_id: ETH_CHAIN_ID.MUMBAI,
    native_currency: NATIVE_CURRENCY.MATIC,
  },
  // Mainnet
  [NETWORK_SLUG.BTC_MAINNET]: {
    base_type: NETWORK_BASE_TYPE.BTC,
    chain_id: null,
    native_currency: NATIVE_CURRENCY.BTC,
  },
  [NETWORK_SLUG.ETHEREUM]: {
    base_type: NETWORK_BASE_TYPE.ETH,
    chain_id: ETH_CHAIN_ID.ETHEREUM,
    native_currency: NATIVE_CURRENCY.ETH,
  },
  [NETWORK_SLUG.POLYGON]: {
    base_type: NETWORK_BASE_TYPE.ETH,
    chain_id: ETH_CHAIN_ID.POLYGON,
    native_currency: NATIVE_CURRENCY.MATIC,
  },
  [NETWORK_SLUG.BINANCE_MAINNET]: {
    base_type: NETWORK_BASE_TYPE.ETH,
    chain_id: ETH_CHAIN_ID.BINANCE_MAINNET,
    native_currency: NATIVE_CURRENCY.BNB,
  },
};

export const EXPLORER_URLS: {
  [network_slug: NETWORK_SLUG | string]: {
    base_url: string;
    token_endpoint: string;
    address_endpoint: string;
    tx_endpoint: string;
  };
} = {
  // testnets
  [NETWORK_SLUG.BTC_TESTNET]: {
    base_url: 'https://blockstream.info/testnet',
    token_endpoint: null,
    address_endpoint: '/address',
    tx_endpoint: '/tx',
  },
  [NETWORK_SLUG.ETH_GOERLI]: {
    base_url: 'https://goerli.etherscan.io',
    token_endpoint: '/token',
    address_endpoint: '/address',
    tx_endpoint: '/tx',
  },
  [NETWORK_SLUG.ETH_SEPOLIA]: {
    base_url: 'https://sepolia.etherscan.io',
    token_endpoint: '/token',
    address_endpoint: '/address',
    tx_endpoint: '/tx',
  },
  [NETWORK_SLUG.BINANCE_TESTNET]: {
    base_url: 'https://testnet.bscscan.com',
    token_endpoint: '/token',
    address_endpoint: '/address',
    tx_endpoint: '/tx',
  },
  [NETWORK_SLUG.POLYGON_MUMBAI]: {
    base_url: 'https://mumbai.polygonscan.com',
    token_endpoint: '/token',
    address_endpoint: '/address',
    tx_endpoint: '/tx',
  },

  // mainnets
  [NETWORK_SLUG.BTC_MAINNET]: {
    base_url: 'https://blockstream.info',
    token_endpoint: null,
    address_endpoint: '/address',
    tx_endpoint: '/tx',
  },
  [NETWORK_SLUG.ETHEREUM]: {
    base_url: 'https://etherscan.io',
    token_endpoint: '/token',
    address_endpoint: '/address',
    tx_endpoint: '/tx',
  },
  [NETWORK_SLUG.POLYGON]: {
    base_url: 'https://polygonscan.com',
    token_endpoint: '/token',
    address_endpoint: '/address',
    tx_endpoint: '/tx',
  },
  [NETWORK_SLUG.BINANCE_MAINNET]: {
    base_url: 'https://bscscan.com',
    token_endpoint: '/token',
    address_endpoint: '/address',
    tx_endpoint: '/tx',
  },
};

export const EthSlugChainMapping = {
  [NETWORK_SLUG.ETH_GOERLI]: {
    chainId: ETH_CHAIN_ID.GOERLI,
  },
  [NETWORK_SLUG.ETH_SEPOLIA]: {
    chainId: ETH_CHAIN_ID.SEPOLIA,
  },
  [NETWORK_SLUG.BINANCE_TESTNET]: {
    chainId: ETH_CHAIN_ID.BINANCE_TESTNET,
  },
  [NETWORK_SLUG.POLYGON_MUMBAI]: {
    chainId: ETH_CHAIN_ID.MUMBAI,
  },
  [NETWORK_SLUG.ETHEREUM]: {
    chainId: ETH_CHAIN_ID.ETHEREUM,
  },
  [NETWORK_SLUG.POLYGON]: {
    chainId: ETH_CHAIN_ID.POLYGON,
  },
  [NETWORK_SLUG.BINANCE_MAINNET]: {
    chainId: ETH_CHAIN_ID.BINANCE_MAINNET,
  },
};

export enum CACHE_KEYS {
  WALLET_ADDRESSES = 'wallet_addresses',
  TOKEN_ADDRESSES = 'token_addresses',
  WITHDRAWAL_TXIDS = 'withdrawal_txids',
}

export const BLOCK_FETCH_INTERVAL_SEC =
  Number(process.env.NETWORK_BLOCK_FETCH_INTERVAL_IN_SECOND) || 60;
