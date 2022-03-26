import Slide from '@material-ui/core/Slide';
import { TransitionProps } from '@material-ui/core/transitions';
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
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
  open: boolean;
  handleClose: () => void;
  handleSnackbarOpen: () => void;
  handleSkipPassword: () => void;
}

const Index: React.FC<Props> = ({
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

Index.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleSnackbarOpen: PropTypes.func.isRequired,
  handleSkipPassword: PropTypes.func.isRequired
};

export default Index;
