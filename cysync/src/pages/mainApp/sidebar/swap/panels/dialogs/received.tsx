import { CallReceived, ContentCopy } from '@mui/icons-material';
import { Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import React from 'react';

import Button from '../../../../../../designSystem/designComponents/buttons/button';
import CustomDialog from '../../../../../../designSystem/designComponents/dialog/dialogBox';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import Eth from '../../../../../../designSystem/iconGroups/eth';

const receivedContent = () => {
  return (
    <Box
      display="flex"
      justifyContent={'center'}
      margin={'70px 70px 50px 70px'}
    >
      <Grid container width={'570px'} spacing={'20px'}>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                11/10/2022
              </Typography>
              <Typography variant="body2" color="textPrimary">
                16:01:23
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign={'right'}>
              <Typography variant="body2" color="textPrimary">
                Wallet
              </Typography>
              <Typography variant="body2" color="textSecondary">
                PRASHANT
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Action
              </Typography>
              <Typography variant="body1" sx={{ color: 'secondary.dark' }}>
                <Icon
                  size={16}
                  viewBox="0 0 30 30"
                  iconGroup={<CallReceived />}
                />
                RESEND
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign={'right'}>
              <Typography variant="body2" color="textSecondary">
                Status
              </Typography>
              <Typography variant="body2" sx={{ color: 'secondary.dark' }}>
                Success
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Amount
              </Typography>
              <Typography variant="body2" color="textPrimary">
                <Icon size={30} viewBox="0 0 30 30" iconGroup={<Eth />} />
                USDC 1.28258 ($ 1.28)
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign={'right'}>
              <Typography variant="body2" color="textSecondary">
                Fee
              </Typography>
              <Typography variant="body2" color="textPrimary">
                <Icon size={30} viewBox="0 0 30 30" iconGroup={<Eth />} />
                ETH 0.00163 ($ 2.09)
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Sender
              </Typography>
              <Typography variant="body2" color="textPrimary">
                1.0xf0e0987897sf6097sd23q3erer45334a USDC 0
              </Typography>
            </Grid>
            <Grid item xs={6} textAlign={'right'}>
              <Typography variant="body2" color="textSecondary">
                Receiver
              </Typography>
              <Typography variant="body2" sx={{ color: 'secondary.dark' }}>
                1.0xf0e0987897sf6097sd23q3erer45334a USDC 0
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2" color="textSecondary">
            Transaction Hash
            <Icon
              size={16}
              viewBox="0 0 30 30"
              iconGroup={<ContentCopy color="secondary" />}
            />
          </Typography>
          <Typography variant="body2" color="textPrimary">
            0x30a0db8796142rhj1260712g10912631fsd-01273
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Grid
            container
            justifyContent={'center'}
            alignContent={'center'}
            alignItems={'center'}
          >
            <Grid item>
              <Button>
                <Typography
                  variant="h6"
                  color="white"
                  sx={{ padding: '5px 30px' }}
                >
                  Exchange
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default function received() {
  const [isOpen, setIsOpen] = React.useState(true);

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <CustomDialog
      maxWidth={'lg'}
      open={isOpen}
      handleClose={onClose}
      isClosePresent={false}
      disableEscapeKeyDown
      restComponents={receivedContent()}
    />
  );
}
