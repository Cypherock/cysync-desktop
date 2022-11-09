import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../constants/routes';
import CustomButton from '../../../../designSystem/designComponents/buttons/button';
import { useWallets } from '../../../../store/provider';

import HorizontalTabs from './HorizontalTabs';

const PREFIX = 'Swap';

const classes = {
  root: `${PREFIX}-root`,
  tab: `${PREFIX}-tab`,
  loaderContainer: `${PREFIX}-loaderContainer`
};

const Root = styled(Grid)(({ theme }) => ({
  [`& .${classes.root}`]: {
    flexGrow: 1,
    background: theme.palette.primary.main,
    borderBottom: `1px solid ${theme.palette.primary.light}`
  },
  [`& .${classes.tab}`]: {
    color: theme.palette.text.primary,
    textTransform: 'none'
  },
  [`& .${classes.loaderContainer}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '4rem'
  }
}));

const Swap = () => {
  const { allWallets } = useWallets();

  const navigate = useNavigate();
  const theme = useTheme();
  const [open, setOpen] = React.useState(true);
  const onAddWallet = () => {
    setOpen(false);
    navigate(Routes.wallet.index + '?openImportWalletForm=true');
  };

  useEffect(() => {
    if (allWallets[0]._id === '') setOpen(true);
    else {
      setOpen(false);
    }
  }, [allWallets]);
  return (
    <Root container>
      {open && (
        <div
          style={{
            width: '80%',
            height: '88%',
            position: 'absolute',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            display: 'flex'
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '101%',
              height: '101%',
              backdropFilter: 'blur(5px)'
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              zIndex: 100
            }}
          >
            <Typography
              variant="h2"
              color="textPrimary"
              style={{ marginBottom: '2rem' }}
            >
              Import a wallet account from X1 wallet
            </Typography>
            <CustomButton
              style={{ padding: '0.5rem 2rem ' }}
              onClick={onAddWallet}
            >
              Import Wallet
            </CustomButton>
          </div>
        </div>
      )}
      <Grid item xs={12}>
        <Typography
          variant="h2"
          style={{ color: theme.palette.secondary.dark }}
          gutterBottom
        >
          Swap
        </Typography>
      </Grid>
      <HorizontalTabs />
    </Root>
  );
};

export default Swap;
