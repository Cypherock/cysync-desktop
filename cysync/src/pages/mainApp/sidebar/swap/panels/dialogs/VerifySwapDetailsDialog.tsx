import { InfoOutlined, OpenInNew } from '@mui/icons-material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LoadingIcon from '@mui/icons-material/Loop';
import { Grid, Link, Typography } from '@mui/material';
import { Box, keyframes } from '@mui/system';
import React, { useEffect, useState } from 'react';

import CustomDialog from '../../../../../../designSystem/designComponents/dialog/dialogBox';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import CoinIcons from '../../../../../../designSystem/genericComponents/coinIcons';
import Changelly from '../../../../../../designSystem/iconGroups/changelly';

const rotateKeyframe = keyframes`
  0% {
    transform: rotateZ(0deg);
  }

  100% {
    transform: rotateZ(-360deg);
  }
`;

enum VerificationStatus {
  Pending,
  PinEntered,
  ReceivingAddressVerified,
  SendingAddressVerified
}

type VerifySwapDetailsDialogProps = {
  open: boolean;
  onClose: () => void;
  amountToSend: string;
  amountToReceive: string;
  networkFees: string;
  sourceCoinSlug: string;
  sourceCoinName: string;
  targetCoinSlug: string;
  targetCoinName: string;
  cardTapped: boolean;
  receiveAddressVerified: boolean;
};

const VerifySwapDetailsDialog: React.FC<VerifySwapDetailsDialogProps> = ({
  open,
  onClose,
  amountToSend,
  amountToReceive,
  networkFees,
  sourceCoinSlug,
  sourceCoinName,
  targetCoinSlug,
  targetCoinName,
  cardTapped,
  receiveAddressVerified
}) => {
  const [status, setStatus] = useState<VerificationStatus>(
    VerificationStatus.Pending
  );

  useEffect(() => {
    if (cardTapped) {
      setStatus(VerificationStatus.PinEntered);
    }
  }, [cardTapped]);

  useEffect(() => {
    if (receiveAddressVerified) {
      setStatus(VerificationStatus.ReceivingAddressVerified);
    }
  }, [receiveAddressVerified]);

  const getStatusIcon = (currentStage: VerificationStatus) => {
    return currentStage <= status ? (
      <CheckCircleOutlineIcon color="success" />
    ) : (
      <LoadingIcon
        sx={{
          animation: `${rotateKeyframe} 1500ms linear infinite`
        }}
      />
    );
  };

  const getVerifySwapDetailsDialogContent = () => {
    return (
      <Box
        display="flex"
        justifyContent={'center'}
        padding={'70px 70px 50px 70px'}
      >
        <Box width={'460px'}>
          <Box display="flex" sx={{ background: '#1C1F22', padding: '12px' }}>
            <Icon
              size={70}
              viewBox="0 0 30 30"
              iconGroup={<InfoOutlined />}
              color="textPrimary"
            />
            <Typography variant="body1">
              Verify the Swap details on your device before sending it. The
              addresses are exchanged securely so you don't have to verify them.
              <Link href="#" color="secondary" underline="hover" padding={1}>
                Learn more <OpenInNew fontSize="inherit" />
              </Link>
            </Typography>
          </Box>
          <Grid container xs={12}>
            <Grid
              item
              xs={12}
              display="flex"
              justifyContent={'space-between'}
              marginTop="20px"
            >
              <Typography variant="body1" color="textSecondary">
                Amount to send
              </Typography>
              <Typography variant="body1" color="textPrimary">
                {amountToSend} {sourceCoinSlug}
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              display="flex"
              justifyContent={'space-between'}
              marginTop="20px"
            >
              <Typography variant="body1" color="textSecondary">
                Amount to receive
              </Typography>
              <Typography variant="body1" color="textPrimary">
                {amountToReceive} {sourceCoinSlug}
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              display="flex"
              justifyContent={'space-between'}
              marginTop="20px"
            >
              <Typography variant="body1" color="textSecondary">
                Provider
              </Typography>
              <Typography
                variant="body1"
                color="textPrimary"
                display={'flex'}
                alignItems={'center'}
                gap={1}
              >
                <Changelly />
                Changelly
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              display="flex"
              justifyContent={'space-between'}
              marginTop="20px"
            >
              <Typography variant="body1" color="textSecondary">
                Network Fees
              </Typography>
              <Typography variant="body1" color="textPrimary">
                {networkFees} {sourceCoinSlug}
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              display="flex"
              justifyContent={'space-between'}
              marginTop="20px"
            >
              <Typography variant="body1" color="textSecondary">
                Source account
              </Typography>
              <Typography
                variant="body1"
                color="textPrimary"
                display={'flex'}
                alignItems={'center'}
                gap={1}
              >
                <CoinIcons initial={sourceCoinSlug} size="sm" />
                {sourceCoinName}
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              display="flex"
              justifyContent={'space-between'}
              marginTop="20px"
            >
              <Typography variant="body1" color="textSecondary">
                Target account
              </Typography>
              <Typography
                variant="body1"
                color="textPrimary"
                display={'flex'}
                alignItems={'center'}
                gap={1}
              >
                <CoinIcons initial={targetCoinSlug} size="sm" />
                {targetCoinName}
              </Typography>
            </Grid>
          </Grid>
          <Typography
            variant="body1"
            color="textPrimary"
            marginTop="20px"
            display={'flex'}
            alignItems={'center'}
            gap={1}
          >
            {getStatusIcon(VerificationStatus.PinEntered)}
            Pin entered and tapped a card
          </Typography>
          <Typography
            variant="body1"
            color="textPrimary"
            marginTop="20px"
            display={'flex'}
            alignItems={'center'}
            gap={1}
          >
            {getStatusIcon(VerificationStatus.ReceivingAddressVerified)}
            Receiving address checked
          </Typography>
          <Typography
            variant="body1"
            color="textPrimary"
            marginTop="20px"
            display={'flex'}
            alignItems={'center'}
            gap={1}
          >
            {getStatusIcon(VerificationStatus.SendingAddressVerified)}
            Checking sending address
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <CustomDialog
      open={open}
      handleClose={onClose}
      isClosePresent={true}
      disableEscapeKeyDown
      restComponents={getVerifySwapDetailsDialogContent()}
    />
  );
};

export default VerifySwapDetailsDialog;
