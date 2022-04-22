import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import DialogBox from '../../../designSystem/designComponents/dialog/dialogBox';
import Icon from '../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../designSystem/iconGroups/errorExclamation';

const PREFIX = 'SetPasswordErrorDialog';

const classes = {
  button: `${PREFIX}-button`
};

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  minWidth: '20rem',
  [`& .${classes.button}`]: {
    background: '#71624C',
    color: theme.palette.text.primary,
    padding: '0.5rem 4rem',
    fontWeight: 700,
    margin: '2rem',
    '&:hover': {
      background: theme.palette.secondary.dark
    }
  }
}));

interface ErrorBoxContentProps {
  handleClose: () => void;
}

const ErrorBoxContent: React.FC<ErrorBoxContentProps> = ({ handleClose }) => {
  return (
    <Root>
      <Icon size={55} viewBox="0 0 55 55" iconGroup={<ErrorExclamation />} />
      <Typography
        color="textPrimary"
        variant="h2"
        gutterBottom
        style={{ margin: '30px 0px' }}
      >
        Oops
      </Typography>
      <Typography color="textPrimary" gutterBottom align="center">
        Something went wrong,
        <br />
        Let’s try again one more time
      </Typography>
      <Button
        variant="contained"
        className={classes.button}
        onClick={handleClose}
      >
        Try Again
      </Button>
    </Root>
  );
};

ErrorBoxContent.propTypes = {
  handleClose: PropTypes.func.isRequired
};

interface SetPasswordErrorDialogProps {
  open: boolean;
  handleClose: () => void;
}

const SetPasswordErrorDialog: React.FC<SetPasswordErrorDialogProps> = ({
  open,
  handleClose
}) => {
  return (
    <DialogBox
      open={open}
      handleClose={handleClose}
      fullWidth
      maxWidth="sm"
      restComponents={<ErrorBoxContent handleClose={handleClose} />}
    />
  );
};

SetPasswordErrorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
};

export default SetPasswordErrorDialog;
