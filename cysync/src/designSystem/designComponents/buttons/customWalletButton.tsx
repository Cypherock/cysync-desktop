import Button from '@material-ui/core/Button';
import { createStyles, Theme, withStyles } from '@material-ui/core/styles';
import React from 'react';

const StyledAddWalletButton = withStyles((theme: Theme) =>
  createStyles({
    root: {
      textTransform: 'none',
      fontSize: '0.75rem',
      padding: `0px 16px`,
      color: theme.palette.secondary.main
    }
  })
)((props: any) => <Button {...props} />);

export default StyledAddWalletButton;
