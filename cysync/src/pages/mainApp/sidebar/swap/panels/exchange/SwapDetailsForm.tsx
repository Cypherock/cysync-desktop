import { COINS } from '@cypherock/communication';
import { SwapVerticalCircle } from '@mui/icons-material';
import {
  Box,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography
} from '@mui/material';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import SwitchButton from '../../../../../../designSystem/designComponents/buttons/switchButton';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import Input from '../../../../../../designSystem/designComponents/input/input';
import CoinIcons from '../../../../../../designSystem/genericComponents/coinIcons';
import { Wallet } from '../../../../../../store/database';
import { DisplayCoin } from '../../../../../../store/hooks';

const trimString = (str: string, length: number) => {
  if (str.length > length) {
    return str.substring(0, length - 3) + '...';
  }
  return str;
};

type SwapDetailsFormProps = {
  fromToken: DisplayCoin;
  setFromToken: React.Dispatch<React.SetStateAction<DisplayCoin>>;
  toToken: DisplayCoin;
  setToToken: React.Dispatch<React.SetStateAction<DisplayCoin>>;
  coinData: DisplayCoin[];
  amountToSend: string;
  handleChangeAmountToSend: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  setAmountToSend: React.Dispatch<React.SetStateAction<string>>;
  classesForm: string;
  allWallets: Wallet[];
  setCurrentWalletId: React.Dispatch<React.SetStateAction<string>>;
  currentWalletId: string;
  amountToReceive: string;
  price: number;
};

const SwapDetailsForm: React.FC<SwapDetailsFormProps> = ({
  fromToken,
  setFromToken,
  toToken,
  setToToken,
  coinData,
  amountToSend,
  setAmountToSend,
  handleChangeAmountToSend,
  classesForm,
  allWallets,
  setCurrentWalletId,
  currentWalletId,
  amountToReceive,
  price
}) => {
  const [isAmountToSendMax, setIsAmountToSendMax] = useState(false);
  const [fromTokenIndex, setFromTokenIndex] = useState('');
  const [toTokenIndex, setToTokenIndex] = useState('');

  const handleChangeFromToken = (event: SelectChangeEvent) => {
    setFromTokenIndex(event.target.value);
    setFromToken(coinData[+event.target.value]);
  };
  const handleChangeToToken = (event: SelectChangeEvent) => {
    setToTokenIndex(event.target.value);
    setToToken(coinData[+event.target.value]);
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box display="flex" gap={1}>
            <Typography variant="h6" color="textSecondary">
              From
            </Typography>
            {allWallets.map(wallet => (
              <Tooltip title={wallet.name} key={wallet._id}>
                <Chip
                  sx={{ fontSize: '10px', width: '50px' }}
                  size="small"
                  color="secondary"
                  variant={
                    currentWalletId === wallet._id ? 'filled' : 'outlined'
                  }
                  label={trimString(wallet.name, 6)}
                  onClick={() => {
                    setCurrentWalletId(wallet._id);
                  }}
                />
              </Tooltip>
            ))}
          </Box>
          <FormControl fullWidth className={classesForm}>
            <InputLabel id="select-source-helper-label" shrink={false}>
              {fromToken ? '' : 'Select Source'}
            </InputLabel>
            <Select
              value={fromTokenIndex}
              onChange={handleChangeFromToken}
              variant="outlined"
              labelId="select-source-helper-label"
            >
              {coinData
                .filter(coin => coin.totalBalance !== '0')
                .map((coin, index) => {
                  const coinSlugName = coin.slug.toUpperCase();
                  const coinName = COINS[coin.slug]?.name;
                  return (
                    <MenuItem value={index} key={`from-${coin.slug}`}>
                      <CoinIcons
                        initial={coinSlugName}
                        style={{ marginRight: '10px' }}
                      />
                      <ListItemText
                        primary={coinName}
                        secondary={`${coin.displayBalance} ${coinSlugName}`}
                      />
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <Grid container>
            <Grid
              container
              display={'flex'}
              justifyContent={'flex-end'}
              alignContent={'center'}
              alignItems={'center'}
              gap={2}
            >
              <Grid item>
                <Typography variant="h6" color="textSecondary">
                  Max
                </Typography>
              </Grid>
              <Grid item>
                <SwitchButton
                  completed={isAmountToSendMax}
                  disabled={fromTokenIndex === ''}
                  handleChange={() => {
                    setIsAmountToSendMax(currVal => !currVal);
                    setAmountToSend(fromToken?.displayBalance || '0');
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Input
            fullWidth
            type="number"
            placeholder="0"
            value={amountToSend}
            onChange={handleChangeAmountToSend}
            className={classesForm}
          />
        </Grid>
      </Grid>
      <Typography
        variant="h6"
        textAlign={'center'}
        color="textSecondary"
        gutterBottom
        sx={{ marginTop: '10px' }}
      >
        <Icon
          size={40}
          color="textSecondary"
          viewBox="0 0 40 40"
          iconGroup={<SwapVerticalCircle />}
        />
      </Typography>
      <Grid container spacing={2} sx={{ marginTop: '-45px' }}>
        <Grid item xs={6}>
          <Typography variant="h6" color="textSecondary">
            To
          </Typography>
          <FormControl fullWidth className={classesForm}>
            <InputLabel id="select-target-helper-label" shrink={false}>
              {toToken ? '' : 'Select Target'}
            </InputLabel>
            <Select
              value={toTokenIndex}
              onChange={handleChangeToToken}
              labelId="select-target-helper-label"
              variant="outlined"
            >
              {coinData.map((coin, index) => {
                const coinSlugName = coin.slug.toUpperCase();
                const coinName = COINS[coin.slug]?.name;
                return (
                  <MenuItem value={index} key={`to-${coin.slug}`}>
                    <CoinIcons
                      initial={coinSlugName}
                      style={{ marginRight: '10px' }}
                    />
                    <ListItemText primary={coinName} secondary={coinSlugName} />
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <Grid container>
            <Grid
              container
              display={'flex'}
              justifyContent={'flex-end'}
              alignContent={'center'}
              alignItems={'center'}
              gap={2}
            >
              <Grid item>
                <Typography variant="h6" color="textSecondary">
                  Max
                </Typography>
              </Grid>
              <Grid item>
                <SwitchButton
                  completed={false}
                  handleChange={() => {
                    //   empty
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Box
            border={'0.5px solid #CDCDCD'}
            borderRadius="5px"
            marginTop="10px"
            padding="5px 10px"
            textAlign="right"
          >
            <Typography variant="body1" color="textSecondary">
              {amountToReceive}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              $ {(+amountToReceive * price).toFixed(2)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

SwapDetailsForm.propTypes = {
  fromToken: PropTypes.any,
  setFromToken: PropTypes.func.isRequired,
  toToken: PropTypes.any,
  setToToken: PropTypes.func.isRequired,
  coinData: PropTypes.array.isRequired,
  amountToSend: PropTypes.string.isRequired,
  handleChangeAmountToSend: PropTypes.func.isRequired,
  setAmountToSend: PropTypes.func.isRequired,
  classesForm: PropTypes.string.isRequired,
  allWallets: PropTypes.array.isRequired,
  setCurrentWalletId: PropTypes.func.isRequired,
  currentWalletId: PropTypes.string,
  amountToReceive: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired
};

export default SwapDetailsForm;
