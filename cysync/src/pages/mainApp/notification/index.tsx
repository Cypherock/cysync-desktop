import IconButton from '@material-ui/core/IconButton';
import Popover from '@material-ui/core/Popover';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import NotificationIcon from '@material-ui/icons/NotificationsOutlined';
import React, { useEffect, useState } from 'react';

import { useConnection, useNotifications } from '../../../store/provider';

import NotificationList from './notificationList';

const useStyles = makeStyles(() => ({
  mainContainer: {
    padding: '10px 10px 10px 20px',
    minWidth: '350px'
  },
  headingContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heading: {
    fontSize: '22px',
    fontWeight: 'bold'
  },
  icon: {
    color: '#cccccc'
  },
  notificationBubble: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: '#DB953C',
    position: 'absolute',
    top: '12px',
    right: '12px'
  }
}));

const CustomPopover = withStyles(() => ({
  paper: {
    borderRadius: '12px'
  }
}))(Popover);

const Notification = () => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);
  const {
    data,
    getLatest,
    getNextPage,
    hasNextPage,
    isLoading,
    hasUnread,
    markAllRead
  } = useNotifications();
  const { connected } = useConnection();
  const [initialFetch, setIntialFetch] = useState(false);

  useEffect(() => {
    if (connected && !initialFetch) {
      setIntialFetch(true);
      getLatest();
    }
  }, [connected]);

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
    if (hasUnread) markAllRead();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <IconButton
        aria-describedby={id}
        aria-label="notification"
        size="medium"
        onClick={handleClick}
        style={{ position: 'relative' }}
      >
        <NotificationIcon color="secondary" fontSize="inherit" />
        {hasUnread && <div className={classes.notificationBubble} />}
      </IconButton>
      <CustomPopover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <div className={classes.mainContainer}>
          <div className={classes.headingContainer}>
            <Typography className={classes.heading} variant="h5">
              Notification
            </Typography>
            <IconButton aria-label="close" size="medium" onClick={handleClose}>
              <CloseIcon className={classes.icon} fontSize="inherit" />
            </IconButton>
          </div>
        </div>
        <NotificationList
          notifications={data}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          onNextPage={getNextPage}
          handleClose={handleClose}
        />
      </CustomPopover>
    </div>
  );
};

export default Notification;
