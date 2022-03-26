import { ipcRenderer } from 'electron';

export const triggerClearData = () => {
  ipcRenderer.send('clear-data');
};
