import PropTypes from 'prop-types';
import React from 'react';

import CardAuthentication from './stepperFormComponents/cardAuthentication';
import DeviceAuthentication from './stepperFormComponents/deviceAuth';
import UpgradingDevice from './stepperFormComponents/upgradingDevice';
import DeviceSetupFormFlow from './stepperFormFlow';

const deviceSetupData = [
  ['CyCard  Authentication', CardAuthentication],
  ['Device  Authentication', DeviceAuthentication],
  ['Upgrading Device', UpgradingDevice]
];

interface Props {
  handleClose: () => void;
}

const Index: React.FC<Props> = ({ handleClose }) => {
  return (
    <DeviceSetupFormFlow
      stepsData={deviceSetupData}
      handleClose={handleClose}
    />
  );
};

Index.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default Index;
