import { COINS } from '@cypherock/communication';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Collapse } from '@mui/material';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import { styled, Theme, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import withStyles from '@mui/styles/withStyles';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
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
import prevent from '../../../../utils/preventPropagation';

import AddToken from './addToken';
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
  alignCenterCenter: `${PREFIX}-alignCenterCenter`,
  recieveButton: `${PREFIX}-recieveButton`,
  red: `${PREFIX}-red`,
  orange: `${PREFIX}-orange`,
  grey: `${PREFIX}-grey`,
  dialogRoot: `${PREFIX}-dialogRoot`,
  ethererum: `${PREFIX}-ethererum`,
  rootButtonWrapper: `${PREFIX}-rootButtonWrapper`
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
    background: theme.palette.primary.dark,
    height: '50%',
    margin: '0px 10px'
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
  initial,
  name,
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
  const theme = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const sync = useSync();
  const snackbar = useSnackbar();

  const { selectedWallet } = useSelectedWallet();

  const { coinDetails } = useCurrentCoin();

  const { beforeNetworkAction } = useConnection();

  const {
    tokenData,
    tokenList,
    setCurrentEthCoin,
    setCurrentWalletId,
    sortTokensByIndex
  } = useToken();

  useEffect(() => {
    const key = `${walletId}-${initial.toLowerCase()}`;
    if (initial && walletId && sync.modulesInExecutionQueue.includes(key)) {
      setIsLoading(true);
    } else {
      setIsLoading(l => {
        if (l) {
          // To open the tokens list right after adding ETH for the first time
          setCollapseTab(true);
          return false;
        }
      });
    }
  }, [sync.modulesInExecutionQueue, walletId, initial]);

  useEffect(() => {
    sortTokensByIndex(sortIndex);
  }, [sortIndex]);

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
    await deleteHistory(coinDetails);
    await deleteCoin(coinDetails.xpub, coinDetails.slug, walletId);
    await Promise.all(
      tokenList.map(async token => {
        await addressDb.delete({ coinType: token, walletId });
        await receiveAddressDb.delete({ walletId, coinType: token });
        await transactionDb.delete({ walletId, slug: token });
      })
    );
    await tokenDb.delete({
      walletId: selectedWallet._id,
      coin: coinDetails.slug
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

  const [collapseTab, setCollapseTab] = React.useState(false);

  const onClick = () => {
    if (beforeAction()) {
      navigate(
        `${
          Routes.transactions.index
        }?slug=${initial.toLowerCase()}&wallet=${walletId}`
      );
    }
  };

  useEffect(() => {
    setCurrentWalletId(selectedWallet._id);
    setCurrentEthCoin(coinDetails.slug);
  }, [selectedWallet._id]);

  useEffect(() => {
    setCollapseTab(false);
  }, [selectedWallet._id]);

  const [openAddToken, setOpenAddToken] = useState(false);

  const handleAddTokenFormClose = () => {
    setOpenAddToken(false);
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
            <CoinIcons
              initial={initial.toUpperCase()}
              style={{ marginRight: '10px' }}
            />
            <Typography color="textPrimary">{name}</Typography>
          </Grid>
          <Grid item xs={2} className={classes.alignStartCenter}>
            <PopOverText
              text={`${formatDisplayAmount(holding, 4)} ${initial}`}
              color="textPrimary"
              hoverText={`${formatDisplayAmount(
                holding,
                decimal,
                true
              )} ${initial}`}
            />
          </Grid>
          <Grid item xs={2} className={classes.alignStartCenter}>
            <Typography color="textPrimary">{`$${value}`}</Typography>
          </Grid>
          <Grid item xs={2} className={classes.alignStartCenter}>
            <Typography color="textPrimary">{`$${price}`}</Typography>
          </Grid>
          <Grid item xs={2} className={classes.actions}>
            <Button
              variant="text"
              className={!isEmpty ? clsx(classes.orange) : clsx(classes.grey)}
              onClick={handleSendFormOpen}
              startIcon={
                <Icon
                  className={classes.icon}
                  viewBox="0 0 14 15"
                  icon={ICONS.walletSend}
                  color={
                    !isEmpty
                      ? theme.palette.secondary.main
                      : theme.palette.grey[500]
                  }
                />
              }
            >
              Send
            </Button>
            <Divider orientation="vertical" className={classes.divider} />
            <Button
              variant="text"
              className={clsx(classes.recieveButton)}
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
              <Icon
                style={{
                  display: 'inline-block',
                  verticalAlign: 'middle'
                }}
                size={20}
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
                    const oneTokenData =
                      COINS[initial.toLowerCase()].tokenList[token.slug];
                    if (!oneTokenData) {
                      throw new Error(`Cannot find coinType: ${token.coin}`);
                    }
                    return (
                      <React.Fragment key={token.slug}>
                        <TokenContext.Provider
                          value={{ token, ethCoin: initial }}
                        >
                          <OneToken
                            initial={token.slug.toUpperCase()}
                            name={oneTokenData.name}
                            holding={token.displayBalance}
                            price={token.displayPrice}
                            decimal={oneTokenData.decimal}
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
          )}
        </>
      }
    </Root>
  );
};

EthereumOneCoin.propTypes = EthereumOneCoinPropTypes;

export default EthereumOneCoin;
