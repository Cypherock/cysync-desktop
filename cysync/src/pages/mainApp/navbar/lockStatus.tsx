import LockOpenIcon from '@mui/icons-material/LockOpen';
import React from 'react';

import CustomIconButton from '../../../designSystem/designComponents/buttons/customIconButton';
import { useLockscreen } from '../../../store/provider';

const LockStatus: React.FC = () => {
  const { isPasswordSet, handleLockScreenClickOpen } = useLockscreen();

  if (isPasswordSet) {
    return (
      <CustomIconButton onClick={handleLockScreenClickOpen} title="Lock App">
        <LockOpenIcon color="secondary" />
      </CustomIconButton>
    );
  }

  return null;
};

export default LockStatus;
