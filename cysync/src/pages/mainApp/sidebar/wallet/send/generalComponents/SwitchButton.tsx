import {
  createStyles,
  makeStyles,
  Theme,
  withStyles
} from '@material-ui/core/styles';
import Switch, { SwitchClassKey, SwitchProps } from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';

interface Styles extends Partial<Record<SwitchClassKey, string>> {
  focusVisible?: string;
}

interface Props extends SwitchProps {
  classes: Styles;
}

const IOSSwitch = withStyles((theme: Theme) =>
  createStyles({
    root: {
      width: 32,
      height: 18,
      padding: 0,
      paddingBottom: 2,
      margin: `0px ${theme.spacing(1)}px `
    },
    switchBase: {
      padding: 1,
      '&$checked': {
        paddingTop: 1,
        transform: 'translateX(15px)',
        color: theme.palette.common.white,
        '& + $track': {
          backgroundColor: theme.palette.primary.main,
          opacity: 1,
          border: `1px solid ${theme.palette.secondary.light}`
        }
      },
      '&$focusVisible $thumb': {
        color: theme.palette.secondary.light
      }
    },
    thumb: {
      width: 14,
      height: 14,
      marginTop: 1,
      marginLeft: 1,
      background: theme.palette.secondary.main
    },
    track: {
      borderRadius: 18 / 2,
      border: `1px solid ${theme.palette.secondary.main}`,
      backgroundColor: theme.palette.primary.main,
      opacity: 1,
      transition: theme.transitions.create(['background-color', 'border'])
    },
    checked: {
      padding: 0
    },
    focusVisible: {}
  })
)(({ classes, ...props }: Props) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked
      }}
      {...props}
    />
  );
});

type SwitchButtonProps = {
  completed: boolean;
  label?: string | undefined;
  handleChange: () => void;
};

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      alignItems: 'center'
    },
    sliderButton: {}
  })
);

const SwitchButton: React.FC<SwitchButtonProps> = ({
  completed,
  label,
  handleChange
}) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Typography color="textSecondary" variant="caption">
        {label}
      </Typography>
      <IOSSwitch
        checked={completed}
        onChange={handleChange}
        name="checkedB"
        className={classes.sliderButton}
      />
    </div>
  );
};

SwitchButton.propTypes = {
  completed: PropTypes.bool.isRequired,
  label: PropTypes.string,
  handleChange: PropTypes.func.isRequired
};

SwitchButton.defaultProps = {
  label: undefined
};

export default SwitchButton;
