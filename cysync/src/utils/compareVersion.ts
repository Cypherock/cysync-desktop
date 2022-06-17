import compareVersions from 'compare-versions';

export const hexToVersion = (hex: string) => {
  if (hex)
    return `${parseInt(hex.slice(0, 2), 16)}.${parseInt(
      hex.slice(2, 4),
      16
    )}.${parseInt(hex.slice(4, 8), 16)}`;
};

export const compareVersion = (version: string, isGreaterThan: string) => {
  return compareVersions.compare(version, isGreaterThan, '>');
};

export const getFirmwareHex = (firmware: string) => {
  let hex = '';
  const firmwareList = firmware.split('.');
  if (firmwareList.length < 3) {
    throw new Error('Invalid firmware version');
  }

  hex += parseInt(firmwareList[0], 10).toString(16).padStart(2, '0');

  hex += parseInt(firmwareList[1], 10).toString(16).padStart(2, '0');

  hex += parseInt(firmwareList[2], 10).toString(16).padStart(4, '0');

  return hex;
};

// Code changed after shipping to user, so old and new both conditions should work.
export const inTestApp = (deviceState?: string) => {
  return !!(deviceState && deviceState === '01');
};

export const inApplication = (firmware: string, inBootloader: boolean) => {
  return !(inTestApp(firmware) || inBootloader);
};
