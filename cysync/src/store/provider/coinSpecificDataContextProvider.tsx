import React from 'react';

import { UseCoinSpecificDataValues } from '../hooks/flows/useCoinSpecificData';

export interface CoinSpecificDataContextInterface {
  coinSpecificData: UseCoinSpecificDataValues;
  coinSpecificDataForm: boolean;
  setCoinSpecificDataForm: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CoinSpecificDataContext: React.Context<CoinSpecificDataContextInterface> =
  React.createContext<CoinSpecificDataContextInterface>(
    {} as CoinSpecificDataContextInterface
  );

export function useCoinSpecificDataContext(): CoinSpecificDataContextInterface {
  return React.useContext(CoinSpecificDataContext);
}
