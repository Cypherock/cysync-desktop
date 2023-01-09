import {
  AbsCoinData,
  CoinGroup,
  COINS,
  ETHCOINS,
  NearCoinData,
  SolanaCoinData
} from '@cypherock/communication';
import {
  bitcoin as bitcoinServer,
  eth as ethServer,
  near as nearServer,
  solana as solanaServer
} from '@cypherock/server-wrapper';
import CopyIcon from '@mui/icons-material/FileCopyOutlined';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import { shell } from 'electron';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import Button from '../../../../designSystem/designComponents/buttons/button';
import IconButton from '../../../../designSystem/designComponents/buttons/customIconButton';
import PopOverText from '../../../../designSystem/designComponents/hover/popoverText';
import Icon from '../../../../designSystem/designComponents/icons/Icon';
import CoinIcons from '../../../../designSystem/genericComponents/coinIcons';
import ICONS from '../../../../designSystem/iconGroups/iconConstants';
import {
  convertToDisplayValue,
  getLatestPriceForCoin,
  SentReceive
} from '../../../../store/database';
import {
  DisplayTransaction,
  DisplayTransactionPropTypes
} from '../../../../store/hooks';
import { useDiscreetMode, useSnackbar } from '../../../../store/provider';
import formatDisplayAmount from '../../../../utils/formatDisplayAmount';
import logger from '../../../../utils/logger';

const PREFIX = 'TransactionDialog';

const classes = {
  dateTimeContainer: `${PREFIX}-dateTimeContainer`,
  dateText: `${PREFIX}-dateText`,
  timeText: `${PREFIX}-timeText`,
  dataContainer: `${PREFIX}-dataContainer`,
  flex: `${PREFIX}-flex`,
  flexCenter: `${PREFIX}-flexCenter`,
  button: `${PREFIX}-button`,
  blue: `${PREFIX}-blue`,
  red: `${PREFIX}-red`,
  orange: `${PREFIX}-orange`,
  inputOutputContainer: `${PREFIX}-inputOutputContainer`
};

const Root = styled('div')(({ theme }) => ({
  padding: '0 25px',
  minWidth: '50rem',
  maxWidth: '70rem',
  [`& .${classes.dateTimeContainer}`]: {
    marginBottom: '20px'
  },
  [`& .${classes.dateText}`]: {
    fontWeight: 'bold'
  },
  [`& .${classes.timeText}`]: {
    fontWeight: 'lighter'
  },
  [`& .${classes.dataContainer}`]: {
    margin: '10px 0',
    marginRight: '3rem'
  },
  [`& .${classes.flex}`]: {
    display: 'flex',
    alignItems: 'center'
  },
  [`& .${classes.flexCenter}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  [`& .${classes.button}`]: {
    background: '#71624C',
    color: theme.palette.text.primary,
    textTransform: 'none',
    padding: '0.5rem 3.5rem',
    marginBottom: '2rem',
    marginTop: '20px',
    '&:hover': {
      background: theme.palette.secondary.dark
    }
  },
  [`& .${classes.blue}`]: {
    color: theme.palette.info.main
  },
  [`& .${classes.red}`]: {
    color: theme.palette.error.main
  },
  [`& .${classes.orange}`]: {
    color: theme.palette.secondary.main
  },
  [`& .${classes.inputOutputContainer}`]: {
    maxHeight: '400px',
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      width: '4px',
      background: theme.palette.primary.light
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.text.secondary
    }
  }
}));

interface TransactionDialogProps {
  txn: DisplayTransaction;
}

const TransactionDialog: React.FC<TransactionDialogProps> = props => {
  const theme = useTheme();
  const discreetMode = useDiscreetMode();
  const { txn } = props;
  const snackbar = useSnackbar();

  const [coinPrice, setCoinPrice] = useState(0);
  const [ethCoinPrice, setEthCoinPrice] = useState(0);

  useEffect(() => {
    if (txn && txn.coinId) {
      getLatestPriceForCoin(txn.coinId, txn.parentCoinId)
        .then(price => {
          setCoinPrice(price);
        })
        .catch(logger.error);

      if (txn.parentCoinId && txn.parentCoinId !== txn.coinId) {
        getLatestPriceForCoin(txn.parentCoinId)
          .then(price => {
            setEthCoinPrice(price);
          })
          .catch(logger.error);
      }
    } else {
      setCoinPrice(0);
    }
  }, [txn]);

  const formatCoins = (coins: string, showFull?: false) => {
    if (showFull) {
      return discreetMode.handleSensitiveDataDisplay(
        formatDisplayAmount(parseFloat(coins) || 0)
      );
    }

    return discreetMode.handleSensitiveDataDisplay(
      formatDisplayAmount(parseFloat(coins) || 0, 5, true)
    );
  };

  const getPriceForCoin = (coins: string) => {
    return (parseFloat(coins) || 0) * coinPrice;
  };

  const getFeeCoinData = () => {
    if (txn.isErc20 && txn.parentCoinId) {
      return COINS[txn.parentCoinId];
    }

    return COINS[txn.coinId];
  };

  const getFeePrice = (showFull?: boolean) => {
    if (txn.isErc20) {
      return discreetMode.handleSensitiveDataDisplay(
        formatDisplayAmount(
          (parseFloat(txn.displayFees) || 0) * ethCoinPrice,
          showFull ? undefined : 2,
          true
        )
      );
    }

    return discreetMode.handleSensitiveDataDisplay(
      formatDisplayAmount(
        getPriceForCoin(txn.displayFees),
        showFull ? undefined : 2,
        true
      )
    );
  };

  const openTxn = () => {
    const coin = COINS[txn.coinId];

    if (ETHCOINS[txn.parentCoinId] || txn.isErc20) {
      const ecoin = ETHCOINS[txn.parentCoinId];

      if (!ecoin) {
        logger.error('Invalid ETH COIN in txn: ' + txn.coin);
        return;
      }

      shell.openExternal(
        ethServer.transaction.getOpenTxnLink({
          network: ecoin.network,
          txHash: txn.hash,
          isConfirmed: txn.confirmations && txn.confirmations > 0
        })
      );
      return;
    }

    if (!coin) {
      logger.error('Invalid COIN in txn: ' + txn.coinName);
      return;
    }

    if (coin.group === CoinGroup.Near) {
      shell.openExternal(
        nearServer.transaction.getOpenTxnLink({
          network: (coin as NearCoinData).network,
          txHash: txn.hash
        })
      );
    } else if (coin.group === CoinGroup.Solana) {
      shell.openExternal(
        solanaServer.transaction.getOpenTxnLink({
          txHash: txn.hash,
          network: (coin as SolanaCoinData).network
        })
      );
    } else {
      shell.openExternal(
        bitcoinServer.transaction.getOpenTxnLink({
          coinType: coin.abbr,
          txHash: txn.hash,
          isConfirmed: txn.confirmations && txn.confirmations > 0
        })
      );
    }
  };

  const getResultIcon = () => {
    switch (txn.sentReceive) {
      case SentReceive.SENT:
        return (
          <Icon
            viewBox="0 0 14 14"
            icon={ICONS.send}
            color={theme.palette.secondary.main}
          />
        );
      case SentReceive.RECEIVED:
        return (
          <Icon
            viewBox="0 0 14 14"
            icon={ICONS.recieve}
            color={theme.palette.info.main}
          />
        );
      default:
        return null;
    }
  };

  if (!txn) return <></>;

  //used for displaying eth or erc20Tokens addresses in lower case
  let coinData: AbsCoinData;
  if (txn.parentCoinId && txn.parentCoinId !== txn.coinId) {
    const parent = COINS[txn.parentCoinId];
    if (!parent) {
      logger.warn(`Cannot find parentCoinId parent: ${txn.parentCoinId}`);
    }
    coinData = parent.tokenList[txn.coinId];
  } else coinData = COINS[txn.coinId];
  if (!coinData) {
    logger.warn(`Cannot find coinId: ${txn.coinId}`);
  }
  const isEth =
    coinData.group === CoinGroup.Ethereum ||
    coinData.group === CoinGroup.ERC20Tokens;
  return (
    <Root>
      <div className={classes.dateTimeContainer}>
        <Typography className={classes.dateText} variant="body1">
          {txn.confirmed ? new Date(txn.confirmed).toLocaleDateString() : ''}
        </Typography>
        <Typography className={classes.timeText} variant="body1">
          {txn.confirmed ? new Date(txn.confirmed).toLocaleTimeString() : ''}
        </Typography>
      </div>
      <div className={classes.dataContainer}>
        <Typography color="textSecondary">Wallet</Typography>
        <Typography>{txn.walletName}</Typography>
      </div>
      <div className={classes.dataContainer}>
        <Typography color="textSecondary">Action</Typography>
        <Typography
          className={
            !(txn.sentReceive === SentReceive.SENT)
              ? classes.blue
              : classes.orange
          }
          variant="body2"
        >
          {getResultIcon()}
          {convertToDisplayValue(txn.sentReceive).toUpperCase()}
        </Typography>
      </div>
      <div className={classes.dataContainer}>
        <Typography color="textSecondary">Status</Typography>
        <Typography
          className={
            txn.status === 1
              ? classes.blue
              : txn.status === 0
              ? classes.orange
              : classes.red
          }
        >
          {txn.status === 1
            ? 'SUCCESS'
            : txn.status === 0
            ? 'PENDING'
            : 'FAILED'}
        </Typography>
      </div>
      <div className={classes.dataContainer}>
        <Typography color="textSecondary">Amount</Typography>
        <div className={classes.flex}>
          <CoinIcons
            style={{ marginLeft: '0', marginRight: '10px' }}
            initial={txn.coinId}
            parentCoin={txn.parentCoinId}
          />
          <Typography sx={{ mr: 1 }}>
            {`${coinData.abbr.toUpperCase()} ${formatCoins(
              txn.displayAmount
            )} `}
          </Typography>
          <PopOverText
            color="textPrimary"
            hoverText={`$ ${discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(
                getPriceForCoin(txn.displayAmount),
                undefined,
                true
              )
            )} `}
          >
            {`($ ${discreetMode.handleSensitiveDataDisplay(
              formatDisplayAmount(getPriceForCoin(txn.displayAmount), 2, true)
            )})`}
          </PopOverText>
        </div>
      </div>
      <div className={classes.dataContainer}>
        <Typography color="textSecondary">Fee</Typography>
        <div className={classes.flex}>
          <CoinIcons
            style={{ marginLeft: '0', marginRight: '10px' }}
            initial={getFeeCoinData().id}
          />
          <Typography
            sx={{ mr: 1 }}
          >{`${getFeeCoinData().abbr.toUpperCase()} ${formatCoins(
            txn.displayFees
          )}`}</Typography>
          <PopOverText
            text={`($ ${getFeePrice()})`}
            color="textPrimary"
            hoverText={`$ ${getFeePrice(true)} `}
          />
        </div>
      </div>
      {
        <div style={{ display: 'flex' }}>
          {txn.type && (
            <div className={classes.dataContainer}>
              <Typography color="textSecondary">Type</Typography>
              <div className={classes.flex}>
                <Typography>{txn.type.toUpperCase()}</Typography>
              </div>
            </div>
          )}
          {txn.description && (
            <div className={classes.dataContainer}>
              <Typography color="textSecondary">Description</Typography>
              <div className={classes.flex}>
                <Typography>{txn.description}</Typography>
              </div>
            </div>
          )}
        </div>
      }
      <Grid
        container
        spacing={2}
        className={clsx(classes.dataContainer, classes.inputOutputContainer)}
      >
        <Grid item xs={6} style={{ overflow: 'auto' }}>
          <Typography style={{ marginBottom: '10px' }} color="textSecondary">
            Sender
          </Typography>
          {(txn.inputs || [])
            .sort((a, b) => a.indexNumber - b.indexNumber)
            .map((elem, i) => (
              <div key={elem.address} style={{ marginBottom: '10px' }}>
                {elem.isMine && (
                  <Chip size="small" variant="outlined" label="Mine" />
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Typography
                    color={elem.isMine ? 'secondary' : undefined}
                    style={{ marginRight: '2px' }}
                  >
                    {`${i + 1}.`}
                  </Typography>
                  <div>
                    <Typography
                      style={{ userSelect: 'text' }}
                      color={elem.isMine ? 'secondary' : undefined}
                    >
                      {isEth ? elem.address.toLowerCase() : elem.address}
                    </Typography>
                    <Typography
                      style={{ userSelect: 'text' }}
                      color={elem.isMine ? 'secondary' : undefined}
                    >
                      {`${coinData.abbr.toUpperCase()} ${formatCoins(
                        elem.displayValue
                      )}`}
                    </Typography>
                  </div>
                </div>
              </div>
            ))}
        </Grid>

        <Grid item xs={6} style={{ overflow: 'auto' }}>
          <Typography style={{ marginBottom: '10px' }} color="textSecondary">
            Receiver
          </Typography>
          {(txn.outputs || [])
            .sort((a, b) => a.indexNumber - b.indexNumber)
            .map((elem, i) => (
              <div key={elem.address} style={{ marginBottom: '10px' }}>
                {elem.isMine && (
                  <Chip size="small" variant="outlined" label="Mine" />
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Typography
                    color={elem.isMine ? 'secondary' : undefined}
                    style={{ marginRight: '2px' }}
                  >
                    {`${i + 1}.`}
                  </Typography>
                  <div>
                    <Typography
                      style={{ userSelect: 'text' }}
                      color={elem.isMine ? 'secondary' : undefined}
                    >
                      {isEth ? elem.address.toLowerCase() : elem.address}
                    </Typography>
                    <Typography
                      style={{ userSelect: 'text' }}
                      color={elem.isMine ? 'secondary' : undefined}
                    >
                      {`${coinData.abbr.toUpperCase()} ${formatCoins(
                        elem.displayValue
                      )}`}
                    </Typography>
                  </div>
                </div>
              </div>
            ))}
        </Grid>
      </Grid>
      <div className={classes.dataContainer}>
        <div className={classes.flex}>
          <Typography color="textSecondary" style={{ marginRight: '5px' }}>
            Transaction Hash
          </Typography>
          <IconButton
            color="secondary"
            title="Copy to clipboard"
            onClick={() => {
              navigator.clipboard.writeText(txn.hash);
              snackbar.showSnackbar('Copied to clipboard.', 'success');
            }}
          >
            <CopyIcon />
          </IconButton>
        </div>
        <Typography style={{ userSelect: 'text' }}>{txn.hash}</Typography>
      </div>
      <div className={classes.flexCenter}>
        <Button onClick={openTxn} className={classes.button}>
          Open in Browser
        </Button>
      </div>
    </Root>
  );
};

TransactionDialog.propTypes = {
  txn: PropTypes.exact(DisplayTransactionPropTypes)
};

export default TransactionDialog;
