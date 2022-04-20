import SearchIcon from '@mui/icons-material/Search';
import { styled, useTheme } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { AutoSizer, List } from 'react-virtualized';

import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import CustomCheckBox from '../../../../../designSystem/designComponents/input/checkbox';
import Input from '../../../../../designSystem/designComponents/input/input';
import CoinIcons from '../../../../../designSystem/genericComponents/coinIcons';
import { erc20tokenDb } from '../../../../../store/database';
import { useDebouncedFunction } from '../../../../../store/hooks';
import { useSelectedWallet, useSync } from '../../../../../store/provider';

import initialTokens from './tokens';

const PREFIX = 'AddTokenForm';

const classes = {
  root: `${PREFIX}-root`,
  head: `${PREFIX}-head`,
  coinContainer: `${PREFIX}-coinContainer`,
  coinItem: `${PREFIX}-coinItem`,
  heading: `${PREFIX}-heading`,
  button: `${PREFIX}-button`,
  flexRow: `${PREFIX}-flexRow`,
  selectedItem: `${PREFIX}-selectedItem`,
  loaderContainer: `${PREFIX}-loaderContainer`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem 4rem',
    paddingBottom: '5rem'
  },
  [`& .${classes.head}`]: {
    width: 'calc(100% - 10px)',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.coinContainer}`]: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    height: '500px'
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
  },
  [`& .${classes.loaderContainer}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '4rem',
    margin: '1rem 0rem 30rem 0rem'
  }
}));

const AddTokenForm = ({ tokenList, ethCoin, handleClose }: any) => {
  const theme = useTheme();

  // Using JSON.parse to create a deep copy instead of passing by referrence
  const [tokens, setTokens] = useState<any[]>(
    JSON.parse(JSON.stringify(initialTokens))
  );

  const { selectedWallet } = useSelectedWallet();

  const [continueDisabled, setContinueDisabled] = useState(true);

  useEffect(() => {
    if (tokenList.length === Object.keys(tokens).length) {
      setContinueDisabled(true);
    }
  }, []);

  const handleCoinChange = (e: any) => {
    const newState = tokens;
    for (let index = 0; index < newState.length; index += 1) {
      const token = newState[index];
      const prevState = token[2];
      if (index === +e.target.name) {
        token[2] = !prevState;
      }
    }
    let noCoinSelected = true;
    newState.forEach(token => {
      if (token[2]) {
        noCoinSelected = false;
      }
    });
    setContinueDisabled(noCoinSelected);
    setTokens([...newState]);
  };

  const sync = useSync();

  const onContinue = () => {
    const tokensToAdd = tokens.filter(token => token[2]).map(token => token[0]);
    tokensToAdd.forEach(tokenName => {
      erc20tokenDb.insert({
        walletId: selectedWallet.walletId,
        coin: tokenName,
        ethCoin: ethCoin.toLowerCase(),
        balance: '0'
      });
      sync.addTokenTask(
        selectedWallet.walletId,
        tokenName,
        ethCoin.toLowerCase()
      );
    });
    handleClose();
  };

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    const results = tokens.filter(
      token =>
        token[0].toLowerCase().includes(search.toLowerCase()) ||
        token[1].toLowerCase().includes(search.toLowerCase())
    );
    setSearchResults(results);
    setIsLoading(false);
  };

  const debouncedhandleSearch = useDebouncedFunction(handleSearch, 800);

  useEffect(() => {
    setIsLoading(true);
    debouncedhandleSearch();
  }, [search]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value.toLowerCase());
  };

  const renderCoinRow = ({ index, key, style }: any) => {
    const abbr = search ? searchResults[index][0] : tokens[index][0];
    const name = search ? searchResults[index][1] : tokens[index][1];
    const state = search ? !!searchResults[index][2] : !!tokens[index][2];
    return (
      <div key={key} style={style}>
        <div
          className={clsx(
            classes.coinItem,
            tokenList.includes(abbr) || state ? classes.selectedItem : ''
          )}
        >
          <div className={classes.flexRow}>
            <CoinIcons initial={abbr.toUpperCase()} />
            <Typography color="textPrimary">{name}</Typography>
          </div>
          <CustomCheckBox
            disabled={tokenList.includes(abbr)}
            name={index.toString()}
            checked={tokenList.includes(abbr) || state}
            onChange={handleCoinChange}
          />
        </div>
      </div>
    );
  };

  return (
    <Root className={classes.root}>
      <Grid
        item
        xs={12}
        style={{ display: 'flex', width: '95%', marginBottom: '1rem' }}
      >
        <Input
          style={{ width: '100% ' }}
          placeholder="Search Your Tokens"
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon style={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            )
          }}
          size="small"
          styleType="light"
        />
      </Grid>
      <div className={classes.head}>
        <Typography className={classes.heading}>Select tokens</Typography>
      </div>
      {searchResults.length > 0 ? (
        <div className={classes.coinContainer}>
          <AutoSizer>
            {({ height, width }: any) => (
              <List
                width={width}
                height={height}
                rowHeight={50}
                rowRenderer={renderCoinRow}
                rowCount={searchResults.length}
                overscanRowCount={3}
              />
            )}
          </AutoSizer>
        </div>
      ) : isLoading ? (
        <Grid container>
          <Grid item xs={12}>
            <div className={classes.loaderContainer}>
              <CircularProgress color="secondary" />
            </div>
          </Grid>
        </Grid>
      ) : (
        <Typography
          variant="subtitle1"
          color="textSecondary"
          style={{ alignItems: 'center', margin: '1rem 0rem 30rem 0rem' }}
        >
          No Tokens found.
        </Typography>
      )}
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

AddTokenForm.propTypes = {
  tokenList: PropTypes.array.isRequired,
  ethCoin: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired
};

export default AddTokenForm;
