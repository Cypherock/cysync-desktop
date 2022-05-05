import PropTypes from 'prop-types';
import React from 'react';

import CardAuthentication from './stepperFormComponents/cardAuthentication';
import DeviceAuthentication from './stepperFormComponents/deviceAuth';
import UpgradingDevice from './stepperFormComponents/upgradingDevice';
import DeviceSetupFormFlow from './stepperFormFlow';

const deviceSetupData = [
  ['Device  Authentication', DeviceAuthentication],
  ['X1 Card  Authentication', CardAuthentication],
  ['Upgrading Device', UpgradingDevice]
];

interface Props {
  handleClose: () => void;
}

const MainAppInitialFlow: React.FC<Props> = ({ handleClose }) => {
  return (
    <DeviceSetupFormFlow
      stepsData={deviceSetupData}
      handleClose={handleClose}
    />
  );
};

MainAppInitialFlow.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default MainAppInitialFlow;
