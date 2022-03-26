import { ERC20TOKENS } from '@cypherock/communication';

const initialTokens: Array<Array<string | boolean>> = [];
for (const [key, value] of Object.entries(ERC20TOKENS)) {
  if (value) {
    const tempCoin = [key, value.name, false];
    initialTokens.push(tempCoin);
  }
}

export default initialTokens.sort((a, b) => {
  if (a[1] > b[1]) return 1;
  if (a[1] < b[1]) return -1;
  return 0;
});
