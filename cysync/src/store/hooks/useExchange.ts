import axios from 'axios';
import { useEffect, useState } from 'react';

import { DisplayCoin } from './types';

const baseUrl = 'http://localhost:5000';

export const useExchange = () => {
  const [fromToken, setFromToken] = useState<DisplayCoin>();
  const [toToken, setToToken] = useState<DisplayCoin>();
  const [amountToSend, setAmountToSend] = useState('');
  const [fees, setFees] = useState('');
  const [amountToReceive, setAmountToReceive] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');

  const getCurrentExchangeRate = async () => {
    const { data } = await axios.get(`${baseUrl}/swap/exchangeDetails`, {
      params: { from: fromToken.slug, to: toToken.slug, amount: amountToSend }
    });
    setExchangeRate(data.message.result[0].rate);
    setFees(data.message.result[0].fee);
    setAmountToReceive(data.message.result[0].result);
  };

  useEffect(() => {
    if (fromToken && toToken && amountToSend) {
      getCurrentExchangeRate();
    }
  }, [fromToken, toToken, amountToSend]);

  const createSwapTransaction = async (receiveAddress: string) => {
    const { data } = await axios.get(`${baseUrl}/swap/transaction`, {
      params: {
        from: fromToken.slug,
        to: toToken.slug,
        amount: amountToSend,
        address: receiveAddress
      }
    });
    return {
      id: data.message.result.id,
      payinAddress: data.message.result.payinAddress
    };
  };

  return {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    amountToSend,
    setAmountToSend,
    exchangeRate,
    fees,
    amountToReceive,
    createSwapTransaction
  };
};
