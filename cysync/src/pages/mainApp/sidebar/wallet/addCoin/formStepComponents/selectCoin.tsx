import FormControlLabel from '@mui/material/FormControlLabel';
import { styled, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import withStyles from '@mui/styles/withStyles';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import CustomCheckBox from '../../../../../../designSystem/designComponents/input/checkbox';
import CoinIcons from '../../../../../../designSystem/genericComponents/coinIcons';
import {
  useAddCoinContext,
  useConnection,
  useSelectedWallet
} from '../../../../../../store/provider';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const FormLabel = withStyles((theme: Theme) => ({
  root: {
    color: theme.palette.text.secondary
  },
  disabled: {
    color: `${theme.palette.text.secondary} !important`,
    opacity: 0.8
  }
}))(FormControlLabel);

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
    alignItems: 'center'
  },
  [`& .${classes.coinContainer}`]: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column'
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
  coins,
  setCoins,
  coinsPresent,
  isXpubMissing,
  handleNext
}) => {
  const [allCoinSelected, setAllCoinSelected] = React.useState(false);

  const { selectedWallet } = useSelectedWallet();

  const {
    deviceConnection: connection,
    deviceSdkVersion,
    beforeFlowStart,
    setIsInFlow
  } = useConnection();

  const { coinAdder } = useAddCoinContext();

  const [allCoinsPresent, setAllCoinsPresent] = useState(false);

  const [continueDisabled, setContinueDisabled] = useState(true);

  useEffect(() => {
    if (coinsPresent.length === Object.keys(coins).length) {
      setAllCoinsPresent(true);
      setContinueDisabled(true);
    }
  }, []);

  useEffect(() => {
    if (isXpubMissing) {
      const coinsToAdd = coins
        .filter(coin => coinsPresent.includes(coin[0]))
        .map(coin => {
          const newCoin = [...coin];
          newCoin[2] = true;
          return newCoin;
        });

      coinAdder.handleCoinAdd({
        connection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        walletId: selectedWallet._id,
        coinsFromGUI: coinsToAdd as any,
        pinExists: selectedWallet.passwordSet,
        passphraseExists: selectedWallet.passphraseSet,
        isXpubMissing
      });
      handleNext();
    }
  }, [isXpubMissing]);

  const handleAllCoinSelectedChange = () => {
    if (!allCoinSelected) {
      const newState = coins;
      for (const coin of newState) {
        coin[2] = !coinsPresent.includes(coin[0]);
      }
      setCoins([...newState]);
      setContinueDisabled(false);
    } else {
      const newState = coins;
      for (const coin of newState) {
        coin[2] = false;
      }
      setCoins([...newState]);
      setContinueDisabled(true);
    }
    setAllCoinSelected(!allCoinSelected);
  };

  const handleCoinChange = (e: any) => {
    const newState = coins;
    for (let index = 0; index < newState.length; index += 1) {
      const coin = newState[index];
      const prevState = coin[2];
      if (index === +e.target.name) {
        coin[2] = !prevState;
      }
    }
    let allSelectedFlag = true;
    let noCoinSelected = true;
    newState.forEach(coin => {
      if (!coin[2]) {
        if (!coinsPresent.includes(coin[0])) allSelectedFlag = false;
      } else noCoinSelected = false;
    });
    setAllCoinSelected(allSelectedFlag);
    setContinueDisabled(noCoinSelected);
    setCoins([...newState]);
  };

  const onContinue = () => {
    if (!beforeFlowStart()) {
      return;
    }

    coinAdder.handleCoinAdd({
      connection,
      sdkVersion: deviceSdkVersion,
      setIsInFlow,
      walletId: selectedWallet._id,
      coinsFromGUI: coins as any,
      pinExists: selectedWallet.passwordSet,
      passphraseExists: selectedWallet.passphraseSet
    });
    handleNext();
  };

  return (
    <Root className={classes.root}>
      <div className={classes.head}>
        <Typography className={classes.heading}>Select coins</Typography>
        <FormLabel
          style={{ margin: 0 }}
          control={
            <CustomCheckBox
              checked={allCoinSelected || allCoinsPresent}
              onChange={handleAllCoinSelectedChange}
              disabled={allCoinsPresent}
            />
          }
          label="Select all coins"
          labelPlacement="start"
        />
      </div>
      <div className={classes.coinContainer}>
        {coins.map((coin, index) => {
          const name = coin[1];
          const state = !!coin[2];
          return (
            <div
              key={name}
              className={clsx(
                classes.coinItem,
                coinsPresent.includes(coin[0]) || state
                  ? classes.selectedItem
                  : ''
              )}
            >
              <div className={classes.flexRow}>
                <CoinIcons
                  initial={coin[0].toUpperCase()}
                  style={{ marginRight: '10px' }}
                />
                <Typography color="textPrimary">{name}</Typography>
              </div>
              <CustomCheckBox
                disabled={coinsPresent.includes(coin[0])}
                name={index.toString()}
                checked={coinsPresent.includes(coin[0]) || state}
                onChange={handleCoinChange}
              />
            </div>
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
