import { COINS } from '@cypherock/communication';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Button, Grid, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import DropMenu from '../../../../../../designSystem/designComponents/menu/DropMenu';
import colors from '../../../../../../designSystem/designConstants/colors';
import CoinIcons from '../../../../../../designSystem/genericComponents/coinIcons';
import Download from '../../../../../../designSystem/iconGroups/download';
import Swap from '../../../../../../designSystem/iconGroups/swap';
import { useExchange } from '../../../../../../store/hooks';
import { useWallets } from '../../../../../../store/provider';
import csvDownloader from '../../../../../../utils/csvDownloader';

import ExchangeProgress from './dialogs/ExchangeProgress';

type HistoryItem = {
  date: string;
  txns: Array<{
    id: string;
    time: string;
    currencyFrom: string;
    currencyTo: string;
    amount: string;
    fees: string;
    status: string;
  }>;
};

// tslint:disable-next-line: no-any
const formatRawTransactions = (rawTransactions: any[], columns: string[]) => {
  const formattedRawTransactions = rawTransactions.map(
    // tslint:disable-next-line: no-any
    (rawTransaction: any) => {
      const txn: {
        [key in string]: string | number | null;
      } = {};
      columns.forEach(key => (txn[key] = rawTransaction[key]));
      return txn;
    }
  );

  const headers: { [key in string]: string } = {};
  columns.forEach(key => (headers[key] = key));

  formattedRawTransactions.unshift(headers);
  return formattedRawTransactions;
};

const groupTransactionsByDate = (
  transactions: Array<{
    date: string;
    walletId: string;
    id: string;
    time: string;
    currencyFrom: string;
    currencyTo: string;
    amountExpectedFrom: string;
    changellyFee: string;
    status: string;
  }>
) => {
  const groupedTransactions: HistoryItem[] = [];
  transactions.forEach(transaction => {
    const date = transaction.date;
    const newTxn = {
      id: transaction.id,
      time: transaction.time,
      currencyFrom: transaction.currencyFrom,
      currencyTo: transaction.currencyTo,
      amount: transaction.amountExpectedFrom,
      fees: transaction.changellyFee,
      status: transaction.status
    };
    const index = groupedTransactions.findIndex(
      groupedTransaction => groupedTransaction.date === date
    );

    if (index === -1) {
      groupedTransactions.push({
        date,
        txns: [newTxn]
      });
    } else {
      groupedTransactions[index].txns.push(newTxn);
    }
  });
  return groupedTransactions;
};

const HistoryPanel = () => {
  const { allWallets, isLoading } = useWallets();
  const { getSwapTransactions } = useExchange();
  const [rawTransactions, setRawTransactions] = useState([]);
  const [selectedWalletIndex, setSelectedWalletIndex] = useState(0);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [transactionProgress, setTransactionProgress] = useState(0);
  const [isExchangeProgressOpen, setIsExchangeProgressOpen] =
    useState<boolean>(false);

  useEffect(() => {
    const getTransactions = async (walletIds: string[]) => {
      // tslint:disable-next-line: no-any
      const txns: any[] = [];
      for (const walletId of walletIds) {
        const transactions = await getSwapTransactions(walletId);
        /* tslint:disable-next-line */
        const newTxns = transactions.map(
          ({ createdAt, ...transaction }: any) => {
            const txnCreatedAt = new Date(createdAt * 1000);
            const date = txnCreatedAt.toLocaleDateString();
            const time = txnCreatedAt.toLocaleTimeString();
            return {
              date,
              time,
              ...transaction
            };
          }
        );
        txns.push(...newTxns);
      }
      setRawTransactions(txns);
      setHistoryItems(groupTransactionsByDate(txns));
    };

    if (isLoading) return;

    if (selectedWalletIndex === 0)
      getTransactions(allWallets.map(wallet => wallet._id));
    else getTransactions([allWallets[selectedWalletIndex - 1]._id]);
  }, [isLoading, allWallets, selectedWalletIndex]);

  const handleWalletChange = (selectedIndex: number) => {
    setSelectedWalletIndex(selectedIndex);
  };

  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <Grid
            container
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Grid item>
              {allWallets[0].name !== '' && (
                <DropMenu
                  options={[
                    'All Wallets',
                    ...allWallets.map(wallet => wallet.name)
                  ]}
                  handleMenuItemSelectionChange={handleWalletChange}
                  index={selectedWalletIndex}
                  bg={false}
                  style={{ marginRight: '10px' }}
                />
              )}
            </Grid>
            <Grid item>
              <Typography
                variant="body1"
                sx={{
                  color: 'secondary.dark'
                }}
                textAlign={'right'}
              >
                <Button
                  startIcon={<Download />}
                  color="secondary"
                  onClick={() => {
                    csvDownloader(
                      formatRawTransactions(rawTransactions, [
                        'id',
                        'createdAt',
                        'moneyReceived',
                        'moneySent',
                        'rate',
                        'status',
                        'currencyFrom',
                        'currencyTo',
                        'payinAddress',
                        'payoutAddress',
                        'amountExpectedFrom',
                        'amountExpectedTo',
                        'networkFee',
                        'changellyFee'
                      ]),
                      `CySync-Swap-History-${new Date().toLocaleDateString()}.csv`
                    );
                  }}
                  sx={{
                    borderRadius: '40px',
                    padding: '10px 20px'
                  }}
                >
                  {/* <Download /> */}
                  &nbsp; Export operations
                </Button>
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid
          item
          xs={12}
          sx={{
            marginTop: '13px',
            padding: '12px 0px 12px 12px',
            alignItems: 'center',
            background: '#1C1F22',
            display: 'flex'
          }}
        >
          <Icon
            size={20}
            viewBox="0 0 30 30"
            iconGroup={<InfoOutlinedIcon color="secondary" />}
          />
          <Typography variant="body1" sx={{ color: 'secondary.dark' }}>
            Your swap desktop transactions are not synchronized with the Ledger
            Live mobile application
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Grid
            container
            marginTop={'40px'}
            sx={{ maxHeight: '45vh', overflow: 'auto' }}
          >
            {historyItems.map((item, index) => (
              <Grid
                item
                xs={12}
                key={index}
                marginTop={'20px'}
                sx={{ cursor: 'pointer' }}
              >
                <Typography variant="body1" color="textSecondary">
                  {item.date}
                </Typography>
                {item.txns.map(txn => (
                  <Grid
                    key={txn.id}
                    item
                    xs={12}
                    marginTop={'20px'}
                    onClick={() => {
                      // Possible Changelly status from:
                      // https://github.com/changelly/api-changelly#getting-exchange-status
                      switch (txn.status) {
                        case 'finished':
                          setTransactionProgress(2);
                          break;
                        case 'sending' || 'exchanging':
                          setTransactionProgress(3);
                          break;
                        default:
                          setTransactionProgress(0);
                      }
                      setIsExchangeProgressOpen(true);
                    }}
                  >
                    <Grid
                      container
                      display={'flex'}
                      justifyContent="space-around"
                      sx={{
                        border: '0.5px solid #433F3B',
                        borderRadius: '10px',
                        padding: '9px 17px 8px'
                      }}
                    >
                      <Grid
                        item
                        xs={3}
                        display="flex"
                        alignContent={'center'}
                        alignItems={'center'}
                      >
                        <Icon
                          size={20}
                          viewBox="0 0 16 15"
                          iconGroup={<Swap color={colors.text.secondary} />}
                        />
                        <Grid item>
                          <Typography variant="body1" color="textPrimary">
                            Changelly
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {txn.time}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Grid
                        item
                        xs={6}
                        display="flex"
                        alignContent={'center'}
                        alignItems={'center'}
                      >
                        <Grid
                          container
                          display={'flex'}
                          justifyContent={'space-around'}
                        >
                          <Grid
                            item
                            display={'flex'}
                            alignContent={'center'}
                            alignItems={'center'}
                          >
                            <CoinIcons
                              initial={txn.currencyFrom.toUpperCase()}
                              style={{ marginRight: '10px' }}
                            />
                            <Typography variant="body1" color="textPrimary">
                              {COINS[txn.currencyFrom]?.name}
                            </Typography>
                          </Grid>
                          <Grid
                            item
                            display={'flex'}
                            alignContent={'center'}
                            alignItems={'center'}
                            marginLeft={'5px'}
                          >
                            <ArrowForwardIcon
                              sx={{ color: 'text.secondary' }}
                            />
                          </Grid>
                          <Grid
                            item
                            display={'flex'}
                            alignContent={'center'}
                            alignItems={'center'}
                          >
                            <CoinIcons
                              initial={txn.currencyTo.toUpperCase()}
                              style={{ marginRight: '10px' }}
                            />
                            <Typography variant="body1" color="textPrimary">
                              {COINS[txn.currencyTo]?.name}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid item xs={3}>
                        <Grid
                          container
                          display={'flex'}
                          justifyContent={'flex-end'}
                        >
                          <Grid item textAlign={'right'}>
                            <Typography
                              variant="body1"
                              sx={{ color: '#16953A' }}
                            >
                              +{txn.amount}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              -{txn.fees} {txn.currencyFrom.toUpperCase()}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                ))}
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
      <ExchangeProgress
        open={isExchangeProgressOpen}
        onClose={() => setIsExchangeProgressOpen(false)}
        progress={transactionProgress}
      />
    </>
  );
};

export default HistoryPanel;
