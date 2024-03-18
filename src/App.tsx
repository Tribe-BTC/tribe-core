import type { Capability } from 'sats-connect';
import {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  getCapabilities,
} from 'sats-connect';

import SendBitcoin from './components/sendBitcoin';
import ListBitpacs from './components/listBitpacs';
import { useLocalStorage } from './useLocalStorage';

import { useEffect, useState } from 'react';
import './App.css';
import { NostrBitpacs } from './lib/nostr';

function App() {
  const [paymentAddress, setPaymentAddress] = useLocalStorage('paymentAddress');
  const [paymentPublicKey, setPaymentPublicKey] =
    useLocalStorage('paymentPublicKey');
  const [ordinalsAddress, setOrdinalsAddress] =
    useLocalStorage('ordinalsAddress');
  const [ordinalsPublicKey, setOrdinalsPublicKey] =
    useLocalStorage('ordinalsPublicKey');
  const [network, setNetwork] = useLocalStorage<BitcoinNetworkType>(
    'network',
    BitcoinNetworkType.Testnet,
  );
  const [bitpac, setBitpac] = useState<NostrBitpacs | undefined>();

  const [capabilityState, setCapabilityState] = useState<
    'loading' | 'loaded' | 'missing' | 'cancelled'
  >('loading');
  const [capabilities, setCapabilities] = useState<Set<Capability>>();

  useEffect(() => {
    const runCapabilityCheck = async () => {
      let runs = 0;
      const MAX_RUNS = 20;
      setCapabilityState('loading');

      // the wallet's in-page script may not be loaded yet, so we'll try a few times
      while (runs < MAX_RUNS) {
        try {
          await getCapabilities({
            onFinish(response) {
              setCapabilities(new Set(response));
              setCapabilityState('loaded');
            },
            onCancel() {
              setCapabilityState('cancelled');
            },
            payload: {
              network: {
                type: network,
              },
            },
          });
        } catch (e) {
          runs++;
          if (runs === MAX_RUNS) {
            setCapabilityState('missing');
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };

    runCapabilityCheck();
  }, [network]);

  const isReady =
    !!paymentAddress &&
    !!paymentPublicKey &&
    !!ordinalsAddress &&
    !!ordinalsPublicKey;

  const onWalletDisconnect = () => {
    setPaymentAddress(undefined);
    setPaymentPublicKey(undefined);
    setOrdinalsAddress(undefined);
    setOrdinalsPublicKey(undefined);
  };

  const toggleNetwork = () => {
    setNetwork(
      network === BitcoinNetworkType.Testnet
        ? BitcoinNetworkType.Mainnet
        : BitcoinNetworkType.Testnet,
    );
    onWalletDisconnect();
  };

  const onConnectClick = async () => {
    await getAddress({
      payload: {
        purposes: [AddressPurpose.Ordinals, AddressPurpose.Payment],
        message: 'SATS Connect Demo',
        network: {
          type: network,
        },
      },
      onFinish: (response) => {
        const paymentAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Payment,
        );
        setPaymentAddress(paymentAddressItem?.address);
        setPaymentPublicKey(paymentAddressItem?.publicKey);

        const ordinalsAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Ordinals,
        );
        setOrdinalsAddress(ordinalsAddressItem?.address);
        setOrdinalsPublicKey(ordinalsAddressItem?.publicKey);
      },
      onCancel: () => alert('Request canceled'),
    });
  };

  const capabilityMessage =
    capabilityState === 'loading'
      ? 'Checking capabilities...'
      : capabilityState === 'cancelled'
        ? 'Capability check cancelled by wallet. Please refresh the page and try again.'
        : capabilityState === 'missing'
          ? 'Could not find an installed Sats Connect capable wallet. Please install a wallet and try again.'
          : !capabilities
            ? 'Something went wrong with getting capabilities'
            : undefined;

  if (capabilityMessage) {
    return (
      <div style={{ padding: 30 }}>
        <h1>Tribe Recovery Tool - {network}</h1>
        <div>{capabilityMessage}</div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={{ padding: 30 }}>
        <h1>Tribe Recovery Tool - {network}</h1>
        <div>Please connect your wallet to continue</div>

        <div style={{ background: 'lightgray', padding: 30, marginTop: 10 }}>
          <button style={{ height: 30, width: 180 }} onClick={toggleNetwork}>
            Switch Network
          </button>
          <br />
          <br />
          <button style={{ height: 30, width: 180 }} onClick={onConnectClick}>
            Connect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Tribe Recovery Tool - {network}</h1>
      <div>
        <div className="container">
          <h3>Disconnect wallet</h3>
          <button onClick={onWalletDisconnect}>Disconnect</button>
        </div>

        <ListBitpacs
          paymentAddress={paymentAddress}
          paymentPublicKey={paymentPublicKey}
          ordinalsAddress={ordinalsAddress}
          ordinalsPublicKey={ordinalsPublicKey}
          network={network}
          capabilities={capabilities!}
          callback={(bp: NostrBitpacs) => {
            setBitpac(bp);
          }}
        />

        {Boolean(bitpac) && bitpac && (
          <>
            <SendBitcoin
              bitpac={bitpac}
              network={network}
              capabilities={capabilities!}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
