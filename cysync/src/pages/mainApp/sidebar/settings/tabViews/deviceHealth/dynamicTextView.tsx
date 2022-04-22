import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import ICONS from '../../../../../../designSystem/iconGroups/iconConstants';

const PREFIX = 'DynamicTextView';

const classes = {
  root: `${PREFIX}-root`,
  left: `${PREFIX}-left`,
  completed: `${PREFIX}-completed`,
  inComplete: `${PREFIX}-inComplete`
};

const Root = styled(Grid)(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.7rem 1rem',
    borderRadius: '0.5rem',
    background: '#13161A'
  },
  [`& .${classes.left}`]: {
    display: 'flex'
  },
  [`& .${classes.completed}`]: {
    color: theme.palette.info.light
  },
  [`& .${classes.inComplete}`]: {
    color: theme.palette.text.primary
  }
}));

type DynamicTextViewProps = {
  state: -1 | 0 | 1 | 2;
  text: string;
};

const DynamicTextView: React.FC<DynamicTextViewProps> = ({ state, text }) => {
  const stateIcon = () => {
    switch (state) {
      case 0:
        return null;
      case 1:
        return <CircularProgress size={20} color="secondary" />;
      case -1:
        return (
          <Icon
            size={15}
            viewBox="0 0 14 14"
            color="red"
            icon={ICONS.close}
            style={{ margin: '0px !important' }}
          />
        );
      case 2:
        return (
          <Icon
            size={15}
            viewBox="0 0 450 450"
            icon={ICONS.checkmark}
            color="white"
            style={{ margin: '0px !important' }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Root container className={classes.root}>
      <div className={classes.left}>
        <Icon
          size={20}
          viewBox="0 0 24 10"
          icon={ICONS.rightArrow}
          color="orange"
        />
        <Typography
          className={state === 2 ? classes.completed : classes.inComplete}
        >
          {text}
        </Typography>
      </div>
      {stateIcon()}
    </Root>
  );
};

DynamicTextView.propTypes = {
  state: PropTypes.oneOf<-1 | 0 | 1 | 2>([-1, 0, 1, 2]).isRequired,
  text: PropTypes.string.isRequired
};

export default DynamicTextView;
