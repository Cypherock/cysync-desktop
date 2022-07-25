import PropTypes from 'prop-types';

export interface RecipientData {
  id: number;
  recipient: string;
  amount: string | undefined;
  errorRecipient: string;
  errorAmount: string;
}

export interface StepComponentProps {
  handleNext: () => void;
  recipientData: RecipientData[];
  transactionFee: string;
  handleInputChange: (e: any) => void;
  handleVerificationErrors: (
    id: number,
    address: string,
    error: boolean,
    errorString?: string
  ) => void;
  setTransactionFee: (val: number) => void;
  handleCopyFromClipboard: (id: string) => void;
  handleClose: (abort?: boolean) => void;
}

export const StepComponentPropTypes = {
  handleNext: PropTypes.func.isRequired,
  transactionFee: PropTypes.string.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleVerificationErrors: PropTypes.func.isRequired,
  setTransactionFee: PropTypes.func.isRequired,
  handleCopyFromClipboard: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired
};
