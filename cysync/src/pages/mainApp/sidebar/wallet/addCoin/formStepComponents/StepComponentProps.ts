import PropTypes from 'prop-types';

export interface StepComponentProps {
  handleNext: () => void;
  handleClose: (abort?: boolean) => void;
  coins: any[][];
  setCoins: (coins: any[][]) => void;
  coinsPresent: any[];
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
