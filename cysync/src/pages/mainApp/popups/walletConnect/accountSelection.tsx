import { CoinGroup, COINS, EthList } from '@cypherock/communication';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Autocomplete, Box, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import BigNumber from 'bignumber.js';
import { cloneDeep, difference } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

import CustomButton from '../../../../designSystem/designComponents/buttons/button';
import CoinIcon from '../../../../designSystem/genericComponents/coinIcons';
import {
  Account,
  accountDb,
  Wallet,
  walletDb
} from '../../../../store/database';
import {
  ChainMappedAccount,
  useWalletConnect,
  useWallets
} from '../../../../store/provider';
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
  value: string;
  abbr: string;
}

const createAccountList = async (coinId: string) => {
  const wallets = await walletDb.getAll();

  return (await accountDb.getAll({ coinId })).map(e => {
    const coin = COINS[e.coinId];
    const walletName = wallets.find(w => w._id === e.walletId)?.name;
    return {
      ...e,
      value: formatDisplayAmount(
        new BigNumber(e.totalBalance).dividedBy(coin.multiplier).toString(),
        5,
        true
      ),
      abbr: coin.abbr,
      walletName
    };
  });
};

const AccountSelectionItem: React.FC<{
  onChange: (e: any, val: any) => void;
  chain: string;
  initialValue: ICoin | undefined;
}> = ({ onChange, chain, initialValue }) => {
  const [accountList, setAccountList] = useState<ICoin[]>([]);
  const [selectedAccountOption, setSelectedAccountOption] =
    useState<ICoin | null>(initialValue ?? null);
  const [chainName, setChainName] = useState('');
  const initializeData = async () => {
    const chainId = parseInt(chain.split(':')[1] ?? '0', 10);
    const ethCoin = EthList.find(c => c.chain === chainId);
    setChainName(ethCoin.name);
    const coinId = ethCoin.id;
    setAccountList(await createAccountList(coinId));
  };

  useEffect(() => {
    initializeData();
  }, []);

  return (
    <>
      <Typography color="textPrimary" variant="body2" gutterBottom>
        Choose your {chainName} account
      </Typography>
      <Autocomplete
        id={'wallet-connect-account' + chain}
        fullWidth
        options={accountList}
        autoHighlight
        getOptionLabel={(option: ICoin & { walletName?: string }) =>
          `${option.name} (${option.walletName})`
        }
        renderOption={(props, option: ICoin & { walletName?: string }) => {
          return (
            <Box
              component="span"
              {...props}
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              justifyItems={'center'}
              width={'full'}
            >
              <Box
                display={'flex'}
                flexGrow={1}
                width={'full'}
                alignItems={'center'}
                justifyItems={'center'}
              >
                <CoinIcon
                  initial={option.coinId}
                  style={{ marginRight: '10px' }}
                />
                {option.name} ({option.value} {option.abbr.toUpperCase()})
              </Box>
              <Box>{option.walletName}</Box>
            </Box>
          );
        }}
        renderInput={params => (
          <DefaultTextField
            {...params}
            hiddenLabel
            placeholder="Select an Account"
            inputProps={{
              ...params.inputProps,
              autoComplete: 'wallet-connect-account' // disable autocomplete and autofill
            }}
            style={{ marginBottom: '32px' }}
          />
        )}
        onChange={(e, val: any) => {
          onChange(e, val);
          setSelectedAccountOption(val);
        }}
        value={selectedAccountOption}
      />
    </>
  );
};

const WalletConnectAccountSelection: React.FC<Props> = () => {
  const theme = useTheme();
  const walletConnect = useWalletConnect();
  const { allWallets: walletData } = useWallets();

  const [selectedWallet, setSelectedWallet] = useState<Wallet>(
    walletConnect.selectedWallet
  );
  const [selectedAccount, setSelectedAccount] = useState<Account>(null);
  const [buttonDisabled, setButtonDisabled] = useState(true);

  const [selectedAccountList, setSelectedAccountList] =
    useState<ChainMappedAccount>({});
  const requiredChains = walletConnect.requiredNamespaces ?? [];
  const optionalChains = walletConnect.optionalNamespaces ?? [];
  const wasOptionalFieldsVisible = useRef(false);
  const [coinData, setCoinData] = useState<ICoin[]>([]);
  const [error, setError] = useState('');

  const onPositiveClick = () => {
    setError('');
    if (walletConnect.currentVersion === 1)
      walletConnect.selectAccount(selectedWallet, selectedAccount);
    else if (walletConnect.currentVersion === 2)
      walletConnect.approveSessionRequest(selectedAccountList);
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

  const V1SelectionOptions: React.FC = () => (
    <>
      <Typography color="textPrimary" variant="body2" gutterBottom>
        Choose your wallet
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
            hiddenLabel
            placeholder="Select a Wallet"
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
        Choose your account
      </Typography>
      <Autocomplete
        id="wallet-connect-account"
        disabled={!selectedWallet}
        fullWidth
        options={coinData}
        autoHighlight
        getOptionLabel={(option: ICoin) => option.name}
        renderOption={(props, option: ICoin) => {
          return (
            <Box component="span" {...props}>
              <CoinIcon
                initial={option.coinId}
                style={{ marginRight: '10px' }}
              />
              {option.name} ({option.value} {option.abbr.toUpperCase()})
            </Box>
          );
        }}
        renderInput={params => (
          <DefaultTextField
            {...params}
            hiddenLabel
            placeholder="Select an Account"
            inputProps={{
              ...params.inputProps,
              autoComplete: 'wallet-connect-account' // disable autocomplete and autofill
            }}
          />
        )}
        onChange={(_e: any, val) => handleChange('account', val)}
        value={selectedAccount}
      />
    </>
  );

  const onAccountChange = (val: any, chain: string) => {
    const map = cloneDeep(selectedAccountList);
    map[chain] = {
      account: val,
      wallet: walletData.find(e => e._id === val?.walletId)
    };
    if (!val) delete map[chain];
    setSelectedAccountList(cloneDeep(map));
  };

  useEffect(() => {
    if (walletConnect.currentVersion === 2) {
      setButtonDisabled(
        difference(requiredChains, Object.keys(selectedAccountList)).length > 0
      );
    } else if (walletConnect.currentVersion === 1) {
      setButtonDisabled(!selectedAccount);
    }
  }, [selectedAccount, selectedAccountList]);

  const V2SelectionOptions: React.FC = () => {
    const [isOptionalFieldsVisible, setIsOptionalFelidsVisible] = useState(
      wasOptionalFieldsVisible.current
    );

    useEffect(() => {
      wasOptionalFieldsVisible.current = isOptionalFieldsVisible;
    }, [isOptionalFieldsVisible]);

    return (
      <>
        {requiredChains.map(chain => (
          <AccountSelectionItem
            key={chain}
            onChange={(_e: any, val: any) => onAccountChange(val, chain)}
            chain={chain}
            initialValue={selectedAccountList[chain]?.account as any}
          />
        ))}

        {optionalChains.length > 0 && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                marginBottom: '16px',
                cursor: 'pointer'
              }}
              onClick={() => setIsOptionalFelidsVisible(e => !e)}
            >
              <Typography>Optional Accounts</Typography>
              <ArrowDropDownIcon
                style={{
                  transform: isOptionalFieldsVisible
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)',
                  transition: 'transform 0.3s ease-in-out'
                }}
              />
            </div>

            <div
              style={{
                maxHeight: isOptionalFieldsVisible ? '100vh' : '0vh',
                transition: 'max-height 0.3s ease-in-out',
                overflow: 'hidden'
              }}
            >
              {optionalChains.map(chain => (
                <AccountSelectionItem
                  key={chain}
                  onChange={(_e: any, val: any) => onAccountChange(val, chain)}
                  chain={chain}
                  initialValue={selectedAccountList[chain]?.account as any}
                />
              ))}
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <Root container>
      <div className={classes.container}>
        <ClientMeta />
        {walletConnect.currentVersion === 1 && <V1SelectionOptions />}
        {walletConnect.currentVersion === 2 && <V2SelectionOptions />}
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
            disabled={buttonDisabled}
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
