import { Tooltip } from '@mui/material';
import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import React, { useState } from 'react';

import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import CustomCheckBox from '../../../../../../designSystem/designComponents/input/checkbox';
import CoinIcons from '../../../../../../designSystem/genericComponents/coinIcons';
import {
  useAddCoinContext,
  useConnection,
  useSelectedWallet
} from '../../../../../../store/provider';
import { checkCoinSupport } from '../../../../../../utils/coinCheck';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'AddCoinSelect';

const classes = {
  root: `${PREFIX}-root`,
  head: `${PREFIX}-head`,
  coinContainer: `${PREFIX}-coinContainer`,
  coinItem: `${PREFIX}-coinItem`,
  heading: `${PREFIX}-heading`,
  button: `${PREFIX}-button`,
  flexRow: `${PREFIX}-flexRow`,
  selectedItem: `${PREFIX}-selectedItem`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 4rem',
    paddingBottom: '5rem'
  },
  [`& .${classes.head}`]: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: '9px'
  },
  [`& .${classes.coinContainer}`]: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    maxHeight: '450px',
    overflowY: 'auto'
  },
  [`& .${classes.coinItem}`]: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    margin: '0.3rem 0rem',
    padding: '0.2rem 0rem',
    borderRadius: '5px'
  },
  [`& .${classes.heading}`]: {
    color: 'grey',
    marginLeft: '0.5rem'
  },
  [`& .${classes.button}`]: {
    background: '#71624C',
    color: theme.palette.text.primary,
    textTransform: 'none',
    padding: '0.5rem 1.5rem',
    '&:hover': {
      background: theme.palette.secondary.dark
    }
  },
  [`& .${classes.flexRow}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  [`& .${classes.selectedItem}`]: {
    background: 'rgba(255,255,255,0.05)'
  }
}));

const SelectCoin: React.FC<StepComponentProps> = ({
  selectedCoin: coins,
  setSelectedCoin: setCoins,
  coinsPresent,
  handleNext
}) => {
  const { selectedWallet } = useSelectedWallet();

  const {
    deviceConnection: connection,
    deviceSdkVersion,
    beforeFlowStart,
    setIsInFlow,
    supportedCoinList
  } = useConnection();

  const { coinAdder } = useAddCoinContext();

  const [continueDisabled, setContinueDisabled] = useState(true);

  const handleCoinChange = (e: any) => {
    const newState = coins;
    for (let index = 0; index < newState.length; index += 1) {
      const coin = newState[index];
      if (index === +e.target.name) {
        coin.isSelected = !coin.isSelected;
      } else {
        coin.isSelected = false;
      }
    }
    setCoins([...newState]);
    setContinueDisabled(!newState.reduce((a, el) => a || el.isSelected, false));
  };

  const onContinue = () => {
    if (!beforeFlowStart()) {
      return;
    }

    const coin = coins.find(e => e.isSelected);
    coinAdder.handleCoinAdd({
      connection,
      sdkVersion: deviceSdkVersion,
      setIsInFlow,
      walletId: selectedWallet._id,
      selectedCoin: {
        id: coin.id,
        accountIndex:
          (coinsPresent.find(el => {
            if (el.accountType) {
              return (
                coin.id === el.id && coin.accountType.id === el.accountType
              );
            }

            return coin.id === el.id;
          })?.accountIndex || -1) + 1,
        accountType: coin.accountType.id
      },
      pinExists: selectedWallet.passwordSet,
      passphraseExists: selectedWallet.passphraseSet
    });
    handleNext();
  };

  return (
    <Root className={classes.root}>
      <div className={classes.head}>
        <Typography className={classes.heading}>Select coin</Typography>
      </div>
      <div className={classes.coinContainer}>
        {coins.map((coin, index) => {
          const name = coin.name;
          const state = !!coin.isSelected;
          const coinSupported = checkCoinSupport(supportedCoinList, {
            id: coin.coinListId,
            versions: coin.supportedVersions
          });

          return (
            <Tooltip
              title={
                !coinSupported ? 'Update device firmware to use this coin' : ''
              }
              key={name}
            >
              <div
                key={name}
                className={clsx(
                  classes.coinItem,
                  state || !coinSupported ? classes.selectedItem : ''
                )}
              >
                <div className={classes.flexRow}>
                  <CoinIcons
                    initial={coin.id}
                    style={{ marginRight: '10px' }}
                  />
                  <Typography color="textPrimary">{name}</Typography>
                  {coin.accountType && (
                    <Chip color="primary" label={coin.accountType.tag} />
                  )}
                </div>
                <CustomCheckBox
                  disabled={!coinSupported}
                  name={index.toString()}
                  checked={state}
                  onChange={handleCoinChange}
                />
              </div>
            </Tooltip>
          );
        })}
      </div>
      <CustomButton
        disabled={continueDisabled}
        onClick={onContinue}
        style={{
          padding: '0.3rem 2rem',
          marginTop: '1rem',
          position: 'absolute',
          bottom: '2rem',
          right: '4.3rem'
        }}
      >
        Continue
      </CustomButton>
    </Root>
  );
};

SelectCoin.propTypes = StepComponentPropTypes;

export default SelectCoin;
