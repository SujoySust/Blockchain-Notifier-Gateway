import * as btc from '@dip1059/bitcoin';
import * as bitcoin from 'bitcoinjs-lib';

import {
  STATUS_ACTIVE,
  STATUS_EXPIRED,
  SYSTEM_MESSAGES,
} from '../../../../helpers/coreconstant';
import { BtcUtxo } from '@prisma/client';
import { ResponseModel } from '../../../../models/custom/common.response.model';
import { NetworkModel } from '../../../../models/db/network.model';
import { CoinModel } from '../../../../models/db/coin.model';
import {
  __,
  addNumbers,
  convertCoinAmountFromInt,
  convertCoinAmountToInt,
  errorResponse,
  minusNumbers,
  prisma_client,
  successResponse,
} from '../../../../helpers/functions';
import { NETWORK_TRANSACTION_FEE_LIMIT } from '../../../../helpers/network_&_coin_constants';

type txObj = {
  from: string;
  to: string;
  amount: number;
};

type Opts = {
  private_key: string;
};

export type SendBTCPayload = {
  client: btc.Client;
  network: NetworkModel;
  coin: CoinModel;
  btcNetwork: bitcoin.Network;
  transaction: txObj;
  opts: Opts;
};

export async function processAndSendBTC(
  payload: SendBTCPayload,
): Promise<string> {
  const { client, network, coin, btcNetwork, transaction, opts } = payload;
  let message = '';
  const coinDecimal = coin.decimal;
  const cryptoCode = coin.currency.code;
  const amount = Number(
    convertCoinAmountToInt(transaction.amount, coinDecimal),
  );
  const byteFee = NETWORK_TRANSACTION_FEE_LIMIT[network.slug];
  let balance = 0;
  let txFee = 224; // amount in smallest unit (satoshi) // aporx 1 input -> 2 output fee for 1sat/perbyte
  let required = amount + txFee;

  const utxos = await getUtxos(transaction.from, network.slug);
  const inputs = [];

  while (balance < required) {
    if (!utxos.length) {
      balance = Number(convertCoinAmountFromInt(balance, coinDecimal));
      required = Number(convertCoinAmountFromInt(required, coinDecimal));
      const balanceShortage = minusNumbers(required, balance);

      message = `${__('Insufficient')} ${cryptoCode} ${__(
        'balance including fee',
      )}!!\n
       ${__('balance required')}: ${required.toFixed(10)} ${cryptoCode}\n
       ${__('balance exists')}: ${balance.toFixed(10)} ${cryptoCode}\n
       ${__('balance shortage')}: ${balanceShortage.toFixed(12)} ${cryptoCode}\n
       ${__('Try less amount. Or, ')}\n
       ${__(SYSTEM_MESSAGES.SYNC_MISSING_BALANCE)}`;

      throw new Error(message);
    }
    const utxo = utxos.pop();
    inputs.push(utxo);
    balance = addNumbers(
      balance,
      Number(convertCoinAmountToInt(utxo.amount, coinDecimal)),
    );
    txFee = Math.round(148 * inputs.length + 2 * 34 + 10) * byteFee;
    required = addNumbers(amount, txFee);
  }
  // Create a new transaction
  const changeBalace = minusNumbers(balance, amount, txFee);
  const keyPair = load_keypair(btcNetwork, opts.private_key);
  const tx = new bitcoin.TransactionBuilder(btcNetwork);

  // for p2pwkh addresses
  const prevOutScript = bitcoin.payments.p2wpkh({
    network: btcNetwork,
    pubkey: keyPair.publicKey,
  }).output;
  //

  // add transaction inputs
  inputs.map((input: BtcUtxo) =>
    tx.addInput(input.txid, input.vout, null, prevOutScript),
  ); // the txid hash and the vout index of the deposit

  tx.addOutput(payload.transaction.to, amount);

  if (changeBalace > 0) {
    tx.addOutput(transaction.from, changeBalace);
  }

  inputs.map((input: BtcUtxo, index: number) =>
    tx.sign(
      index,
      keyPair,
      null,
      null,
      Number(convertCoinAmountToInt(input.amount, coinDecimal)),
      null,
    ),
  );

  // build the trasaction
  const rawtx = tx.build();
  const txId = rawtx.getId();
  const rawHex = rawtx.getHash();

  await client.sendRawTransaction(rawHex);
  clearSpentUtxos(inputs);

  return txId;
}

async function getUtxos(
  address: string,
  network_slug: string,
): Promise<BtcUtxo[]> {
  const walletKey = await prisma_client.walletKey.findFirst({
    where: {
      network: {
        slug: network_slug,
      },
      address: {
        equals: address,
        mode: 'insensitive',
      },
    },
  });

  if (!walletKey) return [];
  return prisma_client.btcUtxo.findMany({
    where: {
      key_id: walletKey.id,
      status: STATUS_ACTIVE,
    },
  });
}

async function clearSpentUtxos(spentUtxos: BtcUtxo[]) {
  try {
    const spentUtxosIds: string[] = [];
    spentUtxos.map((utxo: BtcUtxo) => {
      spentUtxosIds.push(utxo.id);
    });

    await prisma_client.btcUtxo.findMany({
      where: {
        id: {
          in: spentUtxosIds,
        },
        status: STATUS_EXPIRED,
      },
    });
    return true;
  } catch (error) {
    console.error(error.stack);
  }
}

function load_keypair(
  btcNetwork: bitcoin.Network,
  privateKey: string,
  encoding: BufferEncoding = 'hex',
) {
  return bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, encoding), {
    network: btcNetwork,
  });
}

export async function estimateFee(
  network: NetworkModel,
  coin: CoinModel,
  transaction: txObj,
): Promise<ResponseModel> {
  let message = '';
  const coinDecimal = coin.decimal;
  const cryptoCode = coin.currency.code;
  const from_address = transaction.from;

  // const amount = multiplyNumbers(transaction.amount, SATOSHI); // convert to satoshi
  const amount = Number(
    convertCoinAmountToInt(transaction.amount, coinDecimal),
  ); // from btc to smallest unit (satoshi);

  const byteFee = NETWORK_TRANSACTION_FEE_LIMIT[network.slug]; //per byte fee in satoshi

  let balance = 0;
  let txfee = 224; //approx 1 in 1 out fee for 1sat/perbyte
  let required = amount + txfee;

  const utxos = await getUtxos(from_address, network.slug);
  // const utxos = (await getUtxosNode(client, from_address))?.unspents ?? [];

  const inputs = [];

  // add the list of utxos as inputs for the transaction one at a time
  // until the requirements are met and the balance exceeds the amount we need
  // to send plus the transaction fee
  while (balance < required) {
    if (!utxos.length) {
      // const changeBalance = minusNumbers(balance, amount, txfee);
      // console.log('amount: ', amount);
      // console.log('fee: ', txfee);
      // console.log('required: ', required);
      // console.log('balance: ', balance);
      // console.log('changeBal: ', changeBalance);

      balance = Number(convertCoinAmountFromInt(balance, coinDecimal));
      required = Number(convertCoinAmountFromInt(required, coinDecimal));
      const balanceShortage = minusNumbers(required, balance);

      message = `${__('Insufficient')} ${cryptoCode} ${__(
        'balance including fee',
      )}!!\n
       ${__('balance required')}: ${required.toFixed(10)} ${cryptoCode},\n
       ${__('balance exists')}: ${balance.toFixed(10)} ${cryptoCode},\n
       ${__('balance shortage')}: ${balanceShortage.toFixed(
        12,
      )} ${cryptoCode}.\n
       ${__('Try less amount. Or, ')}\n
       ${__(SYSTEM_MESSAGES.SYNC_MISSING_BALANCE)}`;

      return errorResponse(message, { fee: txfee });
    }
    const utxo = utxos.pop();
    inputs.push(utxo);
    balance = addNumbers(
      balance,
      // multiplyNumbers(Number(utxo.amount), SATOSHI), // from btc to satoshi
      Number(convertCoinAmountToInt(utxo.amount, coinDecimal)), // from btc to smallest unit (satoshi)
    );
    txfee = Math.round(148 * inputs.length + 2 * 34 + 10) * byteFee; //tx fee formula
    required = addNumbers(amount, txfee);
  }
  txfee = Number(convertCoinAmountFromInt(txfee, coinDecimal));
  return successResponse('', { fee: txfee });
}
