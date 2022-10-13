// import { CallReceived, ContentCopy } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LoadingIcon from '@mui/icons-material/Loop';
import { Grid, Link, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import withStyles from '@mui/styles/withStyles';
import { Box } from '@mui/system';
import React from 'react';

import CustomDialog from '../../../../../../designSystem/designComponents/dialog/dialogBox';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';

const CustomLinearProgress = withStyles(() => ({
  root: {
    height: 8,
    borderRadius: 5
  }
}))(LinearProgress);

const exchangeProgressContent = () => {
  return (
    <Box
      display="flex"
      justifyContent={'center'}
      margin={'70px 70px 50px 70px'}
    >
      <Grid container width={'570px'} spacing={'20px'}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ color: 'secondary.dark' }}>
            Exchange
          </Typography>
          <CustomLinearProgress
            variant="determinate"
            value={50}
            style={{ width: '100%' }}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} display="flex" gap={1}>
              <CircularProgress
                color="success"
                size={30}
                sx={{ marginLeft: '15px', marginRight: '15px' }}
              />
              <div>
                <Typography variant="h6" color="textPrimary">
                  Confirmation in progress
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Once USDC is confirmed in the blockchain. we'll start
                  exchanging it in ETH.
                </Typography>
                <Box display="flex" alignItems="center" padding={0}>
                  <Typography variant="body2">
                    <Link
                      href="#"
                      color="secondary"
                      underline="hover"
                      padding={1}
                    >
                      See input hash in explorer
                    </Link>
                  </Typography>
                  <HelpOutlineIcon
                    sx={{
                      color: 'textSecondary',
                      height: '18px',
                      width: '18px'
                    }}
                  />
                </Box>
              </div>
            </Grid>
            <Grid item xs={12} display="flex" gap={1}>
              <Icon
                iconGroup={<LoadingIcon />}
                size={40}
                viewBox="0 0 30 30"
                color="secondary"
              />
              <div>
                <Typography variant="h6" color="textPrimary">
                  Exchanging USDC to ETH
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  The process will take a few minutes. Please wait.
                </Typography>
              </div>
            </Grid>
            <Grid item xs={12} display="flex" gap={1}>
              <Icon
                iconGroup={<DownloadIcon />}
                size={70}
                viewBox="0 0 30 30"
                color="secondary"
              />
              <div>
                <Typography variant="h6" color="textPrimary">
                  Sending funds to your wallet
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Once the transaction is completed, your ETH will be sent to
                  your crypto wallet. Typically, it takes a few minutes for your
                  funds to show up.
                </Typography>
              </div>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default function exchangeProgress() {
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
      restComponents={exchangeProgressContent()}
    />
  );
}
