import { AccountType, COINS } from '@cypherock/communication';

export interface AddableAccountDetails {
  id: string;
  name: string;
  isSelected: boolean;
  coinListId: number;
  supportedVersions: number[];
  accountType?: AccountType;
}

const initialCoins: AddableAccountDetails[] = [];

for (const [key, value] of Object.entries(COINS)) {
  const tempCoin = {
    id: key,
    name: value.name,
    isSelected: false,
    coinListId: value.coinListId,
    supportedVersions: value.supportedVersions
  };

  if (value.supportedAccountTypes && value.supportedAccountTypes.length !== 0) {
    for (const accountType of value.supportedAccountTypes) {
      initialCoins.push({ ...tempCoin, accountType });
    }
  } else {
    initialCoins.push(tempCoin);
  }
}

export default initialCoins.sort((a, b) => {
  if (a.name > b.name) return 1;
  if (a.name < b.name) return -1;
  return 0;
});
