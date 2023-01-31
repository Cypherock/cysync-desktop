import PropTypes from 'prop-types';

export interface StepComponentProps {
  handleClose: () => void;
  handleNext: () => void;
  handlePrev: () => void;
}

export const StepComponentPropTypes = {
  handleClose: PropTypes.func.isRequired,
  handleNext: PropTypes.func.isRequired,
  handlePrev: PropTypes.func.isRequired
};
