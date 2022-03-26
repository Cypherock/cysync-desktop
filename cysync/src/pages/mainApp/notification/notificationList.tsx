import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import NotificationItem from './notificationItem';

const useStyles = makeStyles(() => ({
  mainContainer: {
    padding: '5px',
    width: '100%',
    boxSizing: 'border-box'
  },
  btnContainer: {
    margin: '10px',
    boxSizing: 'border-box'
  },
  list: {
    maxHeight: '300px',
    overflowY: 'auto',
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#ccc'
    },
    '&::-webkit-scrollbar': {
      width: '5px'
    }
  },
  noneTextContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px'
  },
  noneText: {
    opacity: '0.6'
  }
}));

const CustomButton = withStyles(() => ({
  root: {
    backgroundColor: '#474848'
  },
  text: {
    textTransform: 'none',
    fontWeight: 'bold'
  }
}))(Button);

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
  const classes = useStyles();

  return (
    <div className={classes.mainContainer}>
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
        <CustomButton
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
        </CustomButton>
      </div>
    </div>
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
