import deleteDepricatedCoins from './01.depricatedCoins';
import multiAccount from './02.multiAccount';
import deleteDeprecatedAccounts from './03.deleteDepracatedAccounts';
import pruneCoinPriceDb from './04.pruneCoinPriceDb';

const migrationFunctions = [
  deleteDepricatedCoins,
  multiAccount,
  deleteDeprecatedAccounts,
  pruneCoinPriceDb
];

export default migrationFunctions;
