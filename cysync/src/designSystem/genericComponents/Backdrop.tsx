import MBackdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles, Theme } from '@material-ui/core/styles';
import React from 'react';

const useStyles = makeStyles((theme: Theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff'
  }
}));

type Props = {
  open: boolean;
};

const Backdrop: React.FC<Props> = ({ open }: Props) => {
  const classes = useStyles();

  return (
    <MBackdrop className={classes.backdrop} open={open}>
      <CircularProgress color="secondary" />
    </MBackdrop>
  );
};

export default Backdrop;
