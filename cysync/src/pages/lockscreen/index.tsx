import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import CustomDialog from '../../designSystem/designComponents/dialog/dialogBox';
import Analytics from '../../utils/analytics';
import logger from '../../utils/logger';

import LockScreen from './LockScreen';

interface CustomTransitionProps extends TransitionProps {
  children?: React.ReactElement;
}

const TransitionRef = React.forwardRef<
  React.Ref<unknown>,
  CustomTransitionProps
>(function Transition(props, ref) {
  return (
    <Slide
      direction="down"
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
  handleReset: () => void;
}

const Index: React.FC<Props> = ({ open, handleClose, handleReset }) => {
  useEffect(() => {
    Analytics.Instance.screenView(Analytics.ScreenViews.LOCKSCREEN);
    logger.info('Opened lockscreen');
  }, []);

  return (
    <CustomDialog
      fullScreen
      open={open}
      handleClose={handleClose}
      TransitionComponent={TransitionRef}
      isClosePresent={false}
      restComponents={
        <LockScreen handleClose={handleClose} handleReset={handleReset} />
      }
    />
  );
};

Index.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleReset: PropTypes.func.isRequired
};

export default Index;
