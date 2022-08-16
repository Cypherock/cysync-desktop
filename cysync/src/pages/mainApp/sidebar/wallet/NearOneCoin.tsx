import { generateNearAddressFromXpub } from '@cypherock/wallet';
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
import WarningExclamation from '../../../../designSystem/iconGroups/warningExclamation';
import { useCustomAccount } from '../../../../store/hooks';
import {
  useReceiveTransaction,
  useSendTransaction
} from '../../../../store/hooks/flows';
import {
  CustomAccountContext,
  ReceiveTransactionContext,
  SendTransactionContext,
  useConnection,
  useCurrentCoin,
  useSelectedWallet,
  useSnackbar,
  useSync
} from '../../../../store/provider';
import formatDisplayAmount from '../../../../utils/formatDisplayAmount';
import prevent from '../../../../utils/preventPropagation';

import AddAccount from './addAccount';
import { NearOneCoinProps, NearOneCoinPropTypes } from './OneCoinProps';
import OneNearAccount from './OneNearAccount';
import Recieve from './recieve';
import Send from './send';

const PREFIX = 'NearOneCoin';

const classes = {
  root: `${PREFIX}-root`,
  loading: `${PREFIX}-loading`,
  buttonNear: `${PREFIX}-buttonNear`,
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
  near: `${PREFIX}-near`,
  rootButtonWrapper: `${PREFIX}-rootButtonWrapper`,
  info: `${PREFIX}-info`
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
  [`& .${classes.buttonNear}`]: {
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
  [`& .${classes.near}`]: {
    marginBottom: 5
  },
  [`& .${classes.rootButtonWrapper}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTop: `1px solid rgba(33, 40, 35, 1)`
  },
  [`& .${classes.info}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '0.9rem',
    color: theme.palette.secondary.main,
    background: theme.palette.primary.light,
    padding: '10px 0px'
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

const NearOneCoin: React.FC<NearOneCoinProps> = ({
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
  const theme = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const sync = useSync();
  const snackbar = useSnackbar();

  const { selectedWallet } = useSelectedWallet();

  const { coinDetails } = useCurrentCoin();

  const { beforeNetworkAction } = useConnection();

  const {
    customAccountData: accountData,
    setCurrentWalletId,
    setCurrentCoin
  } = useCustomAccount();

  const implicitAccount = generateNearAddressFromXpub(coinDetails.xpub);

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
    await deleteCoin(coinDetails.xpub, coinDetails.slug, walletId);
    await deleteHistory(coinDetails);
  };

  const [sendForm, setSendForm] = useState(false);
  const [addAccountForm, setAddAccountForm] = useState(false);

  const sendTransaction = useSendTransaction();

  const handleSendFormOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeAction() && beforeNetworkAction() && !isEmpty) setSendForm(true);
  };

  const handleAddAccountFormOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeAction() && beforeNetworkAction() && !isEmpty)
      setAddAccountForm(true);
  };

  const [receiveForm, setReceiveForm] = useState(false);

  const receiveTransaction = useReceiveTransaction();

  const handleReceiveFormOpen = (e: React.MouseEvent) => {
    prevent(e);
    if (beforeAction() && beforeNetworkAction()) setReceiveForm(true);
  };

  const [collapseTab, setCollapseTab] = React.useState(false);

  const lengthThreshold = 1; // number of custom account to not show the collapse tab
  const maxAccountThreshold = 4; // max number of custom account allowed

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
    setCurrentCoin(coinDetails.slug);
  }, [selectedWallet._id]);

  useEffect(() => {
    setCollapseTab(false);
  }, [selectedWallet._id]);

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

      <SendTransactionContext.Provider
        value={{
          sendForm: addAccountForm,
          setSendForm: setAddAccountForm,
          sendTransaction
        }}
      >
        <AddAccount />
      </SendTransactionContext.Provider>

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
        <Grid container className={classes.near}>
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
            {!(accountData.length > lengthThreshold) ? (
              <>
                <Button
                  variant="text"
                  className={
                    !isEmpty ? clsx(classes.orange) : clsx(classes.grey)
                  }
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
              </>
            ) : (
              <></>
            )}
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
          {accountData.length > lengthThreshold ? (
            <Grid
              container
              className={clsx({
                [classes.loading]: isLoading
              })}
            >
              <Grid item xs={12}>
                <Collapse in={collapseTab} timeout="auto" unmountOnExit>
                  {accountData
                    .slice(0, maxAccountThreshold + lengthThreshold)
                    .map(account => {
                      return (
                        <React.Fragment key={account.name}>
                          {account.name === implicitAccount && (
                            <OneNearAccount
                              initial={coinDetails.slug.toUpperCase()}
                              name={account.name}
                              holding={account.displayBalance}
                              price={account.displayPrice}
                              decimal={24}
                              value={account.displayValue}
                              isEmpty={account.isEmpty}
                              walletId={walletId}
                            />
                          )}
                          <CustomAccountContext.Provider
                            value={{ customAccount: account }}
                          >
                            {account.name === implicitAccount || (
                              <OneNearAccount
                                initial={coinDetails.slug.toUpperCase()}
                                name={account.name}
                                holding={account.displayBalance}
                                price={account.displayPrice}
                                decimal={24}
                                value={account.displayValue}
                                isEmpty={account.isEmpty}
                                walletId={walletId}
                              />
                            )}
                          </CustomAccountContext.Provider>
                        </React.Fragment>
                      );
                    })}
                  {accountData.length <
                  maxAccountThreshold + lengthThreshold ? (
                    <CoinCardBtn
                      onClick={handleAddAccountFormOpen}
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
                      ADD ACCOUNT
                    </CoinCardBtn>
                  ) : accountData.length ===
                    maxAccountThreshold + lengthThreshold ? (
                    <></>
                  ) : (
                    <Typography className={classes.info}>
                      <Icon
                        size={40}
                        viewBox=" 0 0 30 50"
                        iconGroup={<WarningExclamation />}
                      />
                      Displaying top {maxAccountThreshold} accounts with most
                      balance
                    </Typography>
                  )}
                </Collapse>
              </Grid>
              <Grid item xs={12} className={classes.rootButtonWrapper}>
                <CoinCardBtn
                  onClick={(e: React.MouseEvent) => {
                    prevent(e);
                    setCollapseTab(!collapseTab);
                  }}
                  disabled={isLoading}
                  fullWidth
                  style={{
                    borderRadius: '0 0 5px 5px'
                  }}
                >
                  {collapseTab ? 'Hide Accounts' : 'Show Accounts'}
                  {collapseTab ? <ExpandLess /> : <ExpandMore />}
                </CoinCardBtn>
              </Grid>
            </Grid>
          ) : (
            <Grid
              item
              xs={12}
              className={clsx({
                [classes.rootButtonWrapper]: true,
                [classes.loading]: isLoading
              })}
            >
              <CoinCardBtn
                onClick={handleAddAccountFormOpen}
                fullWidth
                startIcon={<AddCircleIcon />}
                style={{
                  borderRadius: '0',
                  borderTop: '1px solid #222',
                  padding: '6px'
                }}
                disabled={isLoading || parseFloat(holding) < 0.2}
                disableRipple
              >
                ADD ACCOUNT
              </CoinCardBtn>
            </Grid>
          )}
        </>
      }
    </Root>
  );
};

NearOneCoin.propTypes = NearOneCoinPropTypes;

export default NearOneCoin;
