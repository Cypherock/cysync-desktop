import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Grid, Typography } from '@mui/material';
import React from 'react';

import Icon from '../../../../../designSystem/designComponents/icons/Icon';
import colors from '../../../../../designSystem/designConstants/colors';
import Btc from '../../../../../designSystem/iconGroups/btc';
import Download from '../../../../../designSystem/iconGroups/download';
import Eth from '../../../../../designSystem/iconGroups/eth';
import Swap from '../../../../../designSystem/iconGroups/swap';

export default function HistoryPanel() {
  type HistoryItem = {
    date: string;
    from: {
      wallet: string;
      icon: JSX.Element;
    };
    to: {
      wallet: string;
      icon: JSX.Element;
    };
    amount: number;
    fees: number;
    time: string;
    service: string;
  };

  const history: HistoryItem[] = [
    {
      date: '15/11/2022 - Today',
      from: {
        wallet: 'Ethereum 1',
        icon: <Eth />
      },
      to: {
        wallet: 'Bitcoin 1',
        icon: <Btc />
      },
      amount: 0.0001,
      fees: 0.0001,
      time: '12:00',
      service: 'Changelly'
    },
    {
      date: '15/11/2022 - Today',
      from: {
        wallet: 'Ethereum 1',
        icon: <Eth />
      },
      to: {
        wallet: 'Bitcoin 1',
        icon: <Btc />
      },
      amount: 0.0001,
      fees: 0.0001,
      time: '12:00',
      service: 'Changelly'
    }
  ];

  return (
    <Grid container xs={12}>
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
          {history.map((item, index) => (
            <Grid item xs={12} key={index} marginTop={'20px'}>
              <Typography variant="body1" color="textSecondary">
                {item.date}
              </Typography>
              <Grid item xs={12} marginTop={'20px'}>
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
                        {item.service}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.time}
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
                        <Icon
                          size={35}
                          viewBox="0 0 30 30"
                          iconGroup={item.from.icon}
                        />
                        <Typography variant="body1" color="textPrimary">
                          {item.from.wallet}
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
                        <Icon
                          size={35}
                          viewBox="0 0 30 30"
                          iconGroup={item.to.icon}
                        />
                        <Typography variant="body1" color="textPrimary">
                          {item.to.wallet}
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
                          +{item.amount}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          -{item.fees} ETH
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );
}
