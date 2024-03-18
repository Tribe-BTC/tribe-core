export const getUTXOs = async (
  address: string,
  network: 'Testnet' | 'Mainnet',
) => {
  const networkSubpath = network === 'Testnet' ? '/testnet' : '';

  const url = `https://mempool.space${networkSubpath}/api/address/${address}/utxo`;
  const response = await fetch(url);

  return response.json();
};
