import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';

export interface RecipientData {
  id: number;
  recipient: string;
  amount: string | undefined;
  errorRecipient: string;
  errorAmount: string;
}

export interface DuplicateBatchAddresses {
  [addr: string]: {
    ids: string[];
  };
}

export interface StepComponentProps {
  handleMaxSend: (isMax: boolean) => void;
  handleNext: () => void;
  maximum: boolean;
  activeButton: number;
  feeType: boolean;
  recipientData: RecipientData[];
  total: BigNumber;
  transactionFee: string;
  addBatchTransaction: () => void;
  handleDelete: (e: any) => void;
  handleInputChange: (e: any) => void;
  handleTotal: () => void;
  handleFeeType: () => void;
  changeButton: (index: number) => void;
  handleChange: () => void;
  handleVerificationErrors: (
    id: number,
    address: string,
    error: boolean,
    errorString?: string
  ) => void;
  verifyRecipientAmount: () => boolean;
  setTransactionFee: (val: number) => void;
  buttonDisabled: boolean;
  isButtonLoading: boolean;
  gasLimit: number;
  setGasLimit: (val: number) => void;
  handleCopyFromClipboard: (id: string) => void;
  maxSend: boolean;
  setMaxSend: (val: boolean) => void;
  handleClose: (abort?: boolean) => void;
  estimateGasLimit: boolean;
  setEstimateGasLimit: (val: boolean) => void;
  duplicateBatchAddresses: string[];
}

export const StepComponentPropTypes = {
  handleMaxSend: PropTypes.func.isRequired,
  handleNext: PropTypes.func.isRequired,
  maximum: PropTypes.bool.isRequired,
  activeButton: PropTypes.number.isRequired,
  feeType: PropTypes.bool.isRequired,
  total: PropTypes.instanceOf(BigNumber).isRequired,
  transactionFee: PropTypes.string.isRequired,
  addBatchTransaction: PropTypes.func.isRequired,
  handleDelete: PropTypes.func.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleTotal: PropTypes.func.isRequired,
  handleFeeType: PropTypes.func.isRequired,
  changeButton: PropTypes.func.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleTransactionFeeChange: PropTypes.func.isRequired,
  handleTransactionFeeChangeSlider: PropTypes.func.isRequired,
  handleVerificationErrors: PropTypes.func.isRequired,
  setTransactionFee: PropTypes.func.isRequired,
  buttonDisabled: PropTypes.bool.isRequired,
  isButtonLoading: PropTypes.bool.isRequired,
  gasLimit: PropTypes.number.isRequired,
  setGasLimit: PropTypes.func.isRequired,
  handleCopyFromClipboard: PropTypes.func.isRequired,
  maxSend: PropTypes.bool.isRequired,
  setMaxSend: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  estimateGasLimit: PropTypes.bool.isRequired,
  setEstimateGasLimit: PropTypes.func.isRequired,
  duplicateBatchAddresses: PropTypes.array.isRequired
};
