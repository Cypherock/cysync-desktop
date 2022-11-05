import { InfoOutlined, OpenInNew } from '@mui/icons-material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LoadingIcon from '@mui/icons-material/Loop';
import { Grid, Link, Typography } from '@mui/material';
import { Box, keyframes } from '@mui/system';
import React, { useEffect, useState } from 'react';

import CustomDialog from '../../../../../../../designSystem/designComponents/dialog/dialogBox';
import Icon from '../../../../../../../designSystem/designComponents/icons/Icon';
import CoinIcons from '../../../../../../../designSystem/genericComponents/coinIcons';
import Changelly from '../../../../../../../designSystem/iconGroups/changelly';

const rotateKeyframe = keyframes`
  0% {
    transform: rotateZ(0deg);
  }

  100% {
    transform: rotateZ(-360deg);
  }
`;

enum ReceiveFlowSteps {
  EnterPinAndTapCard,
  VerifyReceiveAddress,
  Completed
}

const receiveFlowStepsMessages: {
  [key in ReceiveFlowSteps]: string;
} = {
  [ReceiveFlowSteps.EnterPinAndTapCard]: 'Pin entered and card tapped',
  [ReceiveFlowSteps.VerifyReceiveAddress]: 'Receive address verified',
  [ReceiveFlowSteps.Completed]: 'Receive flow completed'
};

enum SendFlowSteps {
  Waiting,
  VerifySendAddress,
  EnterPin,
  TapCard,
  SignTransaction,
  Completed
}

const sendFlowStepsMessages: {
  [key in SendFlowSteps]: string;
} = {
  [SendFlowSteps.Waiting]: 'Waiting for receive flow',
  [SendFlowSteps.VerifySendAddress]: 'Verify sending address',
  [SendFlowSteps.EnterPin]: 'Pin entered',
  [SendFlowSteps.TapCard]: 'Card tapped',
  [SendFlowSteps.SignTransaction]: 'Signing transaction',
  [SendFlowSteps.Completed]: 'Send flow completed'
};

function getFlowSteps<Type extends number>(
  currentStep: Type,
  lastStep: Type,
  messages: {
    [key in Type]: string;
  }
): JSX.Element {
  return (
    <Box>
      <Typography
        variant="body1"
        color="textPrimary"
        marginTop="20px"
        display={'flex'}
        alignItems={'center'}
        gap={1}
      >
        {currentStep === lastStep ? (
          <CheckCircleOutlineIcon color="success" />
        ) : (
          <LoadingIcon
            sx={{
              animation: `${rotateKeyframe} 1500ms linear infinite`
            }}
          />
        )}
        {messages[currentStep]}
      </Typography>
    </Box>
  );
}

// enum SendFlowSteps {}

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
  receiveFlowCardTapped: boolean;
  receiveAddressVerified: boolean;
  receiveAddress: string;
  sendAddressVerified: boolean;
  sendFlowPinEntered: boolean;
  sendFlowCardTapped: boolean;
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
  receiveFlowCardTapped,
  receiveAddressVerified,
  receiveAddress,
  sendAddressVerified,
  sendFlowPinEntered,
  sendFlowCardTapped
}) => {
  const [receiveFlowStep, setReceiveFlowStep] = useState<ReceiveFlowSteps>(
    ReceiveFlowSteps.EnterPinAndTapCard
  );

  const [sendFlowStep, setSendFlowStep] = useState<SendFlowSteps>(
    SendFlowSteps.Waiting
  );

  useEffect(() => {
    if (receiveFlowCardTapped) {
      setReceiveFlowStep(ReceiveFlowSteps.VerifyReceiveAddress);
    }
  }, [receiveFlowCardTapped]);

  useEffect(() => {
    if (receiveAddressVerified) {
      setReceiveFlowStep(ReceiveFlowSteps.Completed);
      setSendFlowStep(SendFlowSteps.VerifySendAddress);
    }
  }, [receiveAddressVerified]);

  useEffect(() => {
    if (sendAddressVerified) {
      setSendFlowStep(SendFlowSteps.EnterPin);
    }
  }, [sendAddressVerified]);

  useEffect(() => {
    if (sendFlowPinEntered) {
      setSendFlowStep(SendFlowSteps.TapCard);
    }
  }, [sendFlowPinEntered]);

  useEffect(() => {
    if (sendFlowCardTapped) {
      setSendFlowStep(SendFlowSteps.SignTransaction);
    }
  }, [sendFlowCardTapped]);

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
            {receiveAddress && (
              <Grid
                item
                xs={12}
                display="flex"
                justifyContent={'space-between'}
                marginTop="20px"
              >
                <Typography variant="body1" color="textSecondary">
                  Receiving address
                </Typography>
                <Typography
                  variant="body1"
                  color="textPrimary"
                  display={'flex'}
                  alignItems={'center'}
                  gap={1}
                >
                  {receiveAddress}
                </Typography>
              </Grid>
            )}
          </Grid>
          {getFlowSteps<ReceiveFlowSteps>(
            receiveFlowStep,
            ReceiveFlowSteps.Completed,
            receiveFlowStepsMessages
          )}
          {getFlowSteps<SendFlowSteps>(
            sendFlowStep,
            SendFlowSteps.Completed,
            sendFlowStepsMessages
          )}
        </Box>
      </Box>
    );
  };

  return (
    <>
      <CustomDialog
        open={open}
        handleClose={onClose}
        isClosePresent={true}
        disableEscapeKeyDown
        restComponents={getVerifySwapDetailsDialogContent()}
      />
    </>
  );
};

export default VerifySwapDetailsDialog;
