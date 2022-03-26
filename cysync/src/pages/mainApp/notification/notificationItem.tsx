import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { SvgIconComponent } from '@material-ui/icons';
import PlusIcon from '@material-ui/icons/ControlPoint';
import DownloadIcon from '@material-ui/icons/GetApp';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../constants/routes';

const NotificationTypes = {
  DEFAULT: 0,
  APP_UPDATE: 1,
  DEVICE_UPDATE: 2
};

const useStyles = makeStyles(() => ({
  mainContainer: {
    width: '100%',
    padding: '4px 10px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '5px',
    boxSizing: 'border-box',
    borderRadius: '4px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#3B434B'
    }
  },
  title: {
    fontWeight: '600'
  },
  description: {
    opacity: '0.6'
  },
  date: {
    opacity: '0.6'
  }
}));

const iconStyles = makeStyles(() => ({
  container: {
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '10px'
  },
  containerType0: {
    backgroundColor: '#403D3A'
  },
  containerType1: {
    backgroundColor: '#DB953C'
  },
  containerType2: {
    backgroundColor: '#DB953C'
  },
  icon: {
    color: '#fff'
  }
}));

type AvatarType = {
  type: number;
};

const NotificationAvatar: React.FC<AvatarType> = ({ type }) => {
  const classes = iconStyles();

  let containerClass: string = classes.containerType0;
  let IconComponent: SvgIconComponent = PlusIcon;

  switch (type) {
    case NotificationTypes.APP_UPDATE:
      containerClass = classes.containerType1;
      IconComponent = DownloadIcon;
      break;
    case NotificationTypes.DEVICE_UPDATE:
      containerClass = classes.containerType2;
      IconComponent = DownloadIcon;
      break;
    default:
      break;
  }

  return (
    <div className={`${classes.container} ${containerClass}`}>
      <IconComponent className={classes.icon} />
    </div>
  );
};

NotificationAvatar.propTypes = {
  type: PropTypes.number.isRequired
};

type Props = {
  notification: {
    title?: string | null;
    description?: string | null;
    createdAt?: Date | null;
    type?: number | null;
  };
  handleClose: () => void;
};

const NotificationItem: React.FC<Props> = ({ notification, handleClose }) => {
  const classes = useStyles();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDesciption] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState(0);

  useEffect(() => {
    if (notification) {
      if (notification.title) {
        setTitle(notification.title);
      }
      if (notification.description) {
        setDesciption(notification.description);
      }
      if (notification.createdAt) {
        setDate(notification.createdAt.toString());
      }
      if (notification.type) {
        setType(notification.type);
      }
    }
  }, []);

  const onClick = () => {
    if (type === NotificationTypes.DEVICE_UPDATE) {
      navigate(Routes.settings.device.upgrade);
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // When key pressed is 'Enter' or 'Space'
    if (e.keyCode === 13 || e.keyCode === 32) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={title}
      role="button"
      onClick={onClick}
      className={classes.mainContainer}
    >
      <NotificationAvatar type={type} />
      <div>
        <Typography className={classes.title}>{title}</Typography>
        <Typography className={classes.description}>{description}</Typography>
        <Typography variant="body2" className={classes.date}>
          <small>{date}</small>
        </Typography>
      </div>
    </div>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    createdAt: PropTypes.instanceOf(Date),
    type: PropTypes.number
  }).isRequired,
  handleClose: PropTypes.func.isRequired
};

export default NotificationItem;
