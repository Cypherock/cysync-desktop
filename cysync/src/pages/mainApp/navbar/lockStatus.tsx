import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import CustomIconButton from '../../../designSystem/designComponents/buttons/customIconButton';
import { useLockscreen } from '../../../store/provider';

const LockStatus: React.FC = () => {
  const theme = useTheme();
  const { isPasswordSet, handleLockScreenClickOpen } = useLockscreen();

  if (isPasswordSet) {
    return (
      <CustomIconButton onClick={handleLockScreenClickOpen} title="Lock App">
        <LockOpenIcon style={{ color: theme.palette.secondary.dark }} />
      </CustomIconButton>
    );
  }

  return null;
};

export default LockStatus;
