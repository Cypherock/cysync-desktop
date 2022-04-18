import { Button, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const PREFIX = 'NewButton';

const classes = {
  root: `${PREFIX}-root`,
  disabled: `${PREFIX}-disabled`
};

const StyledButton = styled(Button)(({ theme }) => ({
  [`& .${classes.root}`]: {
    background: '#71624C',
    color: '#FFFFFF',
    textTransform: 'none',
    '&:hover': {
      background: theme.palette.secondary.dark
    }
  },

  [`& .${classes.disabled}`]: {
    backgroundColor: `${theme.palette.text.secondary} !important`,
    color: `${theme.palette.primary.main} !important`,
    cursor: 'not-allowed !important'
  }
}));

const PrimaryCustomButton = Button;

const NewButton = (props: ButtonProps) => {
  const { color } = props;

  if (!color || color === 'primary')
    return (
      <PrimaryCustomButton
        {...props}
        classes={{
          root: classes.root,
          disabled: classes.disabled
        }}
      />
    );

  return <StyledButton {...props} />;
};

export default NewButton;
