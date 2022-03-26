import PropTypes from 'prop-types';

export interface StepComponentProps {
  handleDeviceConnected: () => void;
  handleNext: () => void;
  handlePrev: () => void;
}

export const StepComponentPropTypes = {
  handleDeviceConnected: PropTypes.func.isRequired,
  handleNext: PropTypes.func.isRequired,
  handlePrev: PropTypes.func.isRequired
};
