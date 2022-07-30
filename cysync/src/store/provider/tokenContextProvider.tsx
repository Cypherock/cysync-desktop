import React from 'react';

import { DisplayToken } from '../hooks/types';

export interface TokenContextInterface {
  token: DisplayToken;
  ethCoin: string;
}

export const TokenContext: React.Context<TokenContextInterface> =
  React.createContext<TokenContextInterface>({} as TokenContextInterface);

export function useTokenContext(): TokenContextInterface {
  return React.useContext(TokenContext);
}
