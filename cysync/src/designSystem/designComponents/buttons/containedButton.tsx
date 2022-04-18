import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import React from 'react';

import colors from '../../designConstants/colors';
import typography from '../../designConstants/typography';

const CustomButton = Button;

const PREFIX = 'containedButton';

const classes = {
  root: `${PREFIX}-root`,
  disabled: `${PREFIX}-disabled`
};

const StyledCustomButton = styled(CustomButton)({
  [`& .${classes.root}`]: {
    background: colors.primary.mainColor,
    color: colors.systemColors.textAndBackground.light[100],
    textTransform: 'none',
    height: 32,
    fontSize: typography.textLabel,
    '&:hover': {
      background: colors.primary.lighter
    },
    '&:focus': {
      background: colors.primary.darker,
      border: `1px solid ${colors.primary.lighter}`
    },
    '&:active': {
      background: colors.primary.darker,
      border: 'none'
    }
  },
  [`& .${classes.disabled}`]: {
    background: colors.systemColors.textAndBackground.light[400],
    color: `${colors.systemColors.textAndBackground.light[100]} !important`
  }
});

export interface StyleProps {
  borderRadius?: string;
}

type Props = {
  text?: string | number;
  type?: 'default' | 'round';
};

const containedButton: React.FC<Props> = ({ text }) => {
  return <StyledCustomButton disableElevation>{text}</StyledCustomButton>;
};

export default containedButton;
