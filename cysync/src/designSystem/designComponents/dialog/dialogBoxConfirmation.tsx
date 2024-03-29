import { CircularProgress, DialogProps } from '@mui/material';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../buttons/button';

import DialogBox from './dialogBox';

const PREFIX = 'DialogBoxConfirmation';

const classes = {
  buttons: `${PREFIX}-buttons`,
  close: `${PREFIX}-close`
};

const Root = styled(DialogBox)(({ theme }) => ({
  [`& .${classes.buttons}`]: {
    position: 'absolute',
    bottom: 0,
    marginBottom: '2rem',
    width: '30%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  [`& .${classes.close}`]: {
    textTransform: 'none',
    background: theme.palette.primary.light,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.text.secondary}`,
    '&:hover': {
      background: theme.palette.text.primary,
      color: theme.palette.primary.main
    }
  }
}));

type Props = {
  open: boolean;
  handleClose: () => void;
  fullWidth?: boolean;
  maxWidth?: false | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;
  dialogHeading?: string | undefined;
  restComponents?: string | undefined | JSX.Element | JSX.Element[];
  fullScreen?: boolean;
  TransitionComponent?: DialogProps['TransitionComponent'];
  isClosePresent?: boolean | undefined;
  handleConfirmation: () => void;
  confirmButtonDisabled?: boolean;
  confirmButtonText?: string;
  rejectButtonText?: string;
  rejectButtonDisabled?: boolean;
  isLoading?: boolean;
  hideRejectButton?: boolean;
};

const DialogBoxConfirmation: React.FC<Props> = ({
  maxWidth,
  open,
  handleClose,
  dialogHeading,
  restComponents,
  TransitionComponent,
  fullScreen,
  isClosePresent,
  handleConfirmation,
  confirmButtonDisabled,
  confirmButtonText,
  rejectButtonDisabled,
  rejectButtonText,
  isLoading,
  hideRejectButton
}) => {
  return (
    <Root
      fullWidth={fullScreen}
      maxWidth={maxWidth}
      dialogHeading={dialogHeading}
      open={open}
      handleClose={handleClose}
      TransitionComponent={TransitionComponent}
      isClosePresent={isClosePresent}
      restComponents={
        <>
          {restComponents}
          <div className={classes.buttons}>
            {hideRejectButton || (
              <Button
                variant="contained"
                className={classes.close}
                onClick={handleClose}
                disabled={rejectButtonDisabled}
              >
                {rejectButtonText || 'No'}
              </Button>
            )}
            <CustomButton
              variant="contained"
              disabled={confirmButtonDisabled || isLoading}
              onClick={handleConfirmation}
              autoFocus
            >
              {isLoading ? (
                <CircularProgress size={20} color="secondary" />
              ) : (
                confirmButtonText || 'Yes'
              )}
            </CustomButton>
          </div>
        </>
      }
    />
  );
};

DialogBoxConfirmation.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  maxWidth: PropTypes.oneOf([false, 'xs', 'sm', 'md', 'lg', 'xl', undefined]),
  dialogHeading: PropTypes.string,
  restComponents: PropTypes.element,
  fullScreen: PropTypes.bool,
  fullWidth: PropTypes.bool,
  TransitionComponent: PropTypes.any,
  isClosePresent: PropTypes.bool,
  handleConfirmation: PropTypes.func.isRequired,
  confirmButtonText: PropTypes.string,
  confirmButtonDisabled: PropTypes.bool,
  rejectButtonDisabled: PropTypes.bool,
  rejectButtonText: PropTypes.string,
  isLoading: PropTypes.bool
};

DialogBoxConfirmation.defaultProps = {
  fullWidth: undefined,
  maxWidth: undefined,
  dialogHeading: undefined,
  restComponents: undefined,
  fullScreen: undefined,
  TransitionComponent: undefined,
  isClosePresent: undefined,
  confirmButtonText: undefined,
  confirmButtonDisabled: undefined,
  rejectButtonText: undefined,
  rejectButtonDisabled: undefined,
  isLoading: undefined
};

export default DialogBoxConfirmation;
