import CloseIcon from '@mui/icons-material/Close';
import NotificationIcon from '@mui/icons-material/NotificationsOutlined';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';

import { useNetwork, useNotifications } from '../../../store/provider';

import NotificationList from './notificationList';

const PREFIX = 'Notification';

const classes = {
  paper: `${PREFIX}-paper`,
  mainContainer: `${PREFIX}-mainContainer`,
  headingContainer: `${PREFIX}-headingContainer`,
  heading: `${PREFIX}-heading`,
  icon: `${PREFIX}-icon`,
  notificationBubble: `${PREFIX}-notificationBubble`
};

const Root = styled('div')(() => ({
  [`& .${classes.notificationBubble}`]: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: '#DB953C',
    position: 'absolute',
    top: '8px',
    right: '8px'
  }
}));

const PopoverRoot = styled(Popover)(() => ({
  [`& .${classes.mainContainer}`]: {
    padding: '10px 10px 10px 20px',
    minWidth: '350px'
  },

  [`& .${classes.headingContainer}`]: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  [`& .${classes.heading}`]: {
    fontSize: '22px',
    fontWeight: 'bold'
  },

  [`& .${classes.icon}`]: {
    color: '#cccccc'
  }
}));

const Notification = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const {
    data,
    updateLatest,
    getNextPage,
    hasNextPage,
    isLoading,
    hasUnread,
    markAllRead
  } = useNotifications();
  const { connected } = useNetwork();
  const [initialFetch, setIntialFetch] = useState(false);

  useEffect(() => {
    if (connected && !initialFetch) {
      setIntialFetch(true);
      updateLatest();
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
    <Root>
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
      <PopoverRoot
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
        classes={{
          paper: classes.paper
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
      </PopoverRoot>
    </Root>
  );
};

export default Notification;
