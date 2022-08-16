import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useNetwork } from '../store/provider';

const PREFIX = 'InternetStatus';

const classes = {
  root: `${PREFIX}-root`,
  show: `${PREFIX}-show`,
  hide: `${PREFIX}-hide`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: '100%',
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.error.contrastText,
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'opacity 0.3s, height 0.3s'
  },

  [`&.${classes.show}`]: {
    opacity: '1',
    height: '25px'
  },

  [`&.${classes.hide}`]: {
    opacity: '0',
    height: '0'
  }
}));

const InternetStatus = () => {
  const { connected } = useNetwork();

  return (
    <Root
      className={`${classes.root} ${
        connected !== false ? classes.hide : classes.show
      }`}
    >
      <Typography>Check your internet connection.</Typography>
    </Root>
  );
};

export default InternetStatus;
