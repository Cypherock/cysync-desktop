import { styled } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import { SvgIconComponent } from '@mui/icons-material';
import PlusIcon from '@mui/icons-material/ControlPoint';
import DownloadIcon from '@mui/icons-material/GetApp';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../constants/routes';

const PREFIX = 'NotificationItem';

const classes = {
  mainContainer: `${PREFIX}-mainContainer`,
  title: `${PREFIX}-title`,
  description: `${PREFIX}-description`,
  date: `${PREFIX}-date`
};

const Root = styled('div')(() => ({
  [`& .${classes.mainContainer}`]: {
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

  [`& .${classes.title}`]: {
    fontWeight: '600'
  },

  [`& .${classes.description}`]: {
    opacity: '0.6'
  },

  [`& .${classes.date}`]: {
    opacity: '0.6'
  }
}));

const NotificationTypes = {
  DEFAULT: 0,
  APP_UPDATE: 1,
  DEVICE_UPDATE: 2
};

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
    <Root className={`${classes.container} ${containerClass}`}>
      <IconComponent className={classes.icon} />
    </Root>
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
