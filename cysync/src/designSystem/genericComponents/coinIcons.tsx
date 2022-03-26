import { ERC20TOKENS } from '@cypherock/communication';
import { withStyles } from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar';
import React from 'react';

import btc from '../../../node_modules/cryptocurrency-icons/svg/color/btc.svg';
import dash from '../../../node_modules/cryptocurrency-icons/svg/color/dash.svg';
import doge from '../../../node_modules/cryptocurrency-icons/svg/color/doge.svg';
import eth from '../../../node_modules/cryptocurrency-icons/svg/color/eth.svg';
import generic from '../../../node_modules/cryptocurrency-icons/svg/color/generic.svg';
import ltc from '../../../node_modules/cryptocurrency-icons/svg/color/ltc.svg';
import btct from '../../assets/icons/btct.svg';
import ethr from '../../assets/icons/ethr.svg';

// @ts-ignore
const requestErc20ImageFile = require.context(
  '../../assets/erc20',
  false,
  /.png$/
);

export const ModAvatar = withStyles(() => ({
  root: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },
  img: {
    width: '32px',
    height: '32px'
  }
}))(Avatar);

export const SmallModAvatar = withStyles(() => ({
  root: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },
  img: {
    width: '20px',
    height: '20px'
  }
}))(Avatar);

type CoinIconsProps = {
  initial: string;
  size?: 'sm' | 'lg';
  style?: React.CSSProperties;
};

const CoinIcons: React.FC<CoinIconsProps> = ({ initial, size, style }) => {
  let src;
  const handleGetIcon = (
    coinInitial: string,
    csize: 'sm' | 'lg' | null | undefined
  ) => {
    if (ERC20TOKENS[coinInitial.toLowerCase()]) {
      try {
        const img = requestErc20ImageFile(
          `./${coinInitial.toLowerCase()}.png`
        ).default;
        src = img;
      } catch (error) {
        src = generic;
      }
    } else {
      switch (coinInitial.toUpperCase()) {
        case 'BTC':
          src = btc;
          break;
        case 'BTCT':
          src = btct;
          break;
        case 'ETH':
          src = eth;
          break;
        case 'ETHR':
          src = ethr;
          break;
        case 'DOGE':
          src = doge;
          break;
        case 'DASH':
          src = dash;
          break;
        case 'LTC':
          src = ltc;
          break;
        default:
          src = generic;
      }
    }

    if (csize === 'sm') {
      return <SmallModAvatar style={style} alt={coinInitial} src={src} />;
    }
    return <ModAvatar style={style} alt={coinInitial} src={src} />;
  };

  return handleGetIcon(initial, size);
};

export default CoinIcons;
