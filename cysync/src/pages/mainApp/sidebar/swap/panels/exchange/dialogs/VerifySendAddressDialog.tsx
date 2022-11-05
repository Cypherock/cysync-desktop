import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Typography } from '@mui/material';
import { shell } from 'electron';
import React from 'react';

import Button from '../../../../../../../designSystem/designComponents/buttons/button';
import CustomDialog from '../../../../../../../designSystem/designComponents/dialog/dialogBox';

const getVerifySendAddressDialogContent = (
  url: string,
  onClose: () => void
): JSX.Element => {
  return (
    <Box
      display="flex"
      justifyContent={'center'}
      padding={'70px 70px 50px 70px'}
    >
      <Box
        width={'400px'}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <CheckCircleOutlinedIcon color="secondary" fontSize="large" />
        <Typography variant="h4" sx={{ color: 'secondary.dark' }}>
          Verify Send Address
        </Typography>
        <Typography variant="body2" color="textSecondary" marginTop={'10px'}>
          Visit the changelly website to verify the address you are sending to.
        </Typography>
        <Button
          onClick={() => {
            shell.openExternal(url);
            onClose();
          }}
          sx={{ marginTop: '20px' }}
        >
          <Typography
            variant="body1"
            color="textPrimary"
            sx={{ padding: '5px 10px' }}
          >
            Visit Website <OpenInNewIcon fontSize="inherit" />
          </Typography>
        </Button>
      </Box>
    </Box>
  );
};

type VerifySendAddressDialogProps = {
  open: boolean;
  onClose: () => void;
  url: string;
};

const VerifySendAddressDialog: React.FC<VerifySendAddressDialogProps> = ({
  open,
  onClose,
  url
}): JSX.Element => {
  return (
    <CustomDialog
      open={open}
      handleClose={onClose}
      isClosePresent={true}
      restComponents={getVerifySendAddressDialogContent(url, onClose)}
    />
  );
};

export default VerifySendAddressDialog;
