import { Coin } from '@cypherock/database';
import PropTypes from 'prop-types';

export interface OneCoinProps {
  initial: string;
  name: string;
  holding: string;
  value: string;
  price: string;
  decimal: number;
  isEmpty: boolean;
  deleteCoin: (xpub: string, coin: string, walletId: string) => Promise<void>;
  deleteHistory: (coin: Coin) => Promise<void>;
  walletId: string;
}

export const OneCoinPropTypes = {
  initial: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  holding: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
  decimal: PropTypes.number.isRequired,
  isEmpty: PropTypes.bool.isRequired,
  deleteCoin: PropTypes.func.isRequired,
  deleteHistory: PropTypes.func.isRequired,
  walletId: PropTypes.string.isRequired
};

export interface EthereumOneCoinProps extends OneCoinProps {
  sortIndex: number;
}

export const EthereumOneCoinPropTypes = {
  ...OneCoinPropTypes,
  sortIndex: PropTypes.number.isRequired
};
