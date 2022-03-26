import Paper from '@material-ui/core/Paper';
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme,
  withStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
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
    background: '#15181D',
    padding: '10px 30px',
    margin: '15px 0px',
    transition: 'all 0.3s ease'
  }
}))(Paper);

type ToggleProps = {
  text: string;
  completed: boolean;
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    text: {
      color: completed =>
        completed ? theme.palette.secondary.main : theme.palette.text.primary,
      maxWidth: '80%',
      lineHeight: '25px'
    },
    arrow: {
      marginRight: '0.5rem'
    },
    checkmark: {
      position: 'absolute',
      right: '1rem',
      transition: 'all 0.3s ease'
    }
  })
);

const ToggleButton: React.FC<ToggleProps> = ({ text, completed }) => {
  const classes = useStyles(completed);
  const theme = useTheme();
  return (
    <CustomPaper
      variant="outlined"
      elevation={0}
      style={{
        background: !completed ? theme.palette.primary.light : '#15181D',
        border: !completed ? `0.5px solid ${theme.palette.text.primary}` : ''
      }}
    >
      <Icon
        className={classes.arrow}
        icon={ICONS.rightArrow}
        viewBox="0 0 25 14"
        size={17}
        color={
          completed ? theme.palette.secondary.main : theme.palette.text.primary
        }
      />
      <Typography variant="body1" className={classes.text}>
        {text}
      </Typography>
      {completed ? (
        <Icon
          className={classes.checkmark}
          icon={ICONS.checkmark}
          viewBox="0 0 479 479"
          color={theme.palette.secondary.main}
        />
      ) : null}
    </CustomPaper>
  );
};

ToggleButton.propTypes = {
  text: PropTypes.string.isRequired,
  completed: PropTypes.bool.isRequired
};

export default ToggleButton;
