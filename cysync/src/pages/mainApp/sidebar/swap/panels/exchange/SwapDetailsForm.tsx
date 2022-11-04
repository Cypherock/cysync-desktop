import { COINS } from '@cypherock/communication';
import { SwapVerticalCircle } from '@mui/icons-material';
import {
  Box,
  Chip,
  //   Autocomplete,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography
  //   Box,
  //   TextField
} from '@mui/material';
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
  currentWalletId
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
              {coinData.map((coin, index) => {
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
          {/* <Autocomplete
            autoHighlight
            value={fromToken}
            onChange={(_event, newValue) => {
              setFromToken(newValue as DisplayCoin);
            }}
            options={coinData}
            getOptionLabel={(option: DisplayCoin) =>
              COINS[option.slug]?.name || ''
            }
            renderOption={(props, option) => {
              return (
                <Box component={'li'} {...props}>
                  <CoinIcons
                    initial={option.slug.toUpperCase()}
                    style={{ marginRight: '10px' }}
                  />
                  <ListItemText
                    primary={COINS[option.slug]?.name}
                    secondary={`${
                      option.displayBalance
                    } ${option.slug.toUpperCase()}`}
                  />
                </Box>
              );
            }}
            renderInput={params => (
              <TextField
                {...params}
                label=""
                inputProps={{
                  ...params.inputProps
                }}
              />
            )}
          /> */}
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
            placeholder="0.00000000"
            inputProps={{ 'aria-label': 'description' }}
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
          <Input fullWidth placeholder="0.00000000" className={classesForm} />
        </Grid>
      </Grid>
    </>
  );
};

export default SwapDetailsForm;
