import { tutorial as tutorialServer } from '@cypherock/server-wrapper';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { version } from '../../../package.json';
import ErrorDialog from '../../designSystem/designComponents/dialog/errorDialog';
import logger from '../../utils/logger';

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
  errorMsg: string;
}

export const TutorialContext: React.Context<TutorialContextInterface> =
  React.createContext<TutorialContextInterface>({} as TutorialContextInterface);

export const TutorialProvider: React.FC = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tutorials, setTutorials] = useState<
    TutorialContextInterface['tutorials']
  >([]);
  const [isFetched, setIsFetched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getAll = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg('');

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
          setErrorMsg(
            'Some internal error occurred while communicating with the server. Please try again later.'
          );
        } else {
          setErrorMsg(
            'Failed to communicate with the server. Please check your internet connection and try again later.'
          );
        }
      } else {
        setErrorMsg(
          'Some internal error occurred while fetching the tutorials.'
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
        errorMsg
      }}
    >
      <ErrorDialog
        open={!!errorMsg}
        handleClose={() => setErrorMsg('')}
        text={errorMsg}
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
