import PropTypes from 'prop-types';

import { AddableAccountDetails } from '../coins';

export interface StepComponentProps {
  handleNext: () => void;
  handleClose: (abort?: boolean) => void;
  selectedCoin: AddableAccountDetails[];
  setSelectedCoin: (coins: AddableAccountDetails[]) => void;
  coinsPresent: Array<{
    id: string;
    accountIndex: number;
    accountType: string;
  }>;
  isXpubMissing: boolean;
}

export const StepComponentPropTypes = {
  handleNext: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  coins: PropTypes.array.isRequired,
  setCoins: PropTypes.func.isRequired,
  coinsPresent: PropTypes.array.isRequired,
  isXpubMissing: PropTypes.bool.isRequired
};
