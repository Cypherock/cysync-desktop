import SecurityTwoToneIcon from '@mui/icons-material/SecurityTwoTone';
import { Grid, Link, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { shell } from 'electron';
import React from 'react';

import CustomDialog from '../../../../../../../designSystem/designComponents/dialog/dialogBox';
import Icon from '../../../../../../../designSystem/designComponents/icons/Icon';
import CheckmarkSuccess from '../../../../../../../designSystem/iconGroups/checkmarkSuccess';

const CHANGELLY_TRACKING_URL = 'https://changelly.com/track/';

type SwapCompletedDialogProps = {
  open: boolean;
  onClose: () => void;
  toTokenName: string;
  transactionId: string;
};

const getSwapCompletedDialogContent = (
  toTokenName: string,
  transactionId: string
) => {
  const openChangellyTracking = (event: React.SyntheticEvent) => {
    event.preventDefault();
    shell.openExternal(`${CHANGELLY_TRACKING_URL}/${transactionId}`);
  };

  return (
    <Box
      display="flex"
      justifyContent={'center'}
      padding={'70px 70px 50px 70px'}
    >
      <Box width={'460px'}>
        <Box
          display="flex"
          flexDirection="column"
          alignContent="center"
          alignItems="center"
          sx={{ background: '#1C1F22', padding: '12px' }}
        >
          <Icon
            size={50}
            viewBox="0 0 30 30"
            iconGroup={<CheckmarkSuccess />}
          />
          <Typography variant="h4" sx={{ color: 'secondary.dark' }}>
            Pending Operation
          </Typography>
          <Typography variant="body2" color="textSecondary" marginTop={'10px'}>
            Your Swap operation has been sent to the network for confirmation.
            It may take up to an hour before you receive your {toTokenName}.
          </Typography>
        </Box>
        <Grid container marginTop="50px">
          <Grid
            item
            xs={8}
            display="flex"
            alignItems="center"
            alignContent="center"
            justifyContent={'space-between'}
          >
            <Icon
              size={80}
              viewBox="0 0 30 30"
              iconGroup={<SecurityTwoToneIcon />}
            />
            <Typography variant="body2" color="textPrimary">
              Take note of your Swap ID number in case you'd need assistance
              from
              <Link
                href="#"
                onClick={openChangellyTracking}
                color="secondary"
                underline="hover"
                padding={1}
              >
                Track your transaction.
              </Link>
            </Typography>
          </Grid>
          <Grid item xs={4} display="flex" justifyContent={'flex-end'}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="body1"
                color="textPrimary"
                sx={{
                  background: '#2D3236',
                  borderRadius: '27px',
                  padding: '4px 8px'
                }}
              >
                {transactionId}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

const SwapCompletedDialog: React.FC<SwapCompletedDialogProps> = ({
  open,
  onClose,
  toTokenName,
  transactionId
}) => {
  return (
    <CustomDialog
      open={open}
      handleClose={onClose}
      isClosePresent={true}
      disableEscapeKeyDown
      restComponents={getSwapCompletedDialogContent(toTokenName, transactionId)}
    />
  );
};

export default SwapCompletedDialog;
