import deleteDepricatedCoins from './01.depricatedCoins';
import multiAccount from './02.multiAccount';
import deleteDeprecatedAccounts from './03.deleteDepracatedAccounts';

const migrationFunctions = [
  deleteDepricatedCoins,
  multiAccount,
  deleteDeprecatedAccounts
];

export default migrationFunctions;
