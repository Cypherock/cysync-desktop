import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import NotificationItem from './notificationItem';

const PREFIX = 'NotificationList';

const classes = {
  root: `${PREFIX}-root`,
  text: `${PREFIX}-text`,
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

const CustomButton = Button;

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
        <CustomButton
          fullWidth
          size="large"
          onClick={onNextPage}
          disabled={isLoading || !hasNextPage}
          classes={{
            root: classes.root,
            text: classes.text
          }}>
          {isLoading ? (
            <CircularProgress color="secondary" size={20} />
          ) : (
            <div>Load more</div>
          )}
        </CustomButton>
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
