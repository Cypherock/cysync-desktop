import { COINS } from '@cypherock/communication';
import Avatar from '@mui/material/Avatar';
import { styled } from '@mui/material/styles';
import React from 'react';

import btc from '../../../node_modules/cryptocurrency-icons/svg/color/btc.svg';
import dash from '../../../node_modules/cryptocurrency-icons/svg/color/dash.svg';
import doge from '../../../node_modules/cryptocurrency-icons/svg/color/doge.svg';
import eth from '../../../node_modules/cryptocurrency-icons/svg/color/eth.svg';
import generic from '../../../node_modules/cryptocurrency-icons/svg/color/generic.svg';
import ltc from '../../../node_modules/cryptocurrency-icons/svg/color/ltc.svg';
import btct from '../../assets/icons/btct.svg';
import ethr from '../../assets/icons/ethr.svg';
import near from '../../assets/icons/near.svg';

const PREFIX = 'CoinIcons';

const classes = {
  root: `${PREFIX}-root`,
  img: `${PREFIX}-img`,
  root2: `${PREFIX}-root2`,
  img2: `${PREFIX}-img2`
};

// @ts-ignore
const requestErc20ImageFile = require.context(
  '../../assets/erc20',
  false,
  /.png$/
);

export const ModAvatar = styled(Avatar)(() => ({
  [`& .${classes.root}`]: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },

  [`& .${classes.img}`]: {
    width: '32px',
    height: '32px'
  },

  [`& .${classes.root2}`]: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },

  [`& .${classes.img2}`]: {
    width: '20px',
    height: '20px'
  }
}));

export const SmallModAvatar = styled(Avatar)(() => ({
  [`& .${classes.root2}`]: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },

  [`& .${classes.img2}`]: {
    width: '20px',
    height: '20px'
  }
}));

const StyledModAvatar = styled(ModAvatar)(() => ({
  [`& .${classes.root}`]: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },

  [`& .${classes.img}`]: {
    width: '32px',
    height: '32px'
  },

  [`& .${classes.root2}`]: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },

  [`& .${classes.img2}`]: {
    width: '20px',
    height: '20px'
  }
}));

type CoinIconsProps = {
  initial: string;
  parentCoin?: string;
  size?: 'sm' | 'lg';
  style?: React.CSSProperties;
};

const CoinIcons: React.FC<CoinIconsProps> = ({
  initial,
  size,
  style,
  parentCoin
}) => {
  let src;
  const handleGetIcon = (
    coinInitial: string,
    csize: 'sm' | 'lg' | null | undefined
  ) => {
    if (parentCoin) {
      const coin = COINS[parentCoin];
      if (!coin) {
        throw new Error('Invalid parentCoin: ' + parentCoin);
      }

      const token = coin.tokenList[coinInitial.toLowerCase()];
      if (!token) {
        throw new Error('Invalid token: ' + coinInitial);
      }

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
        case 'NEAR':
          src = near;
          break;
        default:
          src = generic;
      }
    }

    if (csize === 'sm') {
      return (
        <SmallModAvatar
          style={style}
          alt={coinInitial}
          src={src}
          classes={{
            root: classes.root2,
            img: classes.img2
          }}
        />
      );
    }
    return <StyledModAvatar style={style} alt={coinInitial} src={src} />;
  };

  return handleGetIcon(initial, size);
};

export default CoinIcons;
