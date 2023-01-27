import logger from '../../../utils/logger';

import { MigrationFunction } from './types';

const deleteDeprecatedAccounts: MigrationFunction = async ({
  coinDb,
  accountDb,
  priceHistoryDb,
  coinPriceDb,
  tokenDb,
  receiveAddressDb,
  transactionDb,
  customAccountDb,
  addressDb
}) => {
  try {
    const deprecatedCoinsId = [{ coinId: 'bitcoin-testnet', abbr: 'btct' }];

    const promiseList = [
      {
        name: 'Coins',
        promises: deprecatedCoinsId.map(elem =>
          coinDb.delete({ slug: elem.abbr })
        )
      },
      {
        name: 'Accounts',
        promises: deprecatedCoinsId.map(elem =>
          accountDb.delete({ coinId: elem.coinId })
        )
      },
      {
        name: 'Price History',
        promises: deprecatedCoinsId.map(elem =>
          priceHistoryDb.delete({ coinId: elem.coinId })
        )
      },
      {
        name: 'ERC20 Tokens Parent',
        promises: deprecatedCoinsId.map(elem =>
          tokenDb.delete({ parentCoinId: elem.coinId })
        )
      },
      {
        name: 'ERC20 Tokens',
        promises: deprecatedCoinsId.map(elem =>
          tokenDb.delete({ coinId: elem.coinId })
        )
      },
      {
        name: 'Addresses',
        promises: deprecatedCoinsId.map(elem =>
          addressDb.delete({ coinId: elem.coinId })
        )
      },
      {
        name: 'Receive Address',
        promises: deprecatedCoinsId.map(elem =>
          receiveAddressDb.delete({ coinId: elem.coinId })
        )
      },
      {
        name: 'Transactions Parent',
        promises: deprecatedCoinsId.map(elem =>
          transactionDb.delete({ parentCoinId: elem.coinId })
        )
      },
      {
        name: 'Transaction per coin',
        promises: deprecatedCoinsId.map(elem =>
          transactionDb.delete({ coinId: elem.coinId })
        )
      },
      {
        name: 'Coin Price Db',
        promises: deprecatedCoinsId.map(elem =>
          coinPriceDb.delete({ coinId: elem.coinId })
        )
      },
      {
        name: 'Custom Account',
        promises: deprecatedCoinsId.map(elem =>
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
    logger.error('Error in deleting deprecated accounts.');
    logger.error(error);
  }
};

export default deleteDeprecatedAccounts;
