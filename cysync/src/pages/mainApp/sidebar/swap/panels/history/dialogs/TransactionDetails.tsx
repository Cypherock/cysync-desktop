// import { CallReceived, ContentCopy } from '@mui/icons-material';
import { Divider, Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import React from 'react';

import CustomDialog from '../../../../../../../designSystem/designComponents/dialog/dialogBox';

const transactionDetailsContent = () => {
  return (
    <Box
      display="flex"
      justifyContent={'center'}
      margin={'70px 70px 50px 70px'}
    >
      <Grid
        container
        width={'470px'}
        spacing={'20px'}
        display="flex"
        flexDirection="column"
      >
        <Typography variant="h5" sx={{ color: 'secondary.dark' }}>
          Transaction Details
        </Typography>
        <Divider
          variant="middle"
          style={{ margin: '20px 0px', background: 'secondary.dark' }}
        />
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Transaction ID
            </Typography>
            <Typography variant="h5" color="textPrimary">
              dym93xarif1oh5qw
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              You Sent
            </Typography>
            <Typography variant="h5" color="textPrimary">
              18 USDC
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Changelly address (USDC)
            </Typography>
            <Typography variant="h5" color="textPrimary">
              0xd46-087324h28323h2sacr4w5
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Recipient
            </Typography>
            <Typography variant="h5" color="textPrimary">
              0xfj3490had97634fd012-y31sfsd812
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider
              variant="middle"
              style={{ background: 'secondary.dark' }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Exchange Rate
            </Typography>
            <Typography variant="h5" color="textPrimary">
              1 USDC ~ 0.00076757 ETH
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default function transactionDetails() {
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
      restComponents={transactionDetailsContent()}
    />
  );
}
