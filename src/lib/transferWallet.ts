import { getUTXOs } from './getUtxos';
import { getThreeFeeRates } from './getThreeFeeRates';
import { hex, base64 } from '@scure/base';
import { getTxSize } from './getTxSize';
import { generateMultisigAddress } from 'src/lib/generateMultisigAddress';
import { MAINNET_CONFIG, TESTNET_CONFIG } from 'src/config';

export async function transferWallet(
  threshold: number,
  pubkeys: string[],
  network: 'Testnet' | 'Mainnet',
  paymentAddress: string,
): Promise<string> {
  const bitpacAddress = await generateMultisigAddress(
    threshold,
    pubkeys,
    network,
  );
  const currentScript = bitpacAddress.p2trMs;

  if (!currentScript?.address) {
    throw new Error('Invalid address');
  }

  const btc = await import('@scure/btc-signer');
  const utxos = await getUTXOs(currentScript.address, network);

  if (!utxos?.length) {
    return '';
  }

  const tx = new btc.Transaction();
  const signingIndexes = [];
  const taprootBalance = utxos.reduce(
    (acc: any, utxo: any) => acc + utxo.value,
    0,
  );

  for (const [index, utxoToSpend] of utxos.entries()) {
    tx.addInput({
      txid: utxoToSpend.txid,
      index: utxoToSpend.vout,
      tapInternalKey: currentScript.tapInternalKey,
      tapLeafScript: currentScript.tapLeafScript,
      witnessUtxo: {
        script: currentScript.script,
        amount: BigInt(utxoToSpend.value),
      },
      sighashType: btc.SigHash.ALL_ANYONECANPAY,
    });

    signingIndexes.push(index);
  }

  const txsize = getTxSize(tx.inputsLength, 1, 1);

  const feeOptions = await getThreeFeeRates(network);
  const satsPerByte = Number(feeOptions.halfHourFee);

  let miningFee = txsize * satsPerByte;
  if (miningFee < 172) miningFee = 172;

  // Send out all of our balance to the newly created bitpac address
  const outputValue = BigInt(taprootBalance) - BigInt(miningFee);
  if (outputValue < 0) {
    throw new Error('not enough funds to cover fees');
  }
  tx.addOutputAddress(
    paymentAddress,
    outputValue,
    network === 'Testnet' ? TESTNET_CONFIG : MAINNET_CONFIG,
  );

  const psbt = tx.toPSBT();
  const psbtBase64 = base64.encode(psbt);

  return psbtBase64;
}
