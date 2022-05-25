import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import PropTypes from 'prop-types';
import React from 'react';

const PREFIX = 'SwitchButton';

const classes = {
  root: `${PREFIX}-root`,
  label: `${PREFIX}-label`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    alignItems: 'center'
  },

  [`& .${classes.label}`]: {
    color: theme.palette.primary.contrastText,
    fontSize: 20
  }
}));

const IOSSwitch = styled(Switch)(({ theme }) => ({
  width: 32,
  height: 18,
  padding: 0,
  paddingBottom: 2,
  margin: `0px 10px `,
  '& .MuiSwitch-switchBase': {
    padding: 1,
    '&.Mui-checked': {
      paddingTop: 1,
      transform: 'translateX(15px)',
      color: theme.palette.primary.main,
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.primary.main,
        opacity: 1,
        border: `1px solid ${theme.palette.secondary.main}`
      }
    },
    '& .Mui-focusVisible .MuiSwitch-thumb': {
      color: theme.palette.secondary.main
    }
  },
  '& .MuiSwitch-thumb': {
    width: 14,
    height: 14,
    marginTop: 1,
    marginLeft: 1,
    background: theme.palette.secondary.main
  },
  '& .MuiSwitch-track': {
    borderRadius: 18 / 2,
    border: `1px solid ${theme.palette.secondary.light}`,
    backgroundColor: theme.palette.primary.main,
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border'])
  },
  '&.Mui-checked': {
    padding: 0
  }
}));

type SwitchButtonProps = {
  completed: boolean;
  handleChange: (event: any) => void | any;
  label?: string;
  name?: string;
  disabled?: boolean;
};

const SwitchButton: React.FC<SwitchButtonProps> = ({
  completed,
  label,
  handleChange,
  name,
  disabled = false
}: SwitchButtonProps) => {
  return (
    <Root className={classes.root}>
      <span className={classes.label}>{label}</span>
      <IOSSwitch
        disabled={disabled}
        checked={completed}
        onChange={handleChange}
        name={name}
        focusVisibleClassName=".Mui-focusVisible"
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
