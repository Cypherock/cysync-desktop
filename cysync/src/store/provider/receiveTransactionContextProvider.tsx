import React from 'react';

import { UseReceiveTransactionValues } from '../hooks/flows/useReceiveTransation';

export interface ReceiveTransactionContextInterface {
  receiveTransaction: UseReceiveTransactionValues;
  receiveForm: boolean;
  setReceiveForm: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ReceiveTransactionContext: React.Context<ReceiveTransactionContextInterface> =
  React.createContext<ReceiveTransactionContextInterface>(
    {} as ReceiveTransactionContextInterface
  );

export function useReceiveTransactionContext(): ReceiveTransactionContextInterface {
  return React.useContext(ReceiveTransactionContext);
}
