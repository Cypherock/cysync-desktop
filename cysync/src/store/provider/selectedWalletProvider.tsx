import React from 'react';

import { Wallet2 } from '@cypherock/database';

export interface SelectedWalletContextInterface {
  selectedWallet: Wallet2;
}

export const SelectedWalletContext: React.Context<SelectedWalletContextInterface> =
  React.createContext<SelectedWalletContextInterface>(
    {} as SelectedWalletContextInterface
  );

export function useSelectedWallet(): SelectedWalletContextInterface {
  return React.useContext(SelectedWalletContext);
}
