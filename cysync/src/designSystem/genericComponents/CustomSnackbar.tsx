import Snackbar, { SnackbarProps } from '@material-ui/core/Snackbar';
import { makeStyles, Theme } from '@material-ui/core/styles';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
import PropTypes from 'prop-types';
import React from 'react';

function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '100%',
    '& > * + *': {
      marginTop: theme.spacing(2)
    }
  }
}));

interface Props {
  text: string;
  open: boolean;
  severity: AlertProps['severity'];
  handleClose?: (event?: React.SyntheticEvent, reason?: string) => void;
  autoHideDuration?: SnackbarProps['autoHideDuration'];
}

const CustomSnackbar: React.FC<Props> = ({
  text,
  open,
  severity,
  handleClose,
  autoHideDuration = 6000
}) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity={severity}>
          {text}
        </Alert>
      </Snackbar>
    </div>
  );
};

CustomSnackbar.propTypes = {
  text: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  severity: PropTypes.oneOf(['success', 'info', 'error', 'warning']),
  handleClose: PropTypes.func,
  autoHideDuration: PropTypes.number
};

CustomSnackbar.defaultProps = {
  handleClose: () => {},
  autoHideDuration: undefined,
  severity: undefined
};

export default CustomSnackbar;
