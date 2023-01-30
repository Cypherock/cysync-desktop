import UpdateIcon from '@mui/icons-material/Update';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

const PREFIX = 'UpdaterAppPersistent';

const classes = {
  show: `${PREFIX}-show`,
  content: `${PREFIX}-content`,
  innerContainer: `${PREFIX}-innerContainer`,
  button: `${PREFIX}-button`
};

const Root = styled(Grid)(() => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  transition: 'height 0.3s',
  height: '0px',
  [`&.${classes.show}`]: {
    height: '35px'
  },
  [`& .${classes.content}`]: {
    boxSizing: 'border-box',
    borderRadius: '0',
    width: '100%',
    height: '35px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F57F16'
  },
  [`& .${classes.innerContainer}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.button}`]: {
    background: 'none',
    color: '#fff',
    textTransform: 'none',
    padding: '5px',
    marginLeft: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: 'bold'
  }
}));

interface PersistentInfoProps {
  show: boolean;
  state: number;
  downloadUpdate: () => void;
  installUpdate: () => void;
  version: string;
}

const PersistentInfo: React.FC<PersistentInfoProps> = ({
  state,
  downloadUpdate,
  installUpdate,
  version,
  show
}) => {
  const getText = () => {
    switch (state) {
      case 0:
        return null;
      case 1:
        return (
          <>
            <UpdateIcon sx={{ color: 'white', mr: 2 }} />
            Latest version {version} is available.{' '}
            <div onClick={downloadUpdate} className={classes.button}>
              Download Now
            </div>
          </>
        );
      case 2:
        return (
          <>
            <UpdateIcon sx={{ color: 'white', mr: 2 }} />
            Latest version {version} is available.{' '}
            <div className={classes.button}>Downloading...</div>
          </>
        );
      case 3:
        return (
          <>
            <UpdateIcon sx={{ color: 'white', mr: 2 }} />
            Latest version {version} is available. Downloaded,{' '}
            <div onClick={installUpdate} className={classes.button}>
              Install Now
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const content = getText();

  if (!content) return null;

  return (
    <Root container className={show && classes.show}>
      <Paper className={classes.content}>
        <Typography color="white" variant="body1" sx={{ fontSize: '13px' }}>
          <div className={classes.innerContainer}>{content}</div>
        </Typography>
      </Paper>
    </Root>
  );
};

PersistentInfo.propTypes = {
  show: PropTypes.bool.isRequired,
  state: PropTypes.number.isRequired,
  downloadUpdate: PropTypes.func.isRequired,
  installUpdate: PropTypes.func.isRequired,
  version: PropTypes.string.isRequired
};

export default PersistentInfo;
