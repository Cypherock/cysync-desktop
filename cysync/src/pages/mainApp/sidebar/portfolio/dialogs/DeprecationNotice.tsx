import content from '!!html-loader!markdown-loader!../../../../../constants/markdown/near-deprecation.md';
import { Alert, Button, Typography } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import DialogBox from '../../../../../designSystem/designComponents/dialog/dialogBox';
import CustomCheckBox from '../../../../../designSystem/designComponents/input/checkbox';
import Markdown from '../../../../../designSystem/designComponents/textComponents/Markdown';

const alertText = 'Live Data for Near is under maintenance';

export const DeprecationNotice: React.FC = () => {
  const [isAlertHidden, setIsAlertHidden] = useState(
    localStorage.getItem('isNearAlertHidden') === 'true'
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <>
      <DialogBox
        open={isDialogOpen}
        handleClose={() => {
          setIsDialogOpen(false);
          setIsAlertHidden(false);
        }}
        fullWidth
        isClosePresent
        maxWidth="md"
        dialogHeading={alertText}
        restComponents={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Markdown style={{ padding: '5rem', paddingBottom: '1rem' }}>
              {content}
            </Markdown>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '60%'
              }}
            >
              <FormControlLabel
                control={
                  <CustomCheckBox
                    checked={isAlertHidden}
                    onChange={() => {
                      setIsAlertHidden(state => !state);
                    }}
                    color="secondary"
                  />
                }
                color={'textSecondary'}
                label="Don’t show me again"
                style={{ margin: '5rem', marginTop: '0rem' }}
              />
              <CustomButton
                onClick={() => {
                  setIsDialogOpen(false);
                  setIsAlertHidden(true);
                  localStorage.setItem(
                    'isNearAlertHidden',
                    isAlertHidden.toString()
                  );
                }}
                disabled={!isAlertHidden}
                style={{
                  textTransform: 'none',
                  padding: '0.5rem 3.5rem',
                  height: 'max-content'
                }}
              >
                Ok
              </CustomButton>
            </div>
          </div>
        }
      />
      {(!isAlertHidden || isDialogOpen) && (
        <Alert
          action={
            <Button
              style={{ padding: '0px', marginRight: '16px' }}
              onClick={() => {
                setIsDialogOpen(true);
              }}
            >
              <Typography
                color="secondary"
                sx={{
                  '&:hover': {
                    textDecoration: 'underline'
                  },
                  textTransform: 'none'
                }}
              >
                Learn More
              </Typography>
            </Button>
          }
          severity="warning"
          sx={{ mb: 2 }}
        >
          {alertText}
        </Alert>
      )}
    </>
  );
};

DeprecationNotice.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
};
