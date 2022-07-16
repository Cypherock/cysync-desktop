import { WalletStates } from '@cypherock/protocols';

import { CyError, CysyncError } from '../../../../errors';

export const noWalletFound = (walletState: WalletStates) => {
  const cyError = new CyError();
  switch (walletState) {
    case WalletStates.NO_WALLET_FOUND:
      cyError.setError(CysyncError.NO_WALLET_ON_DEVICE);
      break;
    case WalletStates.WALLET_NOT_PRESENT:
      cyError.setError(CysyncError.WALLET_NOT_FOUND_IN_DEVICE);
      break;
    case WalletStates.WALLET_PARTIAL_STATE:
      cyError.setError(CysyncError.WALLET_PARTIAL_STATE);
      break;
    case WalletStates.NO_VALID_WALLET_FOUND:
      cyError.setError(CysyncError.NO_VALID_WALLET_FOUND);
      break;
  }
  return cyError;
};
