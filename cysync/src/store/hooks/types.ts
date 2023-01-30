import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';

import {
  Account,
  CustomAccount,
  InputOutput,
  IOtype,
  Token,
  Transaction
} from '../database/databaseInit';

export interface DisplayCoin extends Account {
  displayValue: string;
  displayPrice: string;
  displayBalance: string;
  isEmpty: boolean;
  price: number;
  priceLastUpdatedAt?: Date;
  displayNearReservedForProtocol?: string;
  displayNearNativeBalance?: string;
}

export interface DisplayToken extends Token {
  displayValue: string;
  displayPrice: string;
  displayBalance: string;
  isEmpty: boolean;
  parentCoin: string;
}

export interface DisplayCustomAccount extends CustomAccount {
  displayValue: string;
  displayPrice: string;
  displayBalance: string;
  isEmpty: boolean;
  isImplicit: boolean;
  displayNearReservedForProtocol?: string;
  displayNearNativeBalance?: string;
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
  type?: string;
  description?: string;
  accountName?: string;
  accountType?: string;
  accountIndex?: number;
}

export const DisplayTransactionPropTypes = {
  accountId: PropTypes.string.isRequired,
  coinId: PropTypes.string.isRequired,
  parentCoinId: PropTypes.string.isRequired,
  isSub: PropTypes.bool,
  hash: PropTypes.string.isRequired,
  total: PropTypes.string,
  fees: PropTypes.string,
  amount: PropTypes.string.isRequired,
  confirmations: PropTypes.number.isRequired,
  walletId: PropTypes.string.isRequired,
  walletName: PropTypes.string,
  status: PropTypes.number.isRequired,
  sentReceive: PropTypes.any.isRequired,
  confirmed: PropTypes.any.isRequired,
  blockHeight: PropTypes.number.isRequired,
  displayAmount: PropTypes.string.isRequired,
  displayFees: PropTypes.string.isRequired,
  displayTotal: PropTypes.string.isRequired,
  displayValue: PropTypes.string.isRequired,
  type: PropTypes.string,
  description: PropTypes.string,
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
  coinId: string;
  decimal: number;
  balance: string;
  value: string;
  price: string;
  parentCoinId: string | undefined;
}

export interface ExecutionResult<T> {
  item: T;
  isFailed: boolean;
  isComplete?: boolean;
  canRetry?: boolean;
  error?: Error;
  processResult?: any;
  delay?: number;
}
