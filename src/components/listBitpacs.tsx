import type { Capability } from 'sats-connect';
import { BitcoinNetworkType, signTransaction } from 'sats-connect';

import { Buffer } from 'buffer';
import { useEffect, useState } from 'react';
import * as nostr from '../lib/nostr';
import { toXOnly } from 'src/lib/utils';
import { generateMultisigAddress } from 'src/lib/generateMultisigAddress';

type Props = {
  network: BitcoinNetworkType;
  ordinalsAddress: string;
  paymentAddress: string;
  paymentPublicKey: string;
  ordinalsPublicKey: string;
  capabilities: Set<Capability>;

  callback: (bitpac: nostr.NostrBitpacs) => void;
};

const ListBitpacs = ({
  network,
  ordinalsAddress,
  paymentAddress,
  paymentPublicKey,
  ordinalsPublicKey,
  capabilities,

  callback,
}: Props) => {
  const [signedPsbt, setSignedPsbt] = useState('');
  const [bitpacs, setBitpacs] = useState<nostr.NostrBitpacs[]>([]);
  const [bitpac, setBitpac] = useState<nostr.NostrBitpacs>();
  const [address, setAddress] = useState<string>();

  useEffect(() => {
    const fetchBitpacs = async () => {
      const pubkeyBuffer = Buffer.from(paymentPublicKey, 'hex');
      const internalPubKey = toXOnly(pubkeyBuffer).toString('hex');

      const nostrBitpacs = await nostr.fetchBitpacsByPubkey(internalPubKey);

      setBitpacs(nostrBitpacs);
    };

    fetchBitpacs();
  }, [paymentPublicKey]);

  const onBitpacSelect = async (e: any) => {
    const bitpacToRecover = bitpacs.find((b) => b.id === e.target.value);
    if (bitpacToRecover) {
      const bitpacAddress = await generateMultisigAddress(
        bitpacToRecover?.threshold,
        bitpacToRecover?.pubkeys,
        network,
      );
      setAddress(bitpacAddress.p2trMs.address);

      setBitpac(bitpacToRecover);
      callback(bitpacToRecover);
    }
  };

  return (
    <div className="container">
      <h3>Bitpacs</h3>
      <p>Select the Bitpac you would like to recover</p>

      <div>
        <select onChange={onBitpacSelect}>
          {bitpacs.map((bitpac, index) => (
            <option key={index} value={bitpac.id}>
              {bitpac.name}
            </option>
          ))}
        </select>
      </div>

      <p>Bitpac Address: {address}</p>

      <p>Signatures required: {bitpac?.threshold}</p>
    </div>
  );
};

export default ListBitpacs;
