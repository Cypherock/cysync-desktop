import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import Button from '../../../../designSystem/designComponents/buttons/button';

const PREFIX = 'UpdaterAppPersistent';

const classes = {
  content: `${PREFIX}-content`,
  button: `${PREFIX}-button`
};

const Root = styled('div')(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  justifyContent: 'center',
  [`& .${classes.content}`]: {
    maxWidth: '800px',
    padding: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  [`& .${classes.button}`]: {
    background: '#71624C',
    color: theme.palette.text.primary,
    textTransform: 'none',
    padding: '0.5rem 1.5rem',
    marginLeft: '1rem',
    '&:hover': {
      background: theme.palette.secondary.dark
    }
  }
}));

interface PersistentInfoProps {
  state: number;
  showPopup: () => void;
  close: () => void;
}

const PersistentInfo: React.FC<PersistentInfoProps> = ({
  state,
  showPopup,
  close
}) => {
  const getText = () => {
    switch (state) {
      case 0:
        return 'Checking for update';
      case 1:
        return 'Update is available';
      default:
        return null;
    }
  };

  return (
    <Root>
      <Paper className={classes.content}>
        <Typography variant="subtitle1">{getText()}</Typography>
        {state === 0 ? null : (
          <Button onClick={showPopup} style={{ marginLeft: '30px' }}>
            SHOW
          </Button>
        )}
        <Button
          color="secondary"
          onClick={close}
          style={{ marginLeft: '20px' }}
        >
          Close
        </Button>
      </Paper>
    </Root>
  );
};

PersistentInfo.propTypes = {
  state: PropTypes.number.isRequired,
  showPopup: PropTypes.func.isRequired,
  close: PropTypes.func.isRequired
};

export default PersistentInfo;
