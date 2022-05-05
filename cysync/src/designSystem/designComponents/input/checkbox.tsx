import Checkbox, { CheckboxProps } from '@mui/material/Checkbox';
import { styled } from '@mui/material/styles';
import clsx from 'clsx';
import React from 'react';

const PREFIX = 'StyledCheckbox';

const classes = {
  root: `${PREFIX}-root`,
  icon: `${PREFIX}-icon`,
  checkedIcon: `${PREFIX}-checkedIcon`
};

const Root = styled(Checkbox)(({ theme }) => ({
  [`&.${classes.root}`]: {
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },

  [`& .${classes.icon}`]: {
    borderRadius: 3,
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${theme.palette.text.secondary}`,
    boxShadow:
      'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
    backgroundColor: 'none',
    '$root.Mui-focusVisible &': {
      outline: '2px auto rgba(19,124,189,.6)',
      outlineOffset: 2
    },
    'input:hover ~ &': {},
    'input:disabled ~ &': {
      boxShadow: 'none'
    }
  },

  [`& .${classes.checkedIcon}`]: {
    border: `2px solid ${theme.palette.info.light}`,
    '&:before': {
      display: 'block',
      width: 20,
      height: 20,
      backgroundImage:
        "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath" +
        " fill-rule='evenodd' clip-rule='evenodd' d='M12 5c-.28 0-.53.11-.71.29L7 9.59l-2.29-2.3a1.003 " +
        "1.003 0 00-1.42 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5A1.003 1.003 0 0012 5z' fill='%238484F1'/%3E%3C/svg%3E\")",
      content: '""'
    },
    'input:hover ~ &': {}
  }
}));

// Inspired by blueprintjs
function StyledCheckbox(props: CheckboxProps) {
  return (
    <Root
      className={classes.root}
      disableRipple
      color="default"
      checkedIcon={<span className={clsx(classes.icon, classes.checkedIcon)} />}
      icon={<span className={classes.icon} />}
      inputProps={{ 'aria-label': 'decorative checkbox' }}
      {...props}
    />
  );
}

export default StyledCheckbox;
