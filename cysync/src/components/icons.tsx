import React from 'react';

import Icon from '../designSystem/designComponents/icons/Icon';
import BNB from '../designSystem/iconGroups/bnb';
import BTC from '../designSystem/iconGroups/btc';
import DashCoin from '../designSystem/iconGroups/dashcoin';
import DogeCoin from '../designSystem/iconGroups/dogecoin';
import ETH from '../designSystem/iconGroups/eth';
import LiteCoin from '../designSystem/iconGroups/liteCoin';

const getIcon = (initial: string) => {
  switch (initial) {
    case 'BTC':
      return <Icon size={40} viewBox="0 0 30 30" iconGroup={<BTC />} />;
    case 'BTCT':
      return <Icon size={40} viewBox="0 0 30 30" iconGroup={<BTC />} />;
    case 'ETH':
    case 'ETHR':
      return <Icon size={40} viewBox="0 0 30 30" iconGroup={<ETH />} />;
    case 'BNB':
      return <Icon size={40} viewBox="0 0 30 30" iconGroup={<BNB />} />;
    case 'DOGE':
      return (
        <Icon size={40} viewBox="0 0 2000 2000" iconGroup={<DogeCoin />} />
      );
    case 'DASH':
      return (
        <Icon size={40} viewBox="0 0 2000 2000" iconGroup={<DashCoin />} />
      );
    case 'LTC':
      return (
        <Icon
          size={40}
          viewBox="0.847 0.876 329.254 329.256"
          iconGroup={<LiteCoin />}
        />
      );

    default:
      return <p>.</p>;
  }
};

export default getIcon;
