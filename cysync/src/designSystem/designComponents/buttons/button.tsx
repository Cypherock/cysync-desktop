import { Button, ButtonProps } from '@material-ui/core';
import { Theme, withStyles } from '@material-ui/core/styles';
import React from 'react';

const PrimaryCustomButton = withStyles((theme: Theme) => ({
  root: {
    background: '#71624C',
    color: '#FFFFFF',
    textTransform: 'none',
    '&:hover': {
      background: theme.palette.secondary.dark
    }
  },
  disabled: {
    backgroundColor: `${theme.palette.text.secondary} !important`,
    color: `${theme.palette.primary.main} !important`,
    cursor: 'not-allowed !important'
  }
}))(Button);

const NewButton = (props: ButtonProps) => {
  const { color } = props;

  if (!color || color === 'primary') return <PrimaryCustomButton {...props} />;

  return <Button {...props} />;
};

export default NewButton;
