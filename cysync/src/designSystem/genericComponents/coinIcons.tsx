import {
  BtcCoinMap,
  COINS,
  EthCoinMap,
  NearCoinMap,
  SolanaCoinMap
} from '@cypherock/communication';
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
import ftm from '../../assets/icons/fantom.svg';
import near from '../../assets/icons/near.svg';
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
    if (parentCoin && parentCoin !== coinInitial) {
      const coin = COINS[parentCoin];
      if (!coin) {
        throw new Error('Invalid parentCoin: ' + parentCoin);
      }

      const token = coin.tokenList[coinInitial];
      if (!token) {
        throw new Error('Invalid token: ' + coinInitial);
      }

      try {
        src = requestErc20ImageFile(token.abbr.toLowerCase());
      } catch (error) {
        src = generic;
      }
    } else {
      switch (coinInitial.toLowerCase()) {
        case BtcCoinMap.bitcoin:
          src = btc;
          break;
        case EthCoinMap.ethereum:
          src = eth;
          break;
        case BtcCoinMap.dogecoin:
          src = doge;
          break;
        case BtcCoinMap.dash:
          src = dash;
          break;
        case BtcCoinMap.litecoin:
          src = ltc;
          break;
        case NearCoinMap.near:
          src = near;
          break;
        case SolanaCoinMap.solana:
          src = solana;
          break;
        case EthCoinMap.polygon:
          src = matic;
          break;
        case EthCoinMap.binance:
          src = bsc;
          break;
        case EthCoinMap.harmony:
          src = harmony;
          break;
        case EthCoinMap['ethereum-c']:
          src = etc;
          break;
        // case EthCoinMap.optimism:
        // src = optimism;
        // break;
        case EthCoinMap.avalanche:
          src = avax;
          break;
        case EthCoinMap.fantom:
          src = ftm;
          break;
        // case EthCoinMap.arbitrum:
        // src = arbitrum;
        // break;
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
