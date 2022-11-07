export const checkCoinSupport = (
  deviceList: Array<{ id: number; version: number }>,
  desktopData: { id: number; versions: number[] }
) => {
  for (const item of deviceList) {
    if (
      item.id === desktopData.id &&
      desktopData.versions.includes(item.version)
    )
      return true;
  }
  return false;
};
