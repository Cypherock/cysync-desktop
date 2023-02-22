import React from 'react';

import { DisplayCoin } from '../database';

export interface CurrentCoinContextInterface {
  coinDetails: DisplayCoin;
}

export const CurrentCoinContext: React.Context<CurrentCoinContextInterface> =
  React.createContext<CurrentCoinContextInterface>(
    {} as CurrentCoinContextInterface
  );

export function useCurrentCoin(): CurrentCoinContextInterface {
  return React.useContext(CurrentCoinContext);
}
