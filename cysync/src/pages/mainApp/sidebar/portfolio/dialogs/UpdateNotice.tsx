import content from '!!html-loader!markdown-loader!../../../../../constants/markdown/update-notice.md';
import BrowserUpdatedIcon from '@mui/icons-material/BrowserUpdated';
import { Alert, Button, Typography } from '@mui/material';
import React, { useState } from 'react';

import { CustomPlayer } from '../../../../../components/customPlayer';
import DialogBox from '../../../../../designSystem/designComponents/dialog/dialogBox';
import Markdown from '../../../../../designSystem/designComponents/textComponents/Markdown';

const alertText = 'cySync v2 is available!';

export const UpdateNotice: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  return (
    <>
      <DialogBox
        open={isDialogOpen}
        handleClose={() => {
          setIsDialogOpen(false);
        }}
        fullWidth
        isClosePresent
        maxWidth="md"
        dialogHeading={alertText}
        restComponents={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '5rem'
            }}
          >
            <CustomPlayer
              url={
                'https://www.youtube.com/embed/X7Kv4cGptcA?autoplay=1&loop=1'
              }
            />
            <Markdown style={{ paddingBottom: '1rem', paddingTop: '1rem' }}>
              {content}
            </Markdown>
          </div>
        }
      />
      {
        <Alert
          action={
            <Button
              style={{ padding: '0px', marginRight: '16px' }}
              onClick={() => {
                setIsDialogOpen(true);
              }}
            >
              <Typography
                sx={{
                  '&:hover': {
                    textDecoration: 'underline'
                  },
                  textTransform: 'none',
                  color: '#5dab61'
                }}
              >
                Learn More
              </Typography>
            </Button>
          }
          severity="success"
          variant="outlined"
          iconMapping={{ success: <BrowserUpdatedIcon fontSize="inherit" /> }}
          sx={{ mb: 2 }}
        >
          {alertText}
        </Alert>
      }
    </>
  );
};
