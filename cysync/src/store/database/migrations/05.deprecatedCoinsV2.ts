import logger from '../../../utils/logger';

import { MigrationFunction } from './types';

const deleteDeprecatedCoinsV2: MigrationFunction = async ({
  priceHistoryDb,
  tokenDb,
  receiveAddressDb,
  transactionDb,
  customAccountDb,
  addressDb,
  accountDb,
  coinPriceDb
}) => {
  try {
    const deprecatedCoins = [{ coinId: 'harmony' }, { coinId: 'ethereum-c' }];

    const promiseList = [
      {
        name: 'Accounts',
        promises: deprecatedCoins.map(elem =>
          accountDb.delete({ coinId: elem.coinId })
        )
      },
      {
        name: 'Price History',
        promises: deprecatedCoins.map(elem =>
          priceHistoryDb.delete({ coinId: elem.coinId })
        )
      },
      {
        name: 'ERC20 Tokens',
        promises: deprecatedCoins.map(elem =>
          tokenDb.delete({ parentCoinId: elem.coinId })
        )
      },
      {
        name: 'Addresses',
        promises: deprecatedCoins.map(elem =>
          addressDb.delete({ coinId: elem.coinId })
        )
      },

      {
        name: 'Receive Address',
        promises: deprecatedCoins.map(elem =>
          receiveAddressDb.delete({ coinId: elem.coinId })
        )
      },
      {
        name: 'Transactions',
        promises: deprecatedCoins.map(elem =>
          transactionDb.delete({ coinId: elem.coinId })
        )
      },
      {
        name: 'Children Transactions',
        promises: deprecatedCoins.map(elem =>
          transactionDb.delete({ parentCoinId: elem.coinId })
        )
      },
      {
        name: 'Coin Prices',
        promises: deprecatedCoins.map(elem =>
          coinPriceDb.delete({ coinId: elem.coinId })
        )
      },
      {
        name: 'Custom Account',
        promises: deprecatedCoins.map(elem =>
          customAccountDb.delete({ coinId: elem.coinId })
        )
      }
    ];

    const promises: Array<Promise<any>> = [];

    for (const elem of promiseList) {
      promises.push(...elem.promises);
    }

    await Promise.all(promises);
  } catch (error) {
    logger.error('Error in deleting depricated coins.');
    logger.error(error);
  }
};

export default deleteDeprecatedCoinsV2;
