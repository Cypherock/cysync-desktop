import CloseIcon from '@mui/icons-material/Close';
import { CircularProgress } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MuiDialogActions from '@mui/material/DialogActions';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { WithStyles } from '@mui/styles';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import PropTypes from 'prop-types';
import React from 'react';

const NoButton = withStyles(() => ({
  root: {
    background: '#100F0F',
    color: '#FFFFFF',
    textTransform: 'none',
    padding: '0.5rem 3rem',
    border: '1px solid #2F2F2F',
    marginRight: '2rem'
  }
}))(Button);

const YesButton = withStyles((theme: Theme) => ({
  root: {
    background: '#DF2D2D',
    color: '#FFFFFF',
    textTransform: 'none',
    padding: '0.5rem 3rem',
    marginLeft: '2rem !important',
    '&:hover': {
      backgroundColor: theme.palette.error.dark
    }
  }
}))(Button);

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: 0,
      padding: theme.spacing(2)
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500]
    }
  });

export interface DialogTitleProps extends WithStyles<typeof styles> {
  id: string;
  children: React.ReactNode;
  onClose: () => void;
}

const DialogTitle = withStyles(styles)((props: DialogTitleProps) => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton
          aria-label="close"
          className={classes.closeButton}
          onClick={onClose}
          size="large"
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

const DialogContent = withStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(8),
    paddingTop: `${theme.spacing(8)} !important`,
    width: 500,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }
}))(MuiDialogContent);

const DialogActions = withStyles(() => ({
  root: {
    margin: 0,
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem 0rem 4rem'
  }
}))(MuiDialogActions);

type CustomizedDialogsProps = {
  open: boolean;
  handleClose: () => any;
  heading?: string;
  onYes: () => Promise<any>;
  children: any;
};

const CustomizedDialog: React.FC<CustomizedDialogsProps> = ({
  open,
  handleClose,
  heading,
  children,
  onYes
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleYes = async () => {
    setIsLoading(true);
    await onYes();
    handleClose();
  };

  React.useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);
  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="customized-dialog-title"
      open={open}
      maxWidth={false}
      style={{
        maxWidth: 'auto'
      }}
      onBackdropClick={null}
    >
      {heading && (
        <DialogTitle id="customized-dialog-title" onClose={handleClose}>
          <Typography color="textPrimary">{heading}</Typography>
        </DialogTitle>
      )}
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <NoButton onClick={handleClose} id="newDialogNo">
          No
        </NoButton>
        <YesButton onClick={handleYes} variant="contained" id="newDialogYes">
          {isLoading ? <CircularProgress size={20} color="secondary" /> : 'Yes'}
        </YesButton>
      </DialogActions>
    </Dialog>
  );
};

CustomizedDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  heading: PropTypes.string,
  onYes: PropTypes.func.isRequired,
  children: PropTypes.node
};

CustomizedDialog.defaultProps = {
  heading: undefined,
  children: undefined
};

export default CustomizedDialog;
