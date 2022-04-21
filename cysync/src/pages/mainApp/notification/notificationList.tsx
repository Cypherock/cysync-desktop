import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import NotificationItem from './notificationItem';

const PREFIX = 'NotificationList';

const classes = {
  mainContainer: `${PREFIX}-mainContainer`,
  btnContainer: `${PREFIX}-btnContainer`,
  list: `${PREFIX}-list`,
  noneTextContainer: `${PREFIX}-noneTextContainer`,
  noneText: `${PREFIX}-noneText`
};

const Root = styled('div')(() => ({
  [`&.${classes.mainContainer}`]: {
    padding: '5px',
    width: '100%',
    boxSizing: 'border-box'
  },

  [`& .${classes.btnContainer}`]: {
    margin: '10px',
    boxSizing: 'border-box'
  },

  [`& .${classes.list}`]: {
    maxHeight: '300px',
    overflowY: 'auto',
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#ccc'
    },
    '&::-webkit-scrollbar': {
      width: '5px'
    }
  },

  [`& .${classes.noneTextContainer}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px'
  },

  [`& .${classes.noneText}`]: {
    opacity: '0.6'
  }
}));

const buttonTheme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: '#474848',
          color: '#cccccc'
        },
        text: {
          textTransform: 'none',
          fontWeight: 'bold'
        }
      }
    }
  }
});

type Props = {
  notifications: any[];
  hasNextPage: boolean;
  onNextPage: () => void;
  isLoading: boolean;
  handleClose: () => void;
};

const NotificationList: React.FC<Props> = ({
  notifications,
  hasNextPage,
  onNextPage,
  isLoading,
  handleClose
}) => {
  return (
    <Root className={classes.mainContainer}>
      <div className={classes.list}>
        {notifications.length === 0 && (
          <div className={classes.noneTextContainer}>
            <Typography variant="subtitle1" className={classes.noneText}>
              No notification available.
            </Typography>
          </div>
        )}
        {notifications.map(notif => (
          <NotificationItem
            handleClose={handleClose}
            key={notif.dbId}
            notification={notif}
          />
        ))}
      </div>

      <div className={classes.btnContainer}>
        <ThemeProvider theme={buttonTheme}>
          <Button
            fullWidth
            size="large"
            onClick={onNextPage}
            disabled={isLoading || !hasNextPage}
          >
            {isLoading ? (
              <CircularProgress color="secondary" size={20} />
            ) : (
              <div>Load more</div>
            )}
          </Button>
        </ThemeProvider>
      </div>
    </Root>
  );
};

NotificationList.propTypes = {
  notifications: PropTypes.array.isRequired,
  hasNextPage: PropTypes.bool.isRequired,
  onNextPage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
};

export default NotificationList;
