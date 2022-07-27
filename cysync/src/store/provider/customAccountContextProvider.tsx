import React from 'react';

import { DisplayCustomAccount } from '../hooks/types';

export interface CustomAccountContextInterface {
  customAccount: DisplayCustomAccount;
}

export const CustomAccountContext: React.Context<CustomAccountContextInterface> =
  React.createContext<CustomAccountContextInterface>(
    {} as CustomAccountContextInterface
  );

export function useCustomAccountContext(): CustomAccountContextInterface {
  return React.useContext(CustomAccountContext);
}
