import { CoinGroup, COINS } from '@cypherock/communication';
import { Autocomplete, Box, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import CustomButton from '../../../../designSystem/designComponents/buttons/button';
import CoinIcon from '../../../../designSystem/genericComponents/coinIcons';
import { Account, accountDb, Wallet } from '../../../../store/database';
import { useWalletConnect, useWallets } from '../../../../store/provider';
import formatDisplayAmount from '../../../../utils/formatDisplayAmount';
import logger from '../../../../utils/logger';

import ClientMeta from './clientMeta';

const DefaultTextField = styled(TextField)(({ theme }) => ({
  '& label.Mui-focused': {
    color: theme.palette.text.primary
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: theme.palette.text.primary
  },
  '& .MuiOutlinedInput-root': {
    background: '#151921',
    '& fieldset': {
      borderColor: theme.palette.text.secondary
    },
    '&:hover fieldset': {
      borderColor: theme.palette.text.primary
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.text.primary
    }
  }
}));

const PREFIX = 'WalletConnect-AccountSelection';

const classes = {
  container: `${PREFIX}-container`,
  errorButtons: `${PREFIX}-errorButtons`,
  padBottom: `${PREFIX}-padBottom`
};

const Root = styled(Grid)(() => ({
  padding: '20px',
  [`& .${classes.container}`]: {
    width: '100%',
    maxWidth: '515px',
    margin: 'auto'
  },
  [`& .${classes.errorButtons}`]: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%'
  },
  [`& .${classes.padBottom}`]: {
    marginBottom: 5
  }
}));

type Props = {
  handleClose: () => void;
};

interface ICoin extends Account {
  name: string;
  value: string;
}

const WalletConnectAccountSelection: React.FC<Props> = () => {
  const theme = useTheme();
  const walletConnect = useWalletConnect();
  const { allWallets: walletData } = useWallets();

  const [selectedWallet, setSelectedWallet] = useState<Wallet>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account>(null);
  const [coinData, setCoinData] = useState<ICoin[]>([]);
  const [error, setError] = useState('');

  const onPositiveClick = () => {
    setError('');
    walletConnect.selectAccount(selectedWallet, selectedAccount);
  };

  const handleChange = (type: 'wallet' | 'account', value: any) => {
    if (type === 'wallet') {
      setSelectedWallet(value);
    } else {
      setSelectedAccount(value);
    }
  };

  const onWalletChange = async () => {
    try {
      setSelectedAccount(null);
      if (selectedWallet) {
        const coins = await accountDb.getAll({ walletId: selectedWallet._id });
        setCoinData(
          coins
            .filter(e => COINS[e.coinId].group === CoinGroup.Ethereum)
            .map(e => {
              const coin = COINS[e.coinId];

              return {
                ...e,
                name: coin.name,
                value: formatDisplayAmount(
                  new BigNumber(e.totalBalance)
                    .dividedBy(coin.multiplier)
                    .toString(),
                  5,
                  true
                ),
                abbr: coin.abbr
              };
            })
        );
      } else {
        setCoinData([]);
      }
    } catch (error) {
      logger.error('WalletConnect: Error in getting coins data');
      logger.error(error);
    }
  };

  useEffect(() => {
    onWalletChange();
  }, [selectedWallet]);

  return (
    <Root container>
      <div className={classes.container}>
        <ClientMeta />
        <Typography color="textPrimary" variant="body2" gutterBottom>
          Chose your wallet
        </Typography>
        <Autocomplete
          id="wallet-connect-wallet"
          fullWidth
          options={walletData}
          autoHighlight
          getOptionLabel={option => option.name}
          sx={{ mb: 4 }}
          renderInput={params => (
            <DefaultTextField
              {...params}
              label="Select a Wallet"
              inputProps={{
                ...params.inputProps,
                autoComplete: 'wallet-connect-wallet' // disable autocomplete and autofill
              }}
            />
          )}
          onChange={(_e: any, val) => handleChange('wallet', val)}
          value={selectedWallet}
        />

        <Typography color="textPrimary" variant="body2" gutterBottom>
          Chose account
        </Typography>
        <Autocomplete
          id="wallet-connect-account"
          disabled={!selectedWallet}
          fullWidth
          options={coinData}
          autoHighlight
          getOptionLabel={option => (option as any).name}
          renderOption={(props, option) => {
            return (
              <Box component="span" {...props}>
                <CoinIcon
                  initial={(option as any).coinId}
                  style={{ marginRight: '10px' }}
                />
                {(option as any).name} ({(option as any).value}{' '}
                {(option as any).abbr.toUpperCase()})
              </Box>
            );
          }}
          renderInput={params => (
            <DefaultTextField
              {...params}
              label="Choose an account"
              inputProps={{
                ...params.inputProps,
                autoComplete: 'wallet-connect-account' // disable autocomplete and autofill
              }}
            />
          )}
          onChange={(_e: any, val) => handleChange('account', val)}
          value={selectedAccount}
        />
        {error ||
          (walletConnect.connectionError && (
            <Typography
              variant="caption"
              style={{ color: theme.palette.error.main }}
            >
              {error || walletConnect.connectionError}
            </Typography>
          ))}
        <div className={classes.errorButtons}>
          <CustomButton
            onClick={walletConnect.handleClose}
            style={{
              padding: '0.5rem 3rem',
              margin: '1rem 0rem'
            }}
          >
            Reject
          </CustomButton>
          <CustomButton
            onClick={onPositiveClick}
            style={{
              padding: '0.5rem 3rem',
              margin: '1rem 0rem'
            }}
            disabled={!selectedAccount}
          >
            Continue
          </CustomButton>
        </div>
      </div>
    </Root>
  );
};

WalletConnectAccountSelection.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default WalletConnectAccountSelection;
