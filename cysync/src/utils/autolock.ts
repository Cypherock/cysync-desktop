export const getAutoLock = () => {
  const storedAutoLock = localStorage.getItem('autoLock');
  if (storedAutoLock !== null) return Boolean(storedAutoLock);
  return true;
};
export const setAutoLock = (flag: boolean) => {
  localStorage.setItem('autoLock', flag.toString());
};
