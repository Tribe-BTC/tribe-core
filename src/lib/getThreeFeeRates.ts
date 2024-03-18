export const getThreeFeeRates = async (network: 'Testnet' | 'Mainnet') => {
  const networkSubpath = network === 'Testnet' ? '/testnet' : '';
  const url = `https://mempool.space${networkSubpath}/api/v1/fees/recommended`;

  const response = await fetch(url);

  return response.json();
};
