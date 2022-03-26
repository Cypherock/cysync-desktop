import NodeCache from 'node-cache';

export const mcache = new NodeCache();

// All portfolio cache key starts with PG, so that it can be deleted when required.
export const setPortfolioCache = (key: string, value: any) => {
  mcache.set(`PG-${key}`, value, 5 * 60);
};

export const getPortfolioCache = (key: string) => {
  return mcache.get(`PG-${key}`);
};

export const deleteAllPortfolioCache = () => {
  const allKeys = mcache.keys().filter(elem => elem.startsWith('PG'));
  if (allKeys.length !== 0) mcache.del(allKeys);
};
