import { ALLCOINS as COINS } from '@cypherock/communication';
import { Collapse } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  makeStyles,
  Theme,
  useTheme,
  withStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../constants/routes';
import CustomIconButton from '../../../../designSystem/designComponents/buttons/customIconButton';
import DialogBoxConfirmation from '../../../../designSystem/designComponents/dialog/dialogBoxConfirmation';
import PopOverText from '../../../../designSystem/designComponents/hover/popoverText';
import Icon from '../../../../designSystem/designComponents/icons/Icon';
import CoinIcons from '../../../../designSystem/genericComponents/coinIcons';
import DeleteCoinIcon from '../../../../designSystem/iconGroups/deleteCoin';
import Dustbin from '../../../../designSystem/iconGroups/dustbin';
import ICONS from '../../../../designSystem/iconGroups/iconConstants';
import { Databases, dbUtil } from '../../../../store/database';
import { useToken } from '../../../../store/hooks';
import {
  useReceiveTransaction,
  useSendTransaction
} from '../../../../store/hooks/flows';
import {
  ReceiveTransactionContext,
  SendTransactionContext,
  TokenContext,
  useConnection,
  useCurrentCoin,
  useSelectedWallet,
  useSnackbar,
  useSync
} from '../../../../store/provider';
import formatDisplayAmount from '../../../../utils/formatDisplayAmount';

import AddToken from './addToken';
import { OneCoinProps, OneCoinPropTypes } from './OneCoinProps';
import OneToken from './OneToken';
import Recieve from './recieve';
import Send from './send';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    mainContainer: {
      marginBottom: '10px',
      marginRight: '10px',
      width: '100%'
    },
    root: {
      background: theme.palette.primary.light,
      borderRadius: '5px 5px 0 0',
      minHeight: 50,
      marginTop: '10px',
      padding: '5px 0px 0px',
      cursor: 'pointer',
      '&:hover': {
        background: '#343a42'
      }
    },
    loading: {
      opacity: 0.6
    },
    button: {},
    buttonEther: {
      fontSize: '0.7rem'
    },
    icon: {
      margin: '0px !important'
    },
    divider: {
      background: theme.palette.primary.dark,
      height: '50%',
      margin: '0px 10px'
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center'
    },
    alignStartCenter: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center'
    },
    alignCenterCenter: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center'
    },
    recieveButton: {
      color: theme.palette.info.main
    },
    red: {
      color: 'red'
    },
    orange: {
      color: theme.palette.secondary.main
    },
    dialogRoot: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: '4rem'
    },
    ethererum: {
      marginBottom: 5
    },
    rootButtonWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderTop: `1px solid rgba(33, 40, 35, 1)`
    }
  })
);

const CoinCardBtn = withStyles((theme: Theme) => ({
  root: {
    color: theme.palette.info.dark,
    textTransform: 'none',
    background: theme.palette.primary.light,
    '&:hover': {
      background: '#343a42'
    }
  },
  text: {
    padding: '3px 8px'
  }
}))(Button);

const EthereumOneCoin: React.FC<OneCoinProps> = ({
  initial,
  name,
  holding,
  price,
  value,
  isEmpty,
  decimal,
  walletId,
  deleteCoin,
  deleteHistory
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const sync = useSync();
  const snackbar = useSnackbar();

  const { selectedWallet } = useSelectedWallet();

  const { coinDetails } = useCurrentCoin();

  const { beforeNetworkAction } = useConnection();

  const { tokenData, tokenList, setCurrentEthCoin, setCurrentWalletId } =
    useToken();

  useEffect(() => {
    const key = `${walletId}-${initial.toLowerCase()}`;
    if (initial && walletId && sync.modulesInExecutionQueue.includes(key)) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [sync.modulesInExecutionQueue, walletId, initial]);

  const beforeAction = () => {
    if (isLoading) {
      snackbar.showSnackbar(
        `Please wait while we fetch the balance and latest price rates for ${name}`,
        'warning'
      );
      return false;
    }
    return true;
  };

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const handleDeleteOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    if (beforeAction()) {
      setDeleteOpen(true);
    }
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
  };
  const handleDeleteConfirmation = async () => {
    await deleteHistory(coinDetails);
    await deleteCoin(coinDetails.xpub, coinDetails.coin, walletId);
    tokenList.map(async token => {
      await dbUtil(Databases.ADDRESS, 'deleteAll', {
        xpub: coinDetails.xpub,
        coinType: token
      });
      await dbUtil(Databases.RECEIVEADDRESS, 'deleteAll', {
        walletId,
        coinType: token
      });
      await dbUtil(Databases.TRANSACTION, 'deleteByCoin', walletId, token);
    });
    await dbUtil(Databases.ERC20TOKEN, 'deleteAll', {
      walletId: selectedWallet.walletId,
      ethCoin: coinDetails.coin
    });
    setDeleteOpen(false);
  };

  const [sendForm, setSendForm] = useState(false);

  const sendTransaction = useSendTransaction();

  const handleSendFormOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    if (beforeAction() && beforeNetworkAction()) setSendForm(true);
  };

  const [receiveForm, setReceiveForm] = useState(false);

  const receiveTransaction = useReceiveTransaction();

  const handleReceiveFormOpen = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    if (beforeAction() && beforeNetworkAction()) setReceiveForm(true);
  };

  const [collapseTab, setCollapseTab] = React.useState(false);

  const onClick = () => {
    if (beforeAction()) {
      navigate(
        `${
          Routes.transactions.index
        }?coin=${initial.toLowerCase()}&wallet=${walletId}`
      );
    }
  };

  useEffect(() => {
    setCurrentWalletId(selectedWallet.walletId);
    setCurrentEthCoin(coinDetails.coin);
  }, [selectedWallet.walletId]);

  useEffect(() => {
    setCollapseTab(false);
  }, [selectedWallet.walletId]);

  const [openAddToken, setOpenAddToken] = useState(false);

  const handleAddTokenFormClose = () => {
    setOpenAddToken(false);
  };

  return (
    <div className={classes.mainContainer}>
      <DialogBoxConfirmation
        maxWidth="sm"
        fullScreen
        open={deleteOpen}
        handleClose={handleDeleteClose}
        handleConfirmation={handleDeleteConfirmation}
        isClosePresent
        restComponents={
          <div className={classes.dialogRoot}>
            <Icon
              viewBox="0 0 116 125"
              size={120}
              iconGroup={<DeleteCoinIcon />}
            />
            <Typography
              color="error"
              variant="h3"
              gutterBottom
              style={{ marginTop: '2rem' }}
            >
              Are you sure
            </Typography>
            <Typography color="textPrimary" style={{ marginBottom: '2rem' }}>
              {`You want to delete ${name} ?`}
            </Typography>
          </div>
        }
      />
      <AddToken
        openAddToken={openAddToken}
        tokenList={tokenList}
        handleClose={handleAddTokenFormClose}
        ethCoin={initial}
      />

      <SendTransactionContext.Provider
        value={{
          sendForm,
          setSendForm,
          sendTransaction
        }}
      >
        <Send />
      </SendTransactionContext.Provider>

      <ReceiveTransactionContext.Provider
        value={{
          receiveTransaction,
          receiveForm,
          setReceiveForm
        }}
      >
        <Recieve />
      </ReceiveTransactionContext.Provider>
      <Grid
        container
        onClick={onClick}
        className={clsx({ [classes.root]: true, [classes.loading]: isLoading })}
      >
        <Grid container className={classes.ethererum}>
          <Grid
            item
            xs={3}
            className={classes.alignStartCenter}
            style={{ paddingLeft: '1rem' }}
          >
            <CoinIcons initial={initial.toUpperCase()} />
            <Typography color="textPrimary">{name}</Typography>
          </Grid>
          <Grid item xs={2} className={classes.alignStartCenter}>
            <PopOverText
              text={`${initial} ${formatDisplayAmount(holding, 4)}`}
              color="textPrimary"
              hoverText={`${initial} ${formatDisplayAmount(
                holding,
                decimal,
                true
              )}`}
            />
          </Grid>
          <Grid item xs={2} className={classes.alignStartCenter}>
            <Typography color="textPrimary">{`$${value}`}</Typography>
          </Grid>
          <Grid item xs={2} className={classes.alignStartCenter}>
            <Typography color="textPrimary">{`$${price}`}</Typography>
          </Grid>
          <Grid item xs={2} className={classes.actions}>
            {!isEmpty ? (
              <Button
                variant="text"
                className={clsx(classes.button, classes.orange)}
                onClick={handleSendFormOpen}
                startIcon={
                  <Icon
                    className={classes.icon}
                    viewBox="0 0 14 15"
                    icon={ICONS.walletSend}
                    color={theme.palette.secondary.main}
                  />
                }
              >
                Send
              </Button>
            ) : (
              <Button
                variant="text"
                className={clsx(classes.button, classes.orange)}
                onClick={handleSendFormOpen}
                startIcon={
                  <Icon
                    className={classes.icon}
                    viewBox="0 0 14 15"
                    icon={ICONS.walletSend}
                    color={theme.palette.grey[500]}
                  />
                }
                disabled
              >
                Send
              </Button>
            )}
            <Divider orientation="vertical" className={classes.divider} />
            <Button
              variant="text"
              className={clsx(classes.button, classes.recieveButton)}
              startIcon={
                <Icon
                  className={classes.icon}
                  viewBox="0 0 14 15"
                  icon={ICONS.walletRecieve}
                  color={theme.palette.info.main}
                />
              }
              onClick={handleReceiveFormOpen}
            >
              Receive
            </Button>
          </Grid>
          <Grid item xs={1} className={classes.alignCenterCenter}>
            <CustomIconButton title="Delete Coin" onClick={handleDeleteOpen}>
              <Icon size={20} viewBox="0 0 18 18" iconGroup={<Dustbin />} />
            </CustomIconButton>
          </Grid>
        </Grid>
      </Grid>
      {initial.toUpperCase() !== 'ETHR' && (
        <>
          {tokenData.length > 0 ? (
            <Grid container>
              <Grid item xs={12}>
                <Collapse in={collapseTab} timeout="auto" unmountOnExit>
                  {tokenData.map(token => {
                    const coin = COINS[token.coin];
                    if (!coin) {
                      throw new Error(`Cannot find coinType: ${token.coin}`);
                    }
                    return (
                      <React.Fragment key={token.coin}>
                        <TokenContext.Provider value={{ token }}>
                          <OneToken
                            initial={token.coin.toUpperCase()}
                            name={coin.name}
                            holding={token.displayBalance}
                            price={token.displayPrice}
                            decimal={coin.decimal}
                            value={token.displayValue}
                            isEmpty={token.isEmpty}
                            walletId={walletId}
                            ethCoin={initial}
                          />
                        </TokenContext.Provider>
                      </React.Fragment>
                    );
                  })}
                  <CoinCardBtn
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      if (setOpenAddToken) setOpenAddToken(true);
                    }}
                    fullWidth
                    startIcon={<AddCircleIcon />}
                    style={{
                      borderRadius: '0',
                      borderTop: '1px solid #222',
                      padding: '6px'
                    }}
                    disabled={isLoading}
                    disableRipple
                  >
                    ADD TOKEN
                  </CoinCardBtn>
                </Collapse>
              </Grid>
              <Grid item xs={12} className={classes.rootButtonWrapper}>
                <CoinCardBtn
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    setCollapseTab(!collapseTab);
                  }}
                  fullWidth
                  style={{
                    borderRadius: '0 0 5px 5px'
                  }}
                >
                  Show Token
                  {collapseTab ? <ExpandLess /> : <ExpandMore />}
                </CoinCardBtn>
              </Grid>
            </Grid>
          ) : (
            <Grid item xs={12} className={classes.rootButtonWrapper}>
              <CoinCardBtn
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  if (setOpenAddToken) setOpenAddToken(true);
                }}
                fullWidth
                startIcon={<AddCircleIcon />}
                style={{
                  borderRadius: '0',
                  borderTop: '1px solid #222',
                  padding: '6px'
                }}
                disabled={isLoading}
                disableRipple
              >
                ADD TOKEN
              </CoinCardBtn>
            </Grid>
          )}
        </>
      )}
    </div>
  );
};

EthereumOneCoin.propTypes = OneCoinPropTypes;

export default EthereumOneCoin;
