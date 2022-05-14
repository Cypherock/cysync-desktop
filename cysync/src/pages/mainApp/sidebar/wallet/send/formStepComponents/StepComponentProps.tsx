import PropTypes from 'prop-types';

export interface BatchRecipientData {
  id: number;
  recipient: string;
  amount: string | undefined;
  errorRecipient: string;
  errorAmount: string;
}

export const BatchRecipientPropType = {
  id: PropTypes.number.isRequired,
  recipient: PropTypes.string.isRequired,
  amount: PropTypes.string,
  errorRecipient: PropTypes.string.isRequired,
  errorAmount: PropTypes.string.isRequired
};

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
  batchRecipientData: BatchRecipientData[];
  total: number;
  transactionFee: string;
  addBatchTransaction: () => void;
  handleDelete: (e: any) => void;
  handleInputChange: (e: any) => void;
  handleTotal: () => void;
  handleFeeType: () => void;
  changeButton: (index: number) => void;
  handleChange: () => void;
  handleTransactionFeeChange: (e: any) => void;
  handleTransactionFeeChangeSlider: (fee: number) => void;
  handleVerificationErrors: (
    id: number,
    address: string,
    error: boolean
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
  batchRecipientData: PropTypes.arrayOf(PropTypes.exact(BatchRecipientPropType))
    .isRequired,
  total: PropTypes.number.isRequired,
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
