import { InfoOutlined, OpenInNew } from '@mui/icons-material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LoadingIcon from '@mui/icons-material/Loop';
import { Grid, Link, Typography } from '@mui/material';
import { Box, keyframes } from '@mui/system';
import PropTypes from 'prop-types';
import React from 'react';

import CustomDialog from '../../../../../../../designSystem/designComponents/dialog/dialogBox';
import Icon from '../../../../../../../designSystem/designComponents/icons/Icon';
import CoinIcons from '../../../../../../../designSystem/genericComponents/coinIcons';
import Changelly from '../../../../../../../designSystem/iconGroups/changelly';
import {
  ReceiveFlowSteps,
  SendFlowSteps
} from '../../../../../../../store/hooks/helper/FlowSteps';

const rotateKeyframe = keyframes`
  0% {
    transform: rotateZ(0deg);
  }

  100% {
    transform: rotateZ(-360deg);
  }
`;

const receiveFlowStepsMessages: {
  [key in ReceiveFlowSteps]: string;
} = {
  [ReceiveFlowSteps.EnterPin]: 'Pin entered',
  [ReceiveFlowSteps.TapCard]: 'Card tapped',
  [ReceiveFlowSteps.VerifyReceiveAddress]: 'Receive address verified',
  [ReceiveFlowSteps.Completed]: 'Receive flow completed'
};

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
  receiveAddress: string;
  receiveFlowStep: ReceiveFlowSteps;
  sendFlowStep: SendFlowSteps;
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
  receiveAddress,
  receiveFlowStep,
  sendFlowStep
}) => {
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
          <Grid container>
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
                {amountToReceive} {targetCoinSlug}
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
                <CoinIcons initial={sourceCoinName} size="sm" />
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
                <CoinIcons initial={targetCoinName} size="sm" />
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

VerifySwapDetailsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  amountToSend: PropTypes.string.isRequired,
  amountToReceive: PropTypes.string.isRequired,
  networkFees: PropTypes.string.isRequired,
  sourceCoinSlug: PropTypes.string.isRequired,
  sourceCoinName: PropTypes.string.isRequired,
  targetCoinSlug: PropTypes.string.isRequired,
  targetCoinName: PropTypes.string.isRequired,
  receiveAddress: PropTypes.string,
  receiveFlowStep: PropTypes.number.isRequired,
  sendFlowStep: PropTypes.number.isRequired
};

export default VerifySwapDetailsDialog;
