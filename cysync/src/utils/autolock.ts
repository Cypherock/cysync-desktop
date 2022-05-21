export const getAutoLock = () => {
  return Boolean(localStorage.getItem('autoLock'));
};
export const setAutoLock = (flag: boolean) => {
  localStorage.setItem('autoLock', flag.toString());
};
