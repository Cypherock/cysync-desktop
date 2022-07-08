import { COINS, EthCoinData } from '@cypherock/communication';

export interface IInitialToken {
  abbr: string;
  name: string;
}

const getTokens = (ethCoin: string) => {
  const coin = COINS[ethCoin];

  if (!coin || !(coin instanceof EthCoinData)) {
    throw new Error('Invalid ethCoin: ' + ethCoin);
  }

  const initialTokens: IInitialToken[] = [];
  for (const [key, value] of Object.entries(coin.erc20TokensList)) {
    if (value) {
      const tempCoin: IInitialToken = { abbr: key, name: value.name };
      initialTokens.push(tempCoin);
    }
  }

  return initialTokens.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
};

export default getTokens;
