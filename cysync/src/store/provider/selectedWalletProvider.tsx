import React from 'react';

import { WalletInfo } from './walletsProvider';

export interface SelectedWalletContextInterface {
  selectedWallet: WalletInfo;
}

export const SelectedWalletContext: React.Context<SelectedWalletContextInterface> =
  React.createContext<SelectedWalletContextInterface>(
    {} as SelectedWalletContextInterface
  );

export function useSelectedWallet(): SelectedWalletContextInterface {
  return React.useContext(SelectedWalletContext);
}
