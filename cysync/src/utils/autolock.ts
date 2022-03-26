export const autolockOptions = ['Never', '15 Minutes', '30 Minutes', '1 Hour'];
export const autolockOptionsInMin = [-1, 15, 30, 60];

export const getAutolockIndex = () => {
  const index = Number(localStorage.getItem('autolockIndex'));

  if (Number.isNaN(index) || index > autolockOptions.length - 1) return 0;

  return index;
};

export const getAutolockTime = () => {
  const index = getAutolockIndex();

  if (index === 0) return -1;

  return autolockOptionsInMin[index] * 60 * 1000;
};

export const setAutolockIndex = (index: number) => {
  localStorage.setItem('autolockIndex', index.toString());
};
