import { useState } from 'react';
import type { Capability } from 'sats-connect';
import { BitcoinNetworkType, sendBtcTransaction } from 'sats-connect';
import { NostrBitpacs } from 'src/lib/nostr';
import { transferWallet } from 'src/lib/transferWallet';

type Props = {
  network: BitcoinNetworkType;
  capabilities: Set<Capability>;
  bitpac: NostrBitpacs;
};

const SendBitcoin = ({ network, capabilities, bitpac }: Props) => {
  const [recipient, setRecipient] = useState('');
  const [txPsbt, setPstb] = useState('');

  const onSendBtcClick = async () => {
    //  bitpacToRecover?.threshold, bitpacToRecover?.pubkeys, network
    const psbt = await transferWallet(
      bitpac.threshold,
      bitpac.pubkeys,
      network,
      recipient,
    );
    setPstb(psbt);
  };

  if (!capabilities.has('sendBtcTransaction')) {
    return (
      <div className="container">
        <h3>Transfer Wallet</h3>
        <b>The wallet does not support this feature</b>
      </div>
    );
  }

  const sendDisabled = recipient.length === 0;

  return (
    <div className="container">
      <h3>Transfer Wallet</h3>
      <p>
        <b>Recipient address</b>
        <br />
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </p>

      <button onClick={onSendBtcClick} disabled={sendDisabled}>
        Create PSBT
      </button>

      <p>
        {' '}
        Sign and broadcast this psbt when ready.
        {txPsbt}
      </p>
    </div>
  );
};

export default SendBitcoin;
