import deleteDepricatedCoins from './01.depricatedCoins';
import multiAccount from './02.multiAccount';

const migrationFunctions = [deleteDepricatedCoins, multiAccount];

export default migrationFunctions;
