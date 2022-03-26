import React from 'react';

import { UseSendTransactionValues } from '../hooks/flows/useSendTransaction';

export interface SendTransactionContextInterface {
  sendTransaction: UseSendTransactionValues;
  sendForm: boolean;
  setSendForm: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SendTransactionContext: React.Context<SendTransactionContextInterface> =
  React.createContext<SendTransactionContextInterface>(
    {} as SendTransactionContextInterface
  );

export function useSendTransactionContext(): SendTransactionContextInterface {
  return React.useContext(SendTransactionContext);
}
