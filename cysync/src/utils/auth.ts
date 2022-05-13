import bcrypt from 'bcrypt';
import crypto from 'crypto';

// import { coinDb } from '../store/database';

export const bcryptPass = async (pass: string): Promise<string> => {
  return bcrypt.hash(pass, 16);
};

export const checkPassword = (password: string): string => {
  if (!password) {
    return "Password Can't be Empty";
  }
  if (password.length < 8) {
    return 'Password should be of atleast 8 characters.';
  }
  if (password.search(/[a-z]/) === -1) {
    return 'Password should conatain both lower & upper case characters.';
  }
  if (password.search(/[A-Z]/) === -1) {
    return 'Password should conatain both lower & upper case characters.';
  }
  if (password.search(/[:;<>`~.,'"@!#$%^&*()_\-+=|[\]{}?\\/]/) === -1) {
    return 'Password should conatain atleast 1 special character.';
  }

  return '';
};

export const passwordExists = (): boolean => {
  const pass = localStorage.getItem('passwordHash');
  return pass && pass !== 'null';
};

export const getPasswordHash = () => {
  return localStorage.getItem('passwordHash');
};

export const removePassword = (): void => {
  localStorage.setItem('passwordHash', 'null');
};

export const setPasswordHash = (hash: string): void => {
  localStorage.setItem('passwordHash', hash);
};

/**
 * @param autoLockTime : is in minutes
 */
export const setAutoLockTime = (autoLockTime: number): void => {
  localStorage.setItem('autoLock', String(autoLockTime));
};

export const getAutoLockTime = (): number => {
  const time = localStorage.getItem('autoLock');
  if (time) return parseInt(time, 10);
  return 25 * 60 * 1000;
};

export const isFirstBoot = (): boolean => {
  return !localStorage.getItem('firstBoot');
};

export const completeFirstBoot = (): void => {
  localStorage.setItem('firstBoot', 'no');
};

export const resetDesktopApplication = (): void => {
  localStorage.clear();
  indexedDB.deleteDatabase('NeDB');
};

/**
 * @remarks SHALL/MUST be called after checking the previous hash.
 * @param singleHash
 */
export const passChangeEffect = async (singleHash: string) => {
  // if (singleHash) await coinDb.encryptSecrets(singleHash);
  // else await coinDb.decryptSecrets();
  console.log('passChangeEffect', singleHash);
};

export const generateSinglePasswordHash = (password: string) => {
  const singleHash = crypto.createHmac('sha256', password.trim()).digest('hex');

  return singleHash;
};

export const generatePasswordHash = async (password: string) => {
  const singleHash = generateSinglePasswordHash(password);
  return { doubleHash: await bcryptPass(singleHash), singleHash };
};

export const verifyPassword = async (password: string) => {
  const passwordHash = getPasswordHash();
  const hashOfInputPassword = generateSinglePasswordHash(password);
  return bcrypt.compare(hashOfInputPassword, passwordHash);
};

export const getDeviceVersion = () => {
  return localStorage.getItem('deviceVersion') || '0.0.0';
};

export const setDeviceVersion = (version: string) => {
  localStorage.setItem('deviceVersion', version);
};
