import tou from '!!html-loader!markdown-loader!../../../constants/markdown/terms.md';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../designSystem/designComponents/buttons/button';
import CustomCheckBox from '../../../designSystem/designComponents/input/checkbox';
import Markdown from '../../../designSystem/designComponents/textComponents/Markdown';

const PREFIX = 'InitialTermsAndUse';

const classes = {
  middle: `${PREFIX}-middle`,
  content: `${PREFIX}-content`,
  buttons: `${PREFIX}-buttons`
};

const Root = styled(Grid)(({ theme }) => ({
  [`& .${classes.middle}`]: {
    padding: '2rem',
    background: theme.palette.primary.light,
    minWidth: '80vw',
    height: '90vh',
    margin: '0rem 1.5rem',
    border: '1px solid grey',
    borderRadius: '1rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.content}`]: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    overflowY: 'scroll',
    maxWidth: '60%',
    height: '60vh'
  },
  [`& .${classes.buttons}`]: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '60%'
  }
}));

interface TermsAndUseProps {
  handleNext: () => void;
}

const TermsAndUse: React.FC<TermsAndUseProps> = ({ handleNext }) => {
  const [agreement, setAgreement] = React.useState(false);
  const [agreeEnabled, setAgreeEnabled] = React.useState(false);

  const handleAgreementChange = () => {
    setAgreement(!agreement);
  };

  const onScroll = (event: any) => {
    const scrollPercent =
      ((event.target.clientHeight + event.target.scrollTop) * 100) /
      event.target.scrollHeight;

    if (!agreeEnabled && scrollPercent >= 98) {
      setAgreeEnabled(true);
    }
  };

  return (
    <Root container>
      <Grid item xs={12} className={classes.middle}>
        <Typography variant="h2" color="textPrimary" align="center">
          Terms of Use
        </Typography>
        <Grid onScroll={onScroll} container className={classes.content}>
          <Markdown>{tou}</Markdown>
        </Grid>
        <div className={classes.buttons}>
          {!agreeEnabled ? (
            <Tooltip
              title="Read the terms of use till end"
              placement="bottom-start"
            >
              <FormControlLabel
                control={
                  <CustomCheckBox
                    checked={agreement}
                    onChange={handleAgreementChange}
                    disabled={!agreeEnabled}
                    color="secondary"
                  />
                }
                color={'textPrimary'}
                label="I have read and agree with the Terms of Use and Privacy Policy"
                style={{ width: '50%' }}
              />
            </Tooltip>
          ) : (
            <FormControlLabel
              control={
                <CustomCheckBox
                  checked={agreement}
                  onChange={handleAgreementChange}
                  disabled={!agreeEnabled}
                  color="secondary"
                />
              }
              color={'textSecondary'}
              label="I have read and agree with the Terms of Use and Privacy Policy"
              style={{ width: '50%' }}
            />
          )}
          <CustomButton
            onClick={() => {
              localStorage.setItem('tnc', 'true');
              handleNext();
            }}
            disabled={!agreement}
            style={{
              textTransform: 'none',
              padding: '0.5rem 3.5rem',
              height: 'max-content'
            }}
          >
            Confirm
          </CustomButton>
        </div>
      </Grid>
    </Root>
  );
};

TermsAndUse.propTypes = {
  handleNext: PropTypes.func.isRequired
};

export default TermsAndUse;
