import Button, { ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import React from 'react';

const PREFIX = 'StyledAddWalletButton';

const classes = {
  root: `${PREFIX}-root`
};

const StyledButton = styled(Button)(({ theme }) => ({
  root: {
    textTransform: 'none',
    fontSize: '0.75rem',
    padding: `0px 16px`,
    color: theme.palette.secondary.main
  }
}));

const StyledAddWalletButtonRoot = styled(StyledButton)(({ theme }) => ({
  root: {
    textTransform: 'none',
    fontSize: '0.75rem',
    padding: `0px 16px`,
    color: theme.palette.secondary.main
  }
}));

const StyledAddWalletButton: React.FC<ButtonProps> = props => {
  return <StyledAddWalletButtonRoot className={classes.root} {...props} />;
};

export default StyledAddWalletButton;
