import { shell } from 'electron';
import React from 'react';

import DialogBox from '../../../../designSystem/designComponents/dialog/dialogBox';
import { useUpdater } from '../../../../store/provider';

import UpdateInfoComponent from './info';
import PersistentInfo from './persistent';

const Updater = () => {
  const {
    appState,
    isAppOpen,
    setIsAppOpen,
    isPersistentAppOpen,
    setIsPersistentAppOpen,
    appUpdateVersion
  } = useUpdater();

  const onAppUpdateClick = () => {
    shell.openExternal(`https://cypherock.com/gs`);
  };

  const getDialogComponent = () => {
    switch (appState) {
      case 1:
        return (
          <UpdateInfoComponent
            version={appUpdateVersion}
            onUpdate={onAppUpdateClick}
          />
        );
      default:
        return <></>;
    }
  };

  if (appState === 0 || appState === 4) {
    if (isPersistentAppOpen)
      return (
        <PersistentInfo
          state={appState}
          showPopup={() => setIsAppOpen(true)}
          close={() => setIsPersistentAppOpen(false)}
        />
      );
    return <> </>;
  }

  return (
    <>
      {isPersistentAppOpen ? (
        <PersistentInfo
          state={appState}
          showPopup={() => setIsAppOpen(true)}
          close={() => setIsPersistentAppOpen(false)}
        />
      ) : null}
      <DialogBox
        fullWidth
        maxWidth="md"
        open={isAppOpen}
        handleClose={() => setIsAppOpen(false)}
        isClosePresent
        restComponents={getDialogComponent()}
      />
    </>
  );
};

export default Updater;
