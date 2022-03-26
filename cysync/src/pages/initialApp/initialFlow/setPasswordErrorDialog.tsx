import Button from '@material-ui/core/Button';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import DialogBox from '../../../designSystem/designComponents/dialog/dialogBox';
import Icon from '../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../designSystem/iconGroups/errorExclamation';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      minWidth: '20rem'
    },
    button: {
      background: '#71624C',
      color: theme.palette.text.primary,
      padding: '0.5rem 4rem',
      fontWeight: 700,
      margin: '2rem',
      '&:hover': {
        background: theme.palette.secondary.dark
      }
    }
  })
);

interface ErrorBoxContentProps {
  handleClose: () => void;
}

const ErrorBoxContent: React.FC<ErrorBoxContentProps> = ({ handleClose }) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
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
    </div>
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
