import { COINS } from '@cypherock/communication';

export interface IInitialToken {
  coinId: string;
  abbr: string;
  name: string;
}

const getTokens = (ethCoinId: string) => {
  const coin = COINS[ethCoinId];

  if (!coin) {
    throw new Error('Invalid ethCoin: ' + ethCoinId);
  }

  const initialTokens: IInitialToken[] = [];
  for (const [_, value] of Object.entries(coin.tokenList)) {
    if (value) {
      const tempCoin: IInitialToken = {
        abbr: value.abbr,
        name: value.name,
        coinId: value.id
      };
      initialTokens.push(tempCoin);
    }
  }

  return initialTokens.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
};

export default getTokens;
