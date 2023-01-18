import PropTypes from 'prop-types';

export interface OneCoinProps {
  accountId: string;
  coinId: string;
  initial: string;
  name: string;
  holding: string;
  value: string;
  price: string;
  decimal: number;
  isEmpty: boolean;
  deleteCoin: (accountId: string) => Promise<void>;
  deleteHistory: (accountId: string) => Promise<void>;
  walletId: string;
}

export const OneCoinPropTypes = {
  accountId: PropTypes.string.isRequired,
  coinId: PropTypes.string.isRequired,
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

export interface NearOneCoinProps extends OneCoinProps {
  sortIndex: number;
  nativeBalance: string;
  reservedBalance: string;
}

export const NearOneCoinPropTypes = {
  ...OneCoinPropTypes,
  sortIndex: PropTypes.number.isRequired
};
