import { ERC20TOKENS } from '@cypherock/communication';

export interface IInitialToken {
  abbr: string;
  name: string;
}

const initialTokens: IInitialToken[] = [];
for (const [key, value] of Object.entries(ERC20TOKENS)) {
  if (value) {
    const tempCoin: IInitialToken = { abbr: key, name: value.name };
    initialTokens.push(tempCoin);
  }
}

export default initialTokens.sort((a, b) => {
  return a.name.localeCompare(b.name);
});
