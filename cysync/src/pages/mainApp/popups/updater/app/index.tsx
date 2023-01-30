import React from 'react';

import { useUpdater } from '../../../../../store/provider';

import PersistentInfo from './persistent';

const Updater = () => {
  const {
    appState,
    isPersistentAppOpen,
    appUpdateVersion,
    downloadUpdate,
    installUpdate
  } = useUpdater();

  return (
    <>
      <PersistentInfo
        show={isPersistentAppOpen}
        state={appState}
        downloadUpdate={downloadUpdate}
        installUpdate={installUpdate}
        version={appUpdateVersion}
      />
    </>
  );
};

export default Updater;
