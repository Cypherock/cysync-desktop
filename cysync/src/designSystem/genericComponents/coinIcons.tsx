import { COINS } from '@cypherock/communication';
import Avatar from '@mui/material/Avatar';
import { styled } from '@mui/material/styles';
import React from 'react';

import avax from '../../../node_modules/cryptocurrency-icons/svg/color/avax.svg';
import bsc from '../../../node_modules/cryptocurrency-icons/svg/color/bnb.svg';
import btc from '../../../node_modules/cryptocurrency-icons/svg/color/btc.svg';
import dash from '../../../node_modules/cryptocurrency-icons/svg/color/dash.svg';
import doge from '../../../node_modules/cryptocurrency-icons/svg/color/doge.svg';
import etc from '../../../node_modules/cryptocurrency-icons/svg/color/etc.svg';
import eth from '../../../node_modules/cryptocurrency-icons/svg/color/eth.svg';
import generic from '../../../node_modules/cryptocurrency-icons/svg/color/generic.svg';
import ltc from '../../../node_modules/cryptocurrency-icons/svg/color/ltc.svg';
import matic from '../../../node_modules/cryptocurrency-icons/svg/color/matic.svg';
import harmony from '../../../node_modules/cryptocurrency-icons/svg/color/one.svg';
import arbitrum from '../../assets/icons/arbitrum.svg';
import btct from '../../assets/icons/btct.svg';
import ethr from '../../assets/icons/ethr.svg';
import ftm from '../../assets/icons/fantom.svg';
import near from '../../assets/icons/near.svg';
import optimism from '../../assets/icons/optimism.svg';
import solana from '../../assets/icons/solana.png';

const PREFIX = 'CoinIcons';

const classes = {
  root: `${PREFIX}-root`,
  img: `${PREFIX}-img`,
  root2: `${PREFIX}-root2`,
  img2: `${PREFIX}-img2`
};

const requestErc20ImageFile = (name: string) => {
  return `https://static.cypherock.com/images/erc20/${name}.png`;
};

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
  height: '20px',
  width: '20px',
  margin: '10px',
  fontSize: '1rem',

  [`& .${classes.root2}`]: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },

  [`& .${classes.img2}`]: {
    width: '100%',
    height: '100%'
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
    if (parentCoin && parentCoin.toLowerCase() !== coinInitial.toLowerCase()) {
      const coin = COINS[parentCoin];
      if (!coin) {
        throw new Error('Invalid parentCoin: ' + parentCoin);
      }

      const token = coin.tokenList[coinInitial.toLowerCase()];
      if (!token) {
        throw new Error('Invalid token: ' + coinInitial);
      }

      try {
        src = requestErc20ImageFile(coinInitial.toLowerCase());
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
        case 'SOL':
          src = solana;
          break;
        case 'MATIC':
          src = matic;
          break;
        case 'BNB':
          src = bsc;
          break;
        case 'ONE':
          src = harmony;
          break;
        case 'ETC':
          src = etc;
          break;
        case 'OP':
          src = optimism;
          break;
        case 'AVAX':
          src = avax;
          break;
        case 'FTM':
          src = ftm;
          break;
        case 'ARB':
          src = arbitrum;
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
            root: classes.root2
          }}
        >
          {coinInitial.toUpperCase().slice(0, 1)}
        </SmallModAvatar>
      );
    }

    return <StyledModAvatar style={style} alt={coinInitial} src={src} />;
  };

  return handleGetIcon(initial, size);
};

export default CoinIcons;
