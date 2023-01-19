import {
  COINS,
  EthCoinData,
  NearCoinData,
  SolanaCoinData
} from '@cypherock/communication';
import Server from '@cypherock/server-wrapper';
import BigNumber from 'bignumber.js';

const getFees = async (coinId: string) => {
  const coin = COINS[coinId];

  if (!coin) {
    throw new Error(`Invalid coinId ${coinId}`);
  }

  if (coin instanceof EthCoinData) {
    const resp = await Server.eth.transaction
      .getFees({
        network: coin.network,
        responseType: 'v2'
      })
      .request();
    const value = new BigNumber(resp.data.fees, 16);

    if (value.isNaN()) {
      throw new Error(
        `Received NaN from API. Data: ${JSON.stringify(resp.data)}`
      );
    }

    if (value.isLessThanOrEqualTo(0)) {
      throw new Error(
        `'0' Medium fee returned from server: ${JSON.stringify(resp.data)}`
      );
    }

    const fees = value.dividedBy(1000000000).toNumber();

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
        network: coin.network,
        responseType: 'v2'
      })
      .request();
    return resp.data.fees;
  } else if (coin instanceof SolanaCoinData) {
    const resp = await Server.solana.transaction
      .getFees({
        network: coin.network
      })
      .request();
    return resp.data.fees;
  }

  const res = await Server.bitcoin.transaction
    .getFees({ coinType: coin.abbr })
    .request();
  return Math.round(res.data.medium_fee_per_kb / 1024);
};

export default getFees;
