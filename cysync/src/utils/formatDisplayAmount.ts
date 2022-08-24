import BigNumber from 'bignumber.js';

/**
 * Used to format the display amount.
 *
 * If `isFixed` is true, then it'll return a string upto `precision` no of decimal places.
 * If `isFixed` is false, then it'll return a string which has `precision` no of significant digit.
 *
 * - Removes ending decimal zeroes
 * - Uses toPrecision or toFixed to round off
 */
const formatDisplayAmount = (
  amount: string | number | BigNumber,
  precision = 4,
  isFixed = false
) => {
  if (
    amount === '0' ||
    amount === 0 ||
    (typeof amount === 'object' && amount.toFixed() === '0')
  )
    return '0';

  let amountStr: string;

  if (isFixed) {
    amountStr = new BigNumber(amount).toFixed(precision, BigNumber.ROUND_FLOOR);
  } else {
    amountStr = new BigNumber(amount).toPrecision(
      precision,
      BigNumber.ROUND_FLOOR
    );
  }

  let expStr = '';
  let decimalAmountStr = amountStr.substring(0, amountStr.length);

  const eIndex = amountStr.indexOf('e');

  if (eIndex !== -1) {
    decimalAmountStr = amountStr.substring(0, eIndex);
    expStr = amountStr.substring(eIndex, amountStr.length);
  }

  const decimalArray = decimalAmountStr.split('.');
  let leftDecimalStr = '';
  let rightDecimalStr = '';

  [leftDecimalStr] = decimalArray;

  if (decimalArray.length > 1) {
    [, rightDecimalStr] = decimalArray;
  }

  let lastIndex = -1;

  for (let i = 0; i < rightDecimalStr.length; i += 1) {
    const digit = rightDecimalStr[i];

    if (digit !== '0') {
      lastIndex = i;
    }
  }

  if (lastIndex === -1) {
    const resp = leftDecimalStr + expStr;
    return resp;
  }

  const res = `${leftDecimalStr}${'.'}${rightDecimalStr.substring(
    0,
    lastIndex + 1
  )}${expStr}`;

  return res;
};

export default formatDisplayAmount;
