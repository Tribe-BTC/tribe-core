import { toXOnly } from './utils';
import { TESTNET_CONFIG, MAINNET_CONFIG } from '../config';
const { hex } = require('@scure/base');
const signerModule = import('@scure/btc-signer');

export const generateMultisigAddress = async (
  threshold: number,
  pubkeys: string[],
  network: 'Testnet' | 'Mainnet',
) => {
  const sm = await signerModule;

  const p2trMs = sm.p2tr_ms(
    threshold,
    pubkeys.map((p) => hex.decode(p)).map(toXOnly),
  );
  const p2tr = sm.p2tr(
    undefined,
    { script: p2trMs.script },
    network === 'Testnet' ? TESTNET_CONFIG : MAINNET_CONFIG,
    true,
  );

  if (!p2tr.address) {
    throw new Error('Could not create address');
  }

  return { p2trMs: p2tr, threshold };
};
