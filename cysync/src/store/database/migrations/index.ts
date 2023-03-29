import deleteDepricatedCoins from './01.depricatedCoins';
import multiAccount from './02.multiAccount';
import deleteDeprecatedAccounts from './03.deleteDepracatedAccounts';
import pruneCoinPriceDb from './04.pruneCoinPriceDb';
import deleteDeprecatedCoinsV2 from './05.deprecatedCoinsV2';

const migrationFunctions = [
  deleteDepricatedCoins,
  multiAccount,
  deleteDeprecatedAccounts,
  pruneCoinPriceDb,
  deleteDeprecatedCoinsV2
];

export default migrationFunctions;
