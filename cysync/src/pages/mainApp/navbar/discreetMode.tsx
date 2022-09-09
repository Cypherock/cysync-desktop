import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import React from 'react';

import CustomIconButton from '../../../designSystem/designComponents/buttons/customIconButton';
import { useDiscreetMode } from '../../../store/provider';

const LockStatus: React.FC = () => {
  const discreetMode = useDiscreetMode();

  return (
    <CustomIconButton
      onClick={discreetMode.toggle}
      title="Toggle discreet mode"
    >
      {discreetMode.enabled ? (
        <VisibilityOffIcon color="secondary" />
      ) : (
        <VisibilityIcon color="secondary" />
      )}
    </CustomIconButton>
  );
};

export default LockStatus;
