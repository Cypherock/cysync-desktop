import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import ICONS from '../../../../../../designSystem/iconGroups/iconConstants';

const PREFIX = 'WalletSendLabelText';

const classes = {
  root: `${PREFIX}-root`,
  label: `${PREFIX}-label`,
  text: `${PREFIX}-text`,
  verified: `${PREFIX}-verified`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  [`& .${classes.label}`]: {
    fontSize: '0.9rem',
    color: theme.palette.primary.light,
    marginBottom: '1rem'
  },
  [`& .${classes.text}`]: {
    width: '90%',
    padding: `0.8rem 1.5rem 1rem`,
    fontSize: '1rem',
    background: 'rgba(255,255,255,0.05)',
    color: theme.palette.text.secondary,
    borderRadius: '5px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.verified}`]: {
    color: theme.palette.info.light
  }
}));

type LabelTextProps = {
  label?: string | undefined;
  text: string;
  verified?: boolean;
};

const LabelText: React.FC<LabelTextProps> = ({ label, text, verified }) => {
  const theme = useTheme();
  return (
    <Root className={classes.root}>
      <Typography color="textPrimary" gutterBottom>
        {label}
      </Typography>
      <Typography
        className={`${classes.text} ${verified ? classes.verified : ''}`}
      >
        {text}
        {verified && (
          <Icon
            icon={ICONS.checkmark}
            color={theme.palette.text.secondary}
            viewBox="0 0 479 479"
          />
        )}
      </Typography>
    </Root>
  );
};

LabelText.propTypes = {
  text: PropTypes.string.isRequired,
  verified: PropTypes.bool,
  label: PropTypes.string
};

LabelText.defaultProps = {
  label: undefined,
  verified: undefined
};

export default LabelText;
