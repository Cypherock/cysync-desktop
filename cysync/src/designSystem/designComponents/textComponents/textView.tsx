import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import withStyles from '@mui/styles/withStyles';
import PropTypes from 'prop-types';
import React from 'react';

import ICONS from '../../iconGroups/iconConstants';
import Icon from '../icons/Icon';

const CustomPaper = withStyles(() => ({
  root: {
    position: 'relative',
    width: '90%',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.04)',
    padding: '10px 30px',
    margin: '15px 0px',
    transition: 'all 0.3s ease'
  }
}))(Paper);

const PREFIX = 'TextView';

const classes = {
  text: `${PREFIX}-text`,
  arrow: `${PREFIX}-arrow`,
  checkmark: `${PREFIX}-checkmark`,
  loading: `${PREFIX}-loading`
};

const Root = styled(CustomPaper)(({ theme }) => ({
  [`& .${classes.text}`]: {
    color: (completed: any) =>
      completed ? theme.palette.info.light : theme.palette.text.primary,
    maxWidth: '80%'
  },
  [`& .${classes.arrow}`]: {
    marginRight: '0.5rem'
  },
  [`& .${classes.checkmark}`]: {
    position: 'absolute',
    right: '1rem',
    transition: 'all 0.3s ease'
  },
  [`& .${classes.loading}`]: {
    margin: '0 10px',
    position: 'absolute',
    right: '1rem'
  }
}));

type ToggleButtonProps = {
  text: any; // needs to be able to take formatted text
  completed: boolean;
  inProgress: boolean;
  failed?: boolean;
  stylex?: React.CSSProperties;
};

const ToggleButton: React.FC<ToggleButtonProps> = props => {
  const { text, completed, stylex, inProgress, failed } = props;
  const theme = useTheme();
  return (
    <Root variant="outlined" elevation={0} style={{ ...stylex }}>
      <Icon
        className={classes.arrow}
        icon={ICONS.rightArrow}
        viewBox="0 0 25 14"
        size={17}
        color="orange"
      />
      <Typography variant="body1" className={classes.text}>
        {text}
      </Typography>
      {failed ? (
        <Icon
          size={15}
          viewBox="0 0 14 14"
          color="red"
          icon={ICONS.close}
          className={classes.checkmark}
        />
      ) : null}
      {completed ? (
        <Icon
          className={classes.checkmark}
          icon={ICONS.checkmark}
          viewBox="0 0 479 479"
          color={theme.palette.text.secondary}
        />
      ) : null}
      {inProgress ? (
        <CircularProgress
          size={22}
          className={classes.loading}
          color="secondary"
        />
      ) : null}
    </Root>
  );
};

ToggleButton.propTypes = {
  text: PropTypes.string.isRequired,
  completed: PropTypes.bool.isRequired,
  inProgress: PropTypes.bool.isRequired,
  failed: PropTypes.bool,
  stylex: PropTypes.object
};

ToggleButton.defaultProps = {
  failed: undefined,
  stylex: {}
};

export default ToggleButton;
