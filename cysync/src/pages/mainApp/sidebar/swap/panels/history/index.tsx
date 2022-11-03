import { COINS } from '@cypherock/communication';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Grid, Typography } from '@mui/material';
import React, { useEffect } from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import colors from '../../../../../../designSystem/designConstants/colors';
import CoinIcons from '../../../../../../designSystem/genericComponents/coinIcons';
import Download from '../../../../../../designSystem/iconGroups/download';
import Swap from '../../../../../../designSystem/iconGroups/swap';
import { useExchange } from '../../../../../../store/hooks';

type HistoryItem = {
  date: string;
  txns: Array<{
    id: string;
    time: string;
    fromToken: string;
    toToken: string;
    amount: string;
    fees: string;
    status: string;
  }>;
};

type historyPanelProps = {
  walletId: string;
};

const HistoryPanel: React.FC<historyPanelProps> = ({ walletId }) => {
  const { getSwapTransactions } = useExchange();

  const [historyItems, setHistoryItems] = React.useState<HistoryItem[]>([]);

  useEffect(() => {
    const getTransactions = async () => {
      const transactions = await getSwapTransactions(walletId);
      /* tslint:disable-next-line */
      transactions.forEach((transaction: any) => {
        const createdAt = new Date(transaction.createdAt * 1000);
        const date = createdAt.toLocaleDateString();
        const time = createdAt.toLocaleTimeString();
        const newTxn = {
          id: transaction.id,
          time,
          fromToken: transaction.currencyFrom,
          toToken: transaction.currencyTo,
          amount: transaction.amountExpectedFrom,
          fees: transaction.changellyFee,
          status: transaction.status
        };
        setHistoryItems(prev => {
          const index = prev.findIndex(item => item.date === date);
          if (index === -1) {
            return [
              ...prev,
              {
                date,
                txns: [newTxn]
              }
            ];
          } else {
            const newTxns = [...prev[index].txns, newTxn];
            return [
              ...prev.slice(0, index),
              {
                date,
                txns: newTxns
              },
              ...prev.slice(index + 1)
            ];
          }
        });
      });
    };
    getTransactions();
  }, []);

  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography
          variant="body1"
          sx={{ color: 'secondary.dark' }}
          textAlign={'right'}
        >
          <Download />
          &nbsp; Export operations
        </Typography>
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
        <Grid container marginTop={'40px'}>
          {historyItems.map((item, index) => (
            <Grid item xs={12} key={index} marginTop={'20px'}>
              <Typography variant="body1" color="textSecondary">
                {item.date}
              </Typography>
              {item.txns.map(txn => (
                <Grid key={txn.id} item xs={12} marginTop={'20px'}>
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
                            initial={txn.fromToken.toUpperCase()}
                            style={{ marginRight: '10px' }}
                          />
                          <Typography variant="body1" color="textPrimary">
                            {COINS[txn.fromToken]?.name}
                          </Typography>
                        </Grid>
                        <Grid
                          item
                          display={'flex'}
                          alignContent={'center'}
                          alignItems={'center'}
                          marginLeft={'5px'}
                        >
                          <ArrowForwardIcon sx={{ color: 'text.secondary' }} />
                        </Grid>
                        <Grid
                          item
                          display={'flex'}
                          alignContent={'center'}
                          alignItems={'center'}
                        >
                          <CoinIcons
                            initial={txn.toToken.toUpperCase()}
                            style={{ marginRight: '10px' }}
                          />
                          <Typography variant="body1" color="textPrimary">
                            {COINS[txn.toToken]?.name}
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
                          <Typography variant="body1" sx={{ color: '#16953A' }}>
                            +{txn.amount}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            -{txn.fees} {txn.fromToken.toUpperCase()}
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
  );
};

export default HistoryPanel;
