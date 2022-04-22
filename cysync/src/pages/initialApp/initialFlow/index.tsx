import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import Dialog from '../../../designSystem/designComponents/dialog/dialogBox';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';

import RootInitial from './root';

interface CustomTransitionProps extends TransitionProps {
  children?: React.ReactElement;
}

const TransitionRef = React.forwardRef<
  React.Ref<unknown>,
  CustomTransitionProps
>(function Transition(props, ref) {
  return (
    <Slide
      direction="up"
      in={props.in}
      ref={ref}
      unmountOnExit
      children={props.children}
      {...props}
    />
  );
});

interface Props {
  open: boolean;
  handleClose: () => void;
  handleSnackbarOpen: () => void;
  handleSkipPassword: () => void;
}

const InitialFlow: React.FC<Props> = ({
  open,
  handleClose,
  handleSnackbarOpen,
  handleSkipPassword
}) => {
  useEffect(() => {
    Analytics.Instance.screenView(Analytics.ScreenViews.INITIAL_FLOW);
    logger.info('Started initial flow');
  }, []);

  return (
    <Dialog
      fullScreen
      open={open}
      handleClose={handleClose}
      isClosePresent={false}
      TransitionComponent={TransitionRef}
      restComponents={
        <RootInitial
          handleClose={handleClose}
          handleSnackbarOpen={handleSnackbarOpen}
          handleSkipPassword={handleSkipPassword}
        />
      }
    />
  );
};

InitialFlow.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleSnackbarOpen: PropTypes.func.isRequired,
  handleSkipPassword: PropTypes.func.isRequired
};

export default InitialFlow;
