import {
  createStyles,
  makeStyles,
  Theme,
  withStyles
} from '@material-ui/core/styles';
import Switch, { SwitchClassKey, SwitchProps } from '@material-ui/core/Switch';
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
      margin: `0px 10px `
    },
    switchBase: {
      padding: 1,
      '&$checked': {
        paddingTop: 1,
        transform: 'translateX(15px)',
        color: theme.palette.primary.main,
        '& + $track': {
          backgroundColor: theme.palette.primary.main,
          opacity: 1,
          border: `1px solid ${theme.palette.secondary.main}`
        }
      },
      '&$focusVisible $thumb': {
        color: theme.palette.secondary.main
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
      border: `1px solid ${theme.palette.secondary.light}`,
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
  handleChange: (event: any) => void | any;
  label?: string;
  name?: string;
};

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center'
  },
  label: {
    color: theme.palette.primary.contrastText,
    fontSize: 20
  },
  sliderButton: {}
}));

const SwitchButton: React.FC<SwitchButtonProps> = ({
  completed,
  label,
  handleChange,
  name
}: SwitchButtonProps) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <span className={classes.label}>{label}</span>
      <IOSSwitch
        checked={completed}
        onChange={handleChange}
        name={name}
        className={classes.sliderButton}
      />
    </div>
  );
};

SwitchButton.propTypes = {
  completed: PropTypes.bool.isRequired,
  handleChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  name: PropTypes.string
};

SwitchButton.defaultProps = {
  label: undefined,
  name: undefined
};

export default SwitchButton;
