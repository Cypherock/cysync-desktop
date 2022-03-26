import { makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React from 'react';

import { useConnection } from '../store/provider';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.error.dark,
    color: theme.palette.error.contrastText,
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'opacity 0.3s, height 0.3s'
  },
  show: {
    opacity: '1',
    height: '25px'
  },
  hide: {
    opacity: '0',
    height: '0'
  }
}));

const InternetStatus = () => {
  const classes = useStyles();
  const { connected } = useConnection();

  return (
    <div
      className={`${classes.root} ${
        connected !== false ? classes.hide : classes.show
      }`}
    >
      <Typography>
        No internet connection. Please connect to the internet for better
        experience.
      </Typography>
    </div>
  );
};

export default InternetStatus;
