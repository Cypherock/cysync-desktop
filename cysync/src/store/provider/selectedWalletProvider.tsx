import React from 'react';

import { Wallet } from '@cypherock/database';

export interface SelectedWalletContextInterface {
  selectedWallet: Wallet;
}

export const SelectedWalletContext: React.Context<SelectedWalletContextInterface> =
  React.createContext<SelectedWalletContextInterface>(
    {} as SelectedWalletContextInterface
  );

export function useSelectedWallet(): SelectedWalletContextInterface {
  return React.useContext(SelectedWalletContext);
}
