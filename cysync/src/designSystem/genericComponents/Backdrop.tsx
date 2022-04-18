import MBackdrop from '@mui/material/Backdrop';
import { styled } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import React from 'react';

const PREFIX = 'Backdrop';

const classes = {
  backdrop: `${PREFIX}-backdrop`
};

const StyledMBackdrop = styled(MBackdrop)(({ theme }) => ({
  [`&.${classes.backdrop}`]: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff'
  }
}));

type Props = {
  open: boolean;
};

const Backdrop: React.FC<Props> = ({ open }: Props) => {
  return (
    <StyledMBackdrop className={classes.backdrop} open={open}>
      <CircularProgress color="secondary" />
    </StyledMBackdrop>
  );
};

export default Backdrop;
