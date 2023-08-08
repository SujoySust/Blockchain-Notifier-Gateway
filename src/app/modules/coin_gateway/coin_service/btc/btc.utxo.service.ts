import { BtcUtxo } from '@prisma/client';
import { BtcNodeUtxos } from './btc.types';
import { NetworkModel } from '../../../../models/db/network.model';
import { prisma_client } from '../../../../helpers/functions';
import {
  STATUS_ACTIVE,
  STATUS_EXPIRED,
} from '../../../../helpers/coreconstant';

export async function saveUtxo(
  network: NetworkModel,
  address: string,
  data: {
    txid: string;
    vout_index: number;
    amount: number;
    block_number: string;
  },
): Promise<BtcUtxo> {
  const walletKey = await prisma_client.walletKey.findFirst({
    where: {
      network_id: network.id,
      address: address,
    },
    select: { id: true },
  });
  if (!walletKey) return null;

  const createData = {
    key_id: walletKey.id,
    ...data,
    vout: data.vout_index,
  };
  delete createData.vout_index;
  const utxo = await prisma_client.btcUtxo.upsert({
    where: {
      key_id_txid_vout: {
        key_id: walletKey.id,
        txid: data.txid,
        vout: data.vout_index,
      },
    },
    create: createData,
    update: {},
  });
  return utxo;
}

export async function getUtxo(
  network: NetworkModel,
  txid: string,
  vout?: number,
  address?: string,
): Promise<BtcUtxo> {
  if (!txid || (vout == undefined && !address)) return null;
  let walletKey: { id: bigint };
  if (address) {
    walletKey = await prisma_client.walletKey.findFirst({
      where: {
        network_id: network.id,
        address: {
          equals: address,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });
    if (!walletKey) return null;
  }

  const utxo = await prisma_client.btcUtxo.findFirst({
    where: {
      txid: {
        equals: txid,
        mode: 'insensitive',
      },
      key_id: walletKey?.id || undefined,
      vout: vout ?? undefined,
    },
  });
  return utxo;
}

export async function updateUtxo(utxo: BtcUtxo, data: any): Promise<BtcUtxo> {
  utxo = await prisma_client.btcUtxo.update({
    where: { id: utxo.id },
    data: data,
  });
  return utxo;
}

export async function syncNodeUtxos(
  walletKey: { id: number | bigint },
  utxoRes: BtcNodeUtxos,
) {
  const keyId = Number(walletKey.id);
  const table = 'btcUtxo';
  await prisma_client.$transaction(async (prisma) => {
    await prisma[table].updateMany({
      where: {
        key_id: keyId,
      },
      data: {
        status: STATUS_EXPIRED,
      },
    });

    for (let i = 0; i < utxoRes.unspents.length; i++) {
      const unspent = utxoRes.unspents[i];
      await prisma[table].upsert({
        where: {
          key_id_txid_vout: {
            key_id: keyId,
            txid: unspent.txid,
            vout: unspent.vout,
          },
        },
        create: {
          key_id: keyId,
          txid: unspent.txid,
          vout: unspent.vout,
          status: STATUS_ACTIVE,
          amount: String(unspent.amount),
          block_number: unspent.height.toString(),
        },
        update: {
          status: STATUS_ACTIVE,
          amount: String(unspent.amount),
          block_number: unspent.height.toString(),
        },
      });
    }
  });
}
