import { COINS, EthCoinData, NearCoinData } from '@cypherock/communication';
import Server from '@cypherock/server-wrapper';

const getFees = async (coinType: string) => {
  const coin = COINS[coinType];

  if (!coin) {
    throw new Error(`Invalid coinType ${coinType}`);
  }

  if (coin instanceof EthCoinData) {
    const resp = await Server.eth.transaction
      .getFees({
        network: coin.network
      })
      .request();
    const { FastGasPrice: result } = resp.data; //Available options: FastGasPrice, SafeGasPrice, ProposedGasPrice
    const fees = parseInt(result, 10);

    if (isNaN(fees)) {
      throw new Error(
        `Received NaN from API. Data: ${JSON.stringify(resp.data)}`
      );
    }

    if (fees <= 0) {
      throw new Error(
        `'0' (${fees}) Medium fee calculated by server data: ${JSON.stringify(
          resp.data
        )}`
      );
    }

    return fees;
  } else if (coin instanceof NearCoinData) {
    const resp = await Server.near.transaction
      .getFees({
        network: coin.network
      })
      .request();
    return Math.round(resp);
  }

  const res = await Server.bitcoin.transaction.getFees({ coinType }).request();
  return Math.round(res.data.medium_fee_per_kb / 1024);
};

export default getFees;
