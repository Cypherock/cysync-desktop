import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import ICONS from '../../../../../../designSystem/iconGroups/iconConstants';

const useStylesText = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.7rem 1rem',
      borderRadius: '0.5rem',
      background: '#13161A'
    },
    left: {
      display: 'flex'
    },
    completed: {
      color: theme.palette.info.light
    },
    inComplete: {
      color: theme.palette.text.primary
    }
  })
);

type DynamicTextViewProps = {
  state: -1 | 0 | 1 | 2;
  text: string;
};

const DynamicTextView: React.FC<DynamicTextViewProps> = ({ state, text }) => {
  const classes = useStylesText();

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
    <Grid container className={classes.root}>
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
    </Grid>
  );
};

DynamicTextView.propTypes = {
  state: PropTypes.oneOf<-1 | 0 | 1 | 2>([-1, 0, 1, 2]).isRequired,
  text: PropTypes.string.isRequired
};

export default DynamicTextView;
