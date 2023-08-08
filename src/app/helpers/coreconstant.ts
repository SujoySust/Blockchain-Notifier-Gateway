export const STATUS_INACTIVE = 0;
export const STATUS_ACTIVE = 1;
export const STATUS_EXPIRED = 7;

export enum USER_STATUS {
  INACTIVE = 0,
  ACTIVE = 1,
  DISABLED = 2,
  SUSPENDED = 3,
}

export enum APP_ENV {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  LOCAL = 'local',
}

export enum REGEX {
  BTC_TXID = '^[a-fA-F0-9]{64}$',
  ETH_TXHASH = '^0x[a-fA-F0-9]{64}$',
  ETH_ADDRESS = '^0x[a-fA-F0-9]{40}$',
}
export const DEAFAULT_MAX_DATA_SIZE_IN_BYTE = 10000000; // 10 mb
export const DEAFAULT_MAX_FILE_UPLOAD_SIZE_IN_BYTE = 2000000; // 2 mb
export const DEFAULT_MAX_FILE_UPLOADS_AT_A_TIME = 10;

export enum SYSTEM_MESSAGES {
  SYNC_MISSING_BALANCE = "If you have balance in blockchain, but can't see it here, then sync balance and try again.",
}
