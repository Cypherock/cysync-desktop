import { COINS } from '@cypherock/communication';

const initialCoins: Array<Array<string | boolean | number | number[]>> = [];
for (const [key, value] of Object.entries(COINS)) {
  const tempCoin = [
    key,
    value.name,
    false,
    value.coinListId,
    value.supportedVersions
  ];
  initialCoins.push(tempCoin);
}

export default initialCoins.sort((a, b) => {
  if (a[1] > b[1]) return 1;
  if (a[1] < b[1]) return -1;
  return 0;
});
