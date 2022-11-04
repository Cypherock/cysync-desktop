import { Wallet } from '@cypherock/database';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import React, { useEffect, useState } from 'react';

import { useWalletData } from '../../../../store/hooks';
import { useWallets } from '../../../../store/provider';

import ExchangePanel from './panels/exchange';
import HistoryPanel from './panels/history';
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function HorizontalTabs() {
  const [value, setValue] = useState(1);

  const { allWallets, isLoading: isWalletLoading } = useWallets();

  // By default selecting the first wallet
  useEffect(() => {
    if (!currentWalletId && !isWalletLoading) {
      setCurrentWalletId(allWallets[0]._id);
    }
  }, [isWalletLoading, allWallets]);

  const { coinData, setCurrentWalletId, currentWalletId } = useWalletData();

  // TODO: Remove hardcoded wallet id with the selected wallet id

  const [currentWalletDetails, setCurrentWalletDetails] =
    useState<Wallet | null>(null);

  useEffect(() => {
    if (isWalletLoading) return;

    const wallet = allWallets.find(elem => elem._id === currentWalletId);
    if (wallet) {
      setCurrentWalletDetails(wallet);
    }
  }, [currentWalletId, isWalletLoading]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <Box sx={{ width: '100%' }}>
      <Box>
        <Tabs
          value={value}
          onChange={handleChange}
          textColor="secondary"
          indicatorColor="secondary"
          aria-label="basic tabs example"
        >
          <Tab label="Exchange" />
          <Tab label="History" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <ExchangePanel
          coinData={coinData}
          currentWalletDetails={currentWalletDetails}
        />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <HistoryPanel walletId={currentWalletId} />
      </TabPanel>
    </Box>
  );
}
