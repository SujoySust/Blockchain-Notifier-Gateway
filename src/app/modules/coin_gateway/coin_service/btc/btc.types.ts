export type BtcVin = {
  txid: string;
  vout: number;
  scriptSig: {
    asm: string;
    hex: string;
  };
  sequence: number;
};

export type BtcVout = {
  value: number;
  n: number;
  scriptPubKey: {
    asm: string;
    desc: string;
    hex: string;
    address: string;
    addresses: string[];
    type: string;
  };
};

export type BtcRawTx = {
  in_active_chain: boolean;
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: BtcVin[];
  vout: BtcVout[];
  hex: string;
  blockhash: string;
  confirmations: number;
  time: number;
  blocktime: number;
};

export type BtcBlockTx = {
  txid: string;
  hash: string;
  version: 1;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: BtcVin[];
  vout: BtcVout[];
};

export type BtcBlock = {
  hash: string;
  confirmations: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
  strippedsize: number;
  size: number;
  weight: number;
  tx: BtcBlockTx[];
};

export type BtcUnspent = {
  txid: string;
  vout: number;
  scriptPubKey: string;
  desc: string;
  amount: number;
  height: number;
};

export type BtcNodeUtxos = {
  success: boolean;
  txouts: number;
  height: number;
  bestblock: string;
  unspents: BtcUnspent[];
  total_amount: number;
};
