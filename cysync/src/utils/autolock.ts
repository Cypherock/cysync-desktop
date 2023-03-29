export const getAutoLock = () => {
  const storedAutoLock = localStorage.getItem('autoLock');
  if (storedAutoLock !== 'true') return false;
  return true;
};
export const setAutoLock = (flag: boolean) => {
  localStorage.setItem('autoLock', flag.toString());
};
