import SearchIcon from '@mui/icons-material/Search';
import { Alert, styled, useTheme } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { AutoSizer, List, ListRowProps } from 'react-virtualized';

import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import CustomCheckBox from '../../../../../designSystem/designComponents/input/checkbox';
import Input from '../../../../../designSystem/designComponents/input/input';
import CoinIcons from '../../../../../designSystem/genericComponents/coinIcons';
import { useDebouncedFunction } from '../../../../../store/hooks';

import getTokens, { IInitialToken } from './tokens';

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
    height: '300px'
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
    marginTop: '5rem'
  }
}));

export interface AddTokenFormProps {
  tokenList: string[];
  ethCoinId: string;
  handleClose: (token?: string) => void;
}

const AddTokenForm: React.FC<AddTokenFormProps> = ({
  tokenList,
  ethCoinId: ethCoinId,
  handleClose
}) => {
  const theme = useTheme();

  // Using JSON.parse to create a deep copy instead of passing by referrence
  // Using useRef because this variable will not change throught the lifecycle
  // of this component.
  const tokens = useRef<IInitialToken[]>(
    JSON.parse(JSON.stringify(getTokens(ethCoinId)))
  );

  const [selectedToken, setSelectedToken] = useState<string | undefined>(
    undefined
  );

  const [continueDisabled, setContinueDisabled] = useState(true);

  useEffect(() => {
    if (!selectedToken) {
      setContinueDisabled(true);
    } else {
      setContinueDisabled(false);
    }
  }, [selectedToken]);

  const handleCoinSelect = (abbr: string) => {
    setSelectedToken(abbr);
  };

  const onContinue = () => {
    handleClose(selectedToken);
  };

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<IInitialToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    const results = tokens.current.filter(
      token =>
        token.abbr.toLowerCase().includes(search.toLowerCase()) ||
        token.name.toLowerCase().includes(search.toLowerCase())
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

  const renderCoinRow = ({ index, key, style }: ListRowProps) => {
    const item = search ? searchResults[index] : tokens.current[index];
    const { abbr, name, coinId } = item;
    const wasAlreadyAdded = tokenList.includes(abbr);
    const isSelected = wasAlreadyAdded || selectedToken === abbr;

    return (
      <div key={key} style={style}>
        <div
          className={clsx(
            classes.coinItem,
            isSelected ? classes.selectedItem : ''
          )}
        >
          <div className={classes.flexRow}>
            <CoinIcons
              initial={coinId}
              parentCoin={ethCoinId}
              style={{ marginRight: '10px' }}
            />
            <Typography color="textPrimary">{name}</Typography>
          </div>
          <CustomCheckBox
            disabled={wasAlreadyAdded}
            name={index.toString()}
            checked={isSelected}
            onChange={() => handleCoinSelect(abbr)}
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
        <Typography className={classes.heading}>Select token</Typography>
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
        <div className={classes.coinContainer}>
          <div className={classes.loaderContainer}>
            <CircularProgress color="secondary" />
          </div>
        </div>
      ) : (
        <Typography
          variant="subtitle1"
          color="textSecondary"
          style={{ alignItems: 'center', margin: '1rem 0rem 30rem 0rem' }}
        >
          No Tokens found.
        </Typography>
      )}

      <Alert sx={{ mt: 2 }} severity="info" variant="outlined">
        In order to add an ERC20 token you have to receive it in your wallet
      </Alert>
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
        Receive
      </CustomButton>
    </Root>
  );
};

AddTokenForm.propTypes = {
  tokenList: PropTypes.array.isRequired,
  ethCoinId: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired
};

export default AddTokenForm;
