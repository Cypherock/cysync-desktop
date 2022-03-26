import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogActions from '@material-ui/core/DialogActions';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
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
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton
          aria-label="close"
          className={classes.closeButton}
          onClick={onClose}
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
    paddingTop: `${theme.spacing(8)}px !important`,
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
  onYes: () => any;
  children: any;
};

const CustomizedDialog: React.FC<CustomizedDialogsProps> = ({
  open,
  handleClose,
  heading,
  children,
  onYes
}) => {
  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="customized-dialog-title"
      open={open}
      maxWidth={false}
      style={{
        maxWidth: 'auto'
      }}
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
        <YesButton onClick={onYes} variant="contained" id="newDialogYes">
          Yes
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
