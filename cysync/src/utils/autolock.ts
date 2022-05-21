export const getAutoSleepLock = () => {
  return Boolean(localStorage.getItem('autoSleepLock'));
};
export const setAutoSleepLock = (flag: boolean) => {
  localStorage.setItem('autoSleepLock', flag.toString());
};
