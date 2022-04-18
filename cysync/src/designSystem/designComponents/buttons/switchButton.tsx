import { styled } from '@mui/material/styles';
import Switch, { SwitchClassKey, SwitchProps } from '@mui/material/Switch';
import PropTypes from 'prop-types';
import React from 'react';

const PREFIX = 'SwitchButton';

const classes = {
  root: `${PREFIX}-root`,
  switchBase: `${PREFIX}-switchBase`,
  thumb: `${PREFIX}-thumb`,
  track: `${PREFIX}-track`,
  checked: `${PREFIX}-checked`,
  focusVisible: `${PREFIX}-focusVisible`,
  root2: `${PREFIX}-root2`,
  label: `${PREFIX}-label`,
  sliderButton: `${PREFIX}-sliderButton`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    alignItems: 'center'
  },

  [`& .${classes.label}`]: {
    color: theme.palette.primary.contrastText,
    fontSize: 20
  },

  [`& .${classes.sliderButton}`]: {}
}));

interface Styles extends Partial<Record<SwitchClassKey, string>> {
  focusVisible?: string;
}

interface Props extends SwitchProps {
  classes: Styles;
}

const IOSSwitchRoot = styled(Switch)(({ theme }) => ({
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
}));

const IOSSwitch: React.FC<Props> = props => {
  return (
    <IOSSwitchRoot
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
};

type SwitchButtonProps = {
  completed: boolean;
  handleChange: (event: any) => void | any;
  label?: string;
  name?: string;
};

const SwitchButton: React.FC<SwitchButtonProps> = ({
  completed,
  label,
  handleChange,
  name
}: SwitchButtonProps) => {
  return (
    <Root className={classes.root}>
      <span className={classes.label}>{label}</span>
      <IOSSwitch
        checked={completed}
        onChange={handleChange}
        name={name}
        className={classes.sliderButton}
        classes={{
          root: classes.root,
          switchBase: classes.switchBase,
          thumb: classes.thumb,
          track: classes.track,
          checked: classes.checked,
          focusVisible: classes.focusVisible
        }}
      />
    </Root>
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
