import { AccountTypeDetails, COINS } from '@cypherock/communication';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import { Collapse, Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { styled, Theme, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import withStyles from '@mui/styles/withStyles';
import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Routes from '../../../../constants/routes';
import CustomIconButton from '../../../../designSystem/designComponents/buttons/customIconButton';
import CustomizedDialog from '../../../../designSystem/designComponents/dialog/newDialogBox';
import PopOverText from '../../../../designSystem/designComponents/hover/popoverText';
import Icon from '../../../../designSystem/designComponents/icons/Icon';
import CoinIcons from '../../../../designSystem/genericComponents/coinIcons';
import DeleteCoinIcon from '../../../../designSystem/iconGroups/deleteCoin';
import Dustbin from '../../../../designSystem/iconGroups/dustbin';
import ICONS from '../../../../designSystem/iconGroups/iconConstants';
import {
  addressDb,
  receiveAddressDb,
  tokenDb,
  transactionDb
} from '../../../../store/database';
import { DisplayToken, useToken } from '../../../../store/hooks';
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
  useDiscreetMode,
  useSelectedWallet,
  useSnackbar,
  useSync
} from '../../../../store/provider';
import formatDisplayAmount from '../../../../utils/formatDisplayAmount';
import prevent from '../../../../utils/preventPropagation';

import AddToken from './addToken';
import getTokens, { IInitialToken } from './addToken/tokens';
import SendButton from './generalComponents/SendButton';
import { EthereumOneCoinProps, EthereumOneCoinPropTypes } from './OneCoinProps';
import OneToken from './OneToken';
import Recieve from './recieve';
import Send from './send';

const PREFIX = 'EthereumOneCoin';

const classes = {
  root: `${PREFIX}-root`,
  loading: `${PREFIX}-loading`,
  buttonEther: `${PREFIX}-buttonEther`,
  icon: `${PREFIX}-icon`,
  divider: `${PREFIX}-divider`,
  actions: `${PREFIX}-actions`,
  alignStartCenter: `${PREFIX}-alignStartCenter`,
  coinNameContainer: `${PREFIX}-coinNameContainer`,
  infoIcon: `${PREFIX}-infoIcon`,
  accountTag: `${PREFIX}-accountTag`,
  alignCenterCenter: `${PREFIX}-alignCenterCenter`,
  recieveButton: `${PREFIX}-recieveButton`,
  red: `${PREFIX}-red`,
  orange: `${PREFIX}-orange`,
  grey: `${PREFIX}-grey`,
  dialogRoot: `${PREFIX}-dialogRoot`,
  ethererum: `${PREFIX}-ethererum`,
  rootButtonWrapper: `${PREFIX}-rootButtonWrapper`,
  actionButton: `${PREFIX}-actionButton`,
  actionButtonIcon: `${PREFIX}-actionButtonIcon`
};

const Root = styled('div')(({ theme }) => ({
  marginBottom: '10px',
  marginRight: '10px',
  width: '100%',
  [`& .${classes.root}`]: {
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
  [`& .${classes.loading}`]: {
    opacity: 0.6
  },
  [`& .${classes.buttonEther}`]: {
    fontSize: '0.7rem'
  },
  [`& .${classes.icon}`]: {
    margin: '0px !important'
  },
  [`& .${classes.divider}`]: {
    height: '100%',
    width: '0',
    margin: '0 2.5px'
  },
  [`& .${classes.actions}`]: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  [`& .${classes.alignStartCenter}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  [`& .${classes.coinNameContainer}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  [`& .${classes.infoIcon}`]: {
    fontSize: '12px',
    color: '#ADABAA'
  },
  [`& .${classes.accountTag}`]: {
    color: '#ADABAA',
    border: '1px solid #ADABAA',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '8px',
    width: 'fit-content'
  },
  [`& .${classes.alignCenterCenter}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.recieveButton}`]: {
    color: theme.palette.info.main
  },
  [`& .${classes.red}`]: {
    color: 'red'
  },
  [`& .${classes.orange}`]: {
    color: theme.palette.secondary.main
  },
  [`& .${classes.grey}`]: {
    color: theme.palette.grey[500]
  },
  [`& .${classes.dialogRoot}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '4rem'
  },
  [`& .${classes.ethererum}`]: {
    marginBottom: 5
  },
  [`& .${classes.rootButtonWrapper}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTop: `1px solid rgba(33, 40, 35, 1)`
  },
  [`& .${classes.actionButton}`]: {
    [theme.breakpoints.down('lg')]: {
      fontSize: '12px'
    }
  },
  [`& .${classes.actionButtonIcon}`]: {
    [theme.breakpoints.down('lg')]: {
      width: '14px',
      height: '14px'
    }
  }
}));

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

const EthereumOneCoin: React.FC<EthereumOneCoinProps> = ({
  coinId,
  accountId,
  initial,
  coinName,
  accountIndex,
  accountType,
  derivationPath,
  holding,
  price,
  value,
  isEmpty,
  decimal,
  walletId,
  deleteCoin,
  deleteHistory,
  sortIndex
}) => {
  const discreetMode = useDiscreetMode();
  const theme = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const sync = useSync();
  const snackbar = useSnackbar();

  // Using JSON.parse to create a deep copy instead of passing by referrence
  // Using useRef because this variable will not change throught the lifecycle
  // of this component.
  const tokens = useRef<IInitialToken[]>(
    JSON.parse(JSON.stringify(getTokens(coinId)))
  );

  const { selectedWallet } = useSelectedWallet();

  const { coinDetails } = useCurrentCoin();

  const { beforeNetworkAction } = useConnection();

  const { tokenData, tokenList, setCurrentAccountId, sortTokensByIndex } =
    useToken();

  useEffect(() => {
    const key = accountId;
    if (accountId && sync.modulesInExecutionQueue.includes(key)) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [sync.modulesInExecutionQueue, accountId]);

  useEffect(() => {
    sortTokensByIndex(sortIndex);
  }, [sortIndex]);

  const beforeAction = () => {
    if (isLoading) {
      snackbar.showSnackbar(
        `Wait while we fetch the balance and latest price rates for ${name}`,
        'warning'
      );
      return false;
    }
    return true;
  };

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const handleDeleteOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeAction()) {
      setDeleteOpen(true);
    }
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
  };
  const handleDeleteConfirmation = async () => {
    await deleteHistory(coinDetails.accountId);
    await deleteCoin(coinDetails.accountId);
    await Promise.all(
      tokenList.map(async token => {
        await addressDb.delete({ accountId, coinId: token });
        await receiveAddressDb.delete({ accountId, coinId: token });
        await transactionDb.delete({ accountId, coinId: token });
      })
    );
    await tokenDb.delete({
      walletId: selectedWallet._id,
      parentCoinId: coinDetails.coinId,
      accountId
    });
  };

  const [sendForm, setSendForm] = useState(false);

  const sendTransaction = useSendTransaction();

  const handleSendFormOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeAction() && beforeNetworkAction() && !isEmpty) setSendForm(true);
  };

  const [receiveForm, setReceiveForm] = useState(false);
  const receiveTransaction = useReceiveTransaction();
  const handleReceiveFormOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeAction() && beforeNetworkAction()) setReceiveForm(true);
  };

  const [selectedAddToken, setSelectedAddToken] = useState<
    DisplayToken | undefined
  >(undefined);
  const [addTokenReceiveForm, setAddTokenReceiveForm] = useState(false);
  const addTokenReceiveTransaction = useReceiveTransaction();
  const handleAddTokenReceiveFormOpen = () => {
    if (beforeAction() && beforeNetworkAction()) setAddTokenReceiveForm(true);
  };

  const [collapseTab, setCollapseTab] = React.useState(false);

  const onClick = () => {
    if (beforeAction()) {
      navigate(
        `${Routes.transactions.index}?coinId=${coinId}&wallet=${walletId}&accountId=${accountId}`
      );
    }
  };

  useEffect(() => {
    setCurrentAccountId(coinDetails.accountId);
  }, [coinDetails]);

  useEffect(() => {
    setCollapseTab(false);
  }, [selectedWallet._id]);

  const [openAddToken, setOpenAddToken] = useState(false);

  const handleAddTokenFormClose = (selectedToken?: string) => {
    const elem = tokens.current.find(e => e.abbr === selectedToken);

    if (elem) {
      const token: DisplayToken = {
        coinId: elem.coinId,
        parentCoinId: coinId,
        accountId,
        walletId: selectedWallet._id,
        balance: '0',
        price: 0,
        displayValue: '0',
        displayPrice: '0',
        displayBalance: '0',
        isEmpty: true,
        parentCoin: initial,
        priceLastUpdatedAt: undefined
      };

      if (!(beforeAction() && beforeNetworkAction())) {
        return;
      }

      setSelectedAddToken(token);
    }

    setOpenAddToken(false);
  };

  useEffect(() => {
    if (selectedAddToken) {
      handleAddTokenReceiveFormOpen();
    }
  }, [selectedAddToken]);

  const getName = () => {
    return `${coinName} ${accountIndex + 1}`;
  };

  const getAccountTag = () => {
    return AccountTypeDetails[accountType]?.tag;
  };

  return (
    <Root>
      <CustomizedDialog
        open={deleteOpen}
        handleClose={handleDeleteClose}
        onYes={handleDeleteConfirmation}
      >
        <Icon viewBox="0 0 116 125" size={120} iconGroup={<DeleteCoinIcon />} />
        <Typography
          color="error"
          variant="h3"
          gutterBottom
          style={{ marginTop: '2rem' }}
        >
          Are you sure
        </Typography>
        <Typography color="textPrimary">{`You want to delete ${name} ?`}</Typography>
      </CustomizedDialog>
      <AddToken
        openAddToken={openAddToken}
        tokenList={tokenList}
        handleClose={handleAddTokenFormClose}
        ethCoinId={coinId}
      />

      {selectedAddToken && (
        <TokenContext.Provider
          value={{ token: selectedAddToken, ethCoinId: coinId }}
        >
          <ReceiveTransactionContext.Provider
            value={{
              receiveTransaction: addTokenReceiveTransaction,
              receiveForm: addTokenReceiveForm,
              setReceiveForm: val => {
                if (!val) {
                  setSelectedAddToken(undefined);
                }
                setAddTokenReceiveForm(val);
              }
            }}
          >
            <Recieve />
          </ReceiveTransactionContext.Provider>
        </TokenContext.Provider>
      )}

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
            <CoinIcons initial={coinId} style={{ marginRight: '10px' }} />
            <Typography style={{ paddingRight: '8px' }} noWrap={true}>
              <div className={classes.coinNameContainer}>
                <PopOverText
                  color="textPrimary"
                  hoverText={getName()}
                  style={{ marginRight: 2 }}
                >
                  {getName()}
                </PopOverText>
                <Tooltip title={derivationPath}>
                  <InfoIcon className={classes.infoIcon} />
                </Tooltip>
              </div>
              {getAccountTag() && (
                <Typography className={classes.accountTag} noWrap={true}>
                  {getAccountTag()}
                </Typography>
              )}
            </Typography>
          </Grid>
          <Grid item xs={2} className={classes.alignStartCenter}>
            <PopOverText
              color="textPrimary"
              hoverText={`${discreetMode.handleSensitiveDataDisplay(
                formatDisplayAmount(holding, decimal, true)
              )} ${initial}`}
              style={{ paddingRight: '8px' }}
            >
              {discreetMode.handleSensitiveDataDisplay(
                formatDisplayAmount(holding, 5, true)
              )}{' '}
              {initial}
            </PopOverText>
          </Grid>
          <Grid item xs={2} className={classes.alignStartCenter}>
            <PopOverText
              color="textPrimary"
              hoverText={`$ ${discreetMode.handleSensitiveDataDisplay(
                formatDisplayAmount(value, undefined, true)
              )} `}
              style={{ paddingRight: '8px' }}
            >
              $
              {discreetMode.handleSensitiveDataDisplay(
                formatDisplayAmount(value, 2, true)
              )}
            </PopOverText>
          </Grid>
          <Grid item xs={2} className={classes.alignStartCenter}>
            <PopOverText
              color="textPrimary"
              hoverText={`$ ${formatDisplayAmount(price, undefined, true)} `}
              style={{ paddingRight: '8px' }}
            >
              $ {formatDisplayAmount(price, 2, true)}
            </PopOverText>
          </Grid>
          <Grid item xs={2} className={classes.actions}>
            <SendButton
              handleSendFormOpen={handleSendFormOpen}
              isEmpty={isEmpty}
              prefix={PREFIX}
            />
            <div className={classes.divider} />
            <Button
              variant="text"
              className={clsx(classes.recieveButton, classes.actionButton)}
              startIcon={
                <Icon
                  className={clsx(classes.icon, classes.actionButtonIcon)}
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
            <CustomIconButton
              title="Delete Coin"
              onClick={handleDeleteOpen}
              iconButtonClassName={clsx(classes.actionButton)}
            >
              <Icon
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle'
                }}
                size={16}
                viewBox="0 0 18 18"
                iconGroup={<Dustbin />}
              />
            </CustomIconButton>
          </Grid>
        </Grid>
      </Grid>
      {
        <>
          {tokenData.length > 0 ? (
            <Grid container>
              <Grid item xs={12}>
                <Collapse in={collapseTab} timeout="auto" unmountOnExit>
                  {tokenData.map(token => {
                    const oneTokenData = COINS[coinId].tokenList[token.coinId];
                    if (!oneTokenData) {
                      throw new Error(`Cannot find coinId: ${token.coinId}`);
                    }
                    return (
                      <React.Fragment key={token.coinId}>
                        <TokenContext.Provider
                          value={{ token, ethCoinId: initial }}
                        >
                          <OneToken
                            coinId={token.coinId}
                            accountId={accountId}
                            initial={oneTokenData.abbr.toUpperCase()}
                            name={oneTokenData.name}
                            holding={token.displayBalance}
                            price={token.displayPrice}
                            decimal={oneTokenData.decimal}
                            value={token.displayValue}
                            isEmpty={token.isEmpty}
                            walletId={walletId}
                            ethCoinId={token.parentCoinId}
                          />
                        </TokenContext.Provider>
                      </React.Fragment>
                    );
                  })}
                  <CoinCardBtn
                    onClick={(e: React.MouseEvent) => {
                      prevent(e);
                      if (setOpenAddToken) setOpenAddToken(true);
                    }}
                    fullWidth
                    startIcon={<AddCircleIcon />}
                    style={{
                      borderRadius: '0 0 5px 5px',
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
                    prevent(e);
                    setCollapseTab(!collapseTab);
                  }}
                  fullWidth
                  style={{
                    borderRadius: '0 0 5px 5px'
                  }}
                >
                  {collapseTab ? 'Hide Tokens' : 'Show Tokens'}
                  {collapseTab ? <ExpandLess /> : <ExpandMore />}
                </CoinCardBtn>
              </Grid>
            </Grid>
          ) : (
            tokens.current?.length <= 0 || (
              <Grid item xs={12} className={classes.rootButtonWrapper}>
                <CoinCardBtn
                  onClick={(e: React.MouseEvent) => {
                    prevent(e);
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
            )
          )}
        </>
      }
    </Root>
  );
};

EthereumOneCoin.propTypes = EthereumOneCoinPropTypes;

export default EthereumOneCoin;
