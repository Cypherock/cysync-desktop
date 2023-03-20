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
  for (const value of Object.values(coin.tokenList)) {
    if (value) {
      const tempCoin: IInitialToken = {
        abbr: value.abbr,
        name: value.name,
        coinId: value.id
      };
      initialTokens.push(tempCoin);
    }
  }

  return initialTokens;
};

export default getTokens;
