import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import ICONS from '../../../../../../designSystem/iconGroups/iconConstants';

const CustomPaper = styled(Paper)`
  position: relative;
  width: 90%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background: rgba(66, 66, 66, 0.5);
  padding: 10px 30px;
  margin: 15px 0px;
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    background: rgba(66, 66, 66, 0.3);
  }
`;

type ToggleProps = {
  text: string;
  completed: boolean;
};

const PREFIX = 'TextView';

const classes = {
  text: `${PREFIX}-text`,
  arrow: `${PREFIX}-arrow`,
  checkmark: `${PREFIX}-checkmark`
};

const Root = styled(CustomPaper)(({ theme }) => ({
  [`& .${classes.text}`]: {
    color: (completed: any) =>
      completed ? 'blue' : theme.palette.primary.light
  },
  [`& .${classes.arrow}`]: {
    marginRight: '0.5rem'
  },
  [`& .${classes.checkmark}`]: {
    position: 'absolute',
    right: '1rem',
    transition: 'all 0.3s ease'
  }
}));

const ToggleButton: React.FC<ToggleProps> = ({ text, completed }) => {
  return (
    <Root variant="outlined" elevation={0}>
      <Icon
        className={classes.arrow}
        icon={ICONS.chevronRight}
        viewBox="0 0 31.49 31.49"
        size={14}
        color="orange"
      />
      <Typography variant="body1" className={classes.text}>
        {text}
      </Typography>
      {completed ? (
        <Icon
          className={classes.checkmark}
          icon={ICONS.checkmark}
          viewBox="0 0 479 479"
          color="grey"
        />
      ) : null}
    </Root>
  );
};

ToggleButton.propTypes = {
  text: PropTypes.string.isRequired,
  completed: PropTypes.bool.isRequired
};

export default ToggleButton;
