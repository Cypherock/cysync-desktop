import { tutorial as tutorialServer } from '@cypherock/server-wrapper';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { version } from '../../../package.json';
import ErrorDialog from '../../designSystem/designComponents/dialog/errorDialog';
import {
  CyError,
  CyError,
  CysyncError,
  handleAxiosErrors,
  handleErrors
} from '../../errors';
import logger from '../../utils/logger';

import { useI18n } from './i18nProvider';

export interface Tutorial {
  _id: string;
  title: string;
  description: string;
  link: string;
  createdAt: string;
  updatedAt: string;
}

export interface TutorialContextInterface {
  tutorials: Tutorial[];
  isLoading: boolean;
  isFetched: boolean;
  getAll: () => void;
  errorObj: CyError;
}

export const TutorialContext: React.Context<TutorialContextInterface> =
  React.createContext<TutorialContextInterface>({} as TutorialContextInterface);

export const TutorialProvider: React.FC = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tutorials, setTutorials] = useState<
    TutorialContextInterface['tutorials']
  >([]);
  const [isFetched, setIsFetched] = useState(false);
  const [errorObj, setErrorObj] = useState<CyError>(new CyError());
  const { langStrings } = useI18n();

  const getAll = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorObj(new CyError());

    try {
      const res = await tutorialServer.getAll(version).request();
      if (res.data && res.data.tutorials) {
        setTutorials(res.data.tutorials);
        setIsFetched(true);
      } else {
        throw new Error('Cannot find tutorials.');
      }
    } catch (error) {
      const cyError = new CyError();
      if (error.isAxiosError) {
        handleAxiosErrors(cyError, error, langStrings);
      } else {
        cyError.setError(
          CysyncError.CUSTOM_ERROR,
          langStrings.ERRORS.CUSTOM_ERROR('fetching the tutorials.')
        );
      }
      setErrorObj(handleErrors(errorObj, cyError, _, error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        tutorials,
        isLoading,
        isFetched,
        getAll,
        errorObj
      }}
    >
      <ErrorDialog
        open={errorObj.isSet}
        handleClose={() => setErrorObj(new CyError())}
        text={errorObj.showError()}
        actionText="Retry"
        handleAction={() => getAll()}
        flow="Fetching Tutorials"
      />
      {children}
    </TutorialContext.Provider>
  );
};

TutorialProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useTutorial(): TutorialContextInterface {
  return React.useContext(TutorialContext);
}
