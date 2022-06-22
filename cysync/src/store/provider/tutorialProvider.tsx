import { tutorial as tutorialServer } from '@cypherock/server-wrapper';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { version } from '../../../package.json';
import { ErrorObject } from '../../constants/i18n';
import ErrorDialog from '../../designSystem/designComponents/dialog/errorDialog';
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
  errorObj: ErrorObject;
}

export const TutorialContext: React.Context<TutorialContextInterface> =
  React.createContext<TutorialContextInterface>({} as TutorialContextInterface);

export const TutorialProvider: React.FC = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tutorials, setTutorials] = useState<
    TutorialContextInterface['tutorials']
  >([]);
  const [isFetched, setIsFetched] = useState(false);
  const [errorObj, setErrorObj] = useState<ErrorObject>(undefined);

  const { langStrings } = useI18n();

  const getAll = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorObj(undefined);

    try {
      const res = await tutorialServer.getAll(version).request();
      if (res.data && res.data.tutorials) {
        setTutorials(res.data.tutorials);
        setIsFetched(true);
      } else {
        throw new Error('Cannot find tutorials.');
      }
    } catch (error) {
      logger.error(error);

      if (error.isAxiosError) {
        if (error.response) {
          setErrorObj(langStrings.ERRORS.NETWORK_ERROR);
        } else {
          setErrorObj(langStrings.ERRORS.NETWORK_UNREACHABLE);
        }
      } else {
        setErrorObj(
          langStrings.ERRORS.UNKNOWN_INTERNAL_ERROR(
            'Some internal error occurred while fetching the tutorials.'
          )
        );
      }
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
        open={!!errorObj}
        handleClose={() => setErrorObj(undefined)}
        error={errorObj}
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
