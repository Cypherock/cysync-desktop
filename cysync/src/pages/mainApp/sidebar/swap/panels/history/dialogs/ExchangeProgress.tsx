import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LoadingIcon from '@mui/icons-material/Loop';
import { Grid, Link, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import withStyles from '@mui/styles/withStyles';
import { Box } from '@mui/system';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import CustomDialog from '../../../../../../../designSystem/designComponents/dialog/dialogBox';

const CustomLinearProgress = withStyles(() => ({
  root: {
    height: 8,
    borderRadius: 5
  }
}))(LinearProgress);

const steps = [
  {
    icon: <CheckCircleIcon fontSize="inherit" />,
    title: 'Confirmation in progress',
    component: (
      <>
        <Typography variant="body2" color="textSecondary">
          Once USDC is confirmed in the blockchain. we'll start exchanging it in
          ETH.
        </Typography>
        <Box display="flex" alignItems="center" padding={0}>
          <Typography variant="body2">
            <Link href="#" color="secondary" underline="hover" padding={1}>
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
      </>
    )
  },
  {
    icon: <LoadingIcon fontSize="inherit" />,
    title: 'Exchanging USDC to ETH',
    component: (
      <>
        <Typography variant="body2" color="textSecondary">
          The process will take a few minutes. Please wait.
        </Typography>
      </>
    )
  },
  {
    icon: <DownloadIcon fontSize="inherit" />,
    title: 'Sending funds to your wallet',
    component: (
      <>
        <Typography variant="body2" color="textSecondary">
          Once the transaction is completed, your ETH will be sent to your
          crypto wallet. Typically, it takes a few minutes for your funds to
          show up.
        </Typography>
      </>
    )
  }
];

const getExchangeProgressContent = (currrentStatus: number): JSX.Element => {
  const [progress, setProgress] = useState(0);
  const totalStatus = steps.length;

  useEffect(() => {
    setProgress(+((currrentStatus / totalStatus) * 100).toFixed(0));
  }, [currrentStatus]);

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
            value={+progress}
            style={{ width: '100%' }}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {steps.map((step, index) => (
              <Grid
                item
                xs={12}
                display="flex"
                gap={1}
                key={`exchangeProgess-${index}`}
              >
                <Typography
                  variant="h1"
                  color={
                    index <= currrentStatus ? 'textPrimary' : 'textSecondary'
                  }
                  display="flex"
                  alignItems="center"
                >
                  {index === currrentStatus ? (
                    <CircularProgress
                      color="success"
                      size={30}
                      sx={{ marginLeft: '6px', marginRight: '4px' }}
                    />
                  ) : (
                    { ...step.icon }
                  )}
                </Typography>
                <Box>
                  <Typography
                    variant="h6"
                    color={
                      index <= currrentStatus ? 'textPrimary' : 'textSecondary'
                    }
                  >
                    {step.title}
                  </Typography>
                  {step.component}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

type ExchangeProgressProps = {
  open: boolean;
  onClose: () => void;
  progress: number;
};

const ExchangeProgress: React.FC<ExchangeProgressProps> = ({
  open,
  onClose,
  progress
}) => {
  return (
    <CustomDialog
      maxWidth={'lg'}
      open={open}
      handleClose={onClose}
      isClosePresent={true}
      restComponents={getExchangeProgressContent(progress)}
    />
  );
};

ExchangeProgress.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  progress: PropTypes.number.isRequired
};

export default ExchangeProgress;
