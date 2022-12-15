import { Grid, styled, Typography } from '@mui/material';
import fs from 'fs/promises';
import path from 'path';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import pkg from '../../../package.json';
import CustomButton from '../../designSystem/designComponents/buttons/button';
import DialogBox from '../../designSystem/designComponents/dialog/dialogBox';
import logger from '../../utils/logger';

const PREFIX = 'ReleaseNotesContext';

const classes = {
  content: `${PREFIX}-content`,
  btnContainer: `${PREFIX}-btnContainer`
};

const Root = styled(Grid)(() => ({
  '& h1': {
    fontSize: '20px',
    color: '#e4e1de',
    fontWeight: 'normal',
    marginTop: '30px',
    textAlign: 'center',
    '&:first-child': {
      marginTop: '13px'
    }
  },
  '& h3': {
    fontSize: '16px',
    color: '#e4e1de',
    margin: '4px 0',
    fontWeight: 'normal'
  },
  '& ul': {
    margin: '8px 0'
  },
  '& p': {
    fontSize: '14px',
    color: '#999999'
  },
  [`& .${classes.content}`]: {
    maxHeight: '450px',
    overflowY: 'auto',
    padding: '0 45px',

    background: `linear-gradient(
      #02020233 30%,
      rgba(255, 255, 255, 0)
    ) center top,linear-gradient(
      rgba(255, 255, 255, 0), 
      #02020233 70%
    ) center bottom,radial-gradient(
      farthest-side at 50% 0,
      rgba(0, 0, 0, 0),
      rgba(0, 0, 0, 0)
    ) center top,radial-gradient(
      farthest-side at 50% 100%,
      rgba(0, 0, 0, 0.2),
      rgba(0, 0, 0, 0)
    ) center bottom`,

    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 30px, 100% 30px, 100% 14px, 100% 14px',
    backgroundAttachment: 'local, local, scroll, scroll'
  },
  [`& .${classes.btnContainer}`]: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '0 45px'
  }
}));

export interface ReleaseNotesContextInterface {
  showReleaseNotes: () => void;
}

export const ReleaseNotesContext: React.Context<ReleaseNotesContextInterface> =
  React.createContext<ReleaseNotesContextInterface>(
    {} as ReleaseNotesContextInterface
  );

export const ReleaseNotesProvider: React.FC = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');

  const readFile = async () => {
    try {
      const releaseNotes = await fs.readFile(
        path.join(__dirname, '..', '..', '..', 'RELEASE_NOTES.md')
      );
      setContent(releaseNotes.toString());
      showReleaseNotesOnFirstBoot();
    } catch (error) {
      logger.error(error);
    }
  };

  useEffect(() => {
    readFile();
  }, []);

  const showReleaseNotesOnFirstBoot = () => {
    const prevVersion = localStorage.getItem('latestVersion');
    const currentVersion = pkg.version;
    if (prevVersion !== currentVersion) {
      showReleaseNotes();
      localStorage.setItem('latestVersion', currentVersion);
    }
  };

  const onClose = () => {
    setIsOpen(false);
  };

  const showReleaseNotes = () => {
    setIsOpen(true);
  };

  return (
    <>
      <DialogBox
        fullWidth
        maxWidth="xs"
        isClosePresent
        open={isOpen}
        handleClose={onClose}
        dialogHeading="Release Notes"
        restComponents={
          <Root container>
            <Grid item xs={12} className={classes.content}>
              <Typography>
                <ReactMarkdown children={content} />
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <div className={classes.btnContainer} style={{}}>
                <CustomButton
                  onClick={onClose}
                  style={{
                    padding: '0.5rem 3rem',
                    margin: '0.5rem',
                    color: '#FFFFFF'
                  }}
                  autoFocus
                >
                  Ok
                </CustomButton>
              </div>
            </Grid>
          </Root>
        }
      />
      <ReleaseNotesContext.Provider
        value={{
          showReleaseNotes
        }}
      >
        {children}
      </ReleaseNotesContext.Provider>
    </>
  );
};

ReleaseNotesProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useReleaseNotes(): ReleaseNotesContextInterface {
  return React.useContext(ReleaseNotesContext);
}
