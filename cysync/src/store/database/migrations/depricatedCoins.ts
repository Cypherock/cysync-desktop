import logger from '../../../utils/logger';

import { MigrationFunction } from './types';

const deleteDepricatedCoins: MigrationFunction = async ({
  coinDb,
  priceHistoryDb,
  tokenDb,
  receiveAddressDb,
  transactionDb,
  customAccountDb
}) => {
  try {
    const depricatedCoins = [{ abbr: 'ethr' }];

    const promiseList = [
      {
        name: 'Coins',
        promises: depricatedCoins.map(elem =>
          coinDb.delete({ slug: elem.abbr })
        )
      },
      {
        name: 'Price History',
        promises: depricatedCoins.map(elem =>
          priceHistoryDb.delete({ slug: elem.abbr })
        )
      },
      {
        name: 'ERC20 Tokens',
        promises: depricatedCoins.map(elem =>
          tokenDb.delete({ coin: elem.abbr })
        )
      },
      {
        name: 'Addresses',
        promises: depricatedCoins.map(
          elem => Promise.resolve(elem)
          // addressDb.delete({ coinType: elem.abbr })
        )
      },
      {
        name: 'Receive Address',
        promises: depricatedCoins.map(elem =>
          receiveAddressDb.delete({ coinType: elem.abbr })
        )
      },
      {
        name: 'Transactions per slug',
        promises: depricatedCoins.map(elem =>
          transactionDb.delete({ slug: elem.abbr })
        )
      },
      {
        name: 'Transaction per coin',
        promises: depricatedCoins.map(elem =>
          transactionDb.delete({ coin: elem.abbr })
        )
      },
      {
        name: 'Custom Account',
        promises: depricatedCoins.map(elem =>
          customAccountDb.delete({ coin: elem.abbr })
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

export default deleteDepricatedCoins;
