import PropTypes from 'prop-types';

export interface StepComponentProps {
  handleNext: () => void;
  handleClose: (abort?: boolean) => void;
  setExitFlowOnErrorClose: (value: boolean) => void;
}

export const StepComponentPropTypes = {
  handleNext: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  setExitFlowOnErrorClose: PropTypes.func.isRequired
};
