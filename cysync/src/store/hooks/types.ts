import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';

import {
  Coin,
  InputOutput,
  IOtype,
  Token,
  Transaction
} from '../database/databaseInit';

export interface DisplayCoin extends Coin {
  displayValue: string;
  displayPrice: string;
  displayBalance: string;
  isEmpty: boolean;
}

export interface DisplayToken extends Token {
  displayValue: string;
  displayPrice: string;
  displayBalance: string;
  isEmpty: boolean;
}

export interface DisplayInputOutput extends InputOutput {
  displayValue: string;
}

export const DisplayInputOutputPropTypes = {
  displayValue: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  isMine: PropTypes.bool.isRequired,
  indexNumber: PropTypes.number.isRequired,
  type: PropTypes.oneOf(Object.values(IOtype)).isRequired
};

export interface DisplayTransaction
  extends Omit<Transaction, 'inputs' | 'outputs'> {
  displayAmount: string;
  displayFees: string;
  displayTotal: string;
  displayValue: string;
  isErc20: boolean;
  coinName: string;
  coinDecimal: number;
  inputs?: DisplayInputOutput[];
  outputs?: DisplayInputOutput[];
}

export const DisplayTransactionPropTypes = {
  hash: PropTypes.string.isRequired,
  total: PropTypes.string,
  fees: PropTypes.string,
  amount: PropTypes.string.isRequired,
  confirmations: PropTypes.number.isRequired,
  walletId: PropTypes.string.isRequired,
  walletName: PropTypes.string,
  slug: PropTypes.string.isRequired,
  coin: PropTypes.string,
  status: PropTypes.number.isRequired,
  sentReceive: PropTypes.any.isRequired,
  confirmed: PropTypes.any.isRequired,
  blockHeight: PropTypes.number.isRequired,
  displayAmount: PropTypes.string.isRequired,
  displayFees: PropTypes.string.isRequired,
  displayTotal: PropTypes.string.isRequired,
  displayValue: PropTypes.string.isRequired,
  isErc20: PropTypes.bool.isRequired,
  coinName: PropTypes.string.isRequired,
  coinDecimal: PropTypes.number.isRequired,
  inputs: PropTypes.arrayOf(PropTypes.exact(DisplayInputOutputPropTypes)),
  outputs: PropTypes.arrayOf(PropTypes.exact(DisplayInputOutputPropTypes))
};

export interface CoinPriceHistory {
  totalBalance: BigNumber;
  unitPrices: number[][];
  pricesToDisplay: number[][];
}

export interface CoinHistory {
  name: string;
  data: CoinPriceHistory['pricesToDisplay'];
}

export interface CoinDetails {
  name: string;
  decimal: number;
  balance: string;
  value: string;
  price: string;
}
