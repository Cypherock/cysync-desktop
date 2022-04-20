import { COINS } from '@cypherock/communication';
import Slider from '@mui/material/Slider';
import { styled, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import PropTypes from 'prop-types';
import React from 'react';

import { useCurrentCoin } from '../../../../../../store/provider';

const DOT_PREFIX = 'CustomSliderDot';

const dotClasses = {
  innerCircle: `${DOT_PREFIX}-innerCircle`,
  currentValue: `${DOT_PREFIX}-currentValue`
};

const DotRoot = styled('span')(({ theme }) => ({
  [`& .${dotClasses.innerCircle}`]: {
    height: 12,
    width: 12,
    borderRadius: 6,
    background: theme.palette.secondary.dark
  },
  [`& .${dotClasses.currentValue}`]: {
    marginTop: 20,
    width: 200,
    textAlign: 'center',
    position: 'absolute',
    color: theme.palette.text.secondary
  }
}));

const Dot = (props: any) => {
  const { coinDetails } = useCurrentCoin();
  return (
    <DotRoot {...props}>
      <span className={dotClasses.currentValue}>
        {`${props['aria-valuenow']} ${
          (COINS[coinDetails.coin.toLowerCase()] || { fees: '0' }).fees
        }`}
      </span>
      <span className={dotClasses.innerCircle} />
    </DotRoot>
  );
};

const BoxShadow =
  '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)';

const IOSSlider = withStyles((theme: Theme) =>
  createStyles({
    root: {
      color: theme.palette.secondary.dark,
      height: 2,
      padding: '15px 0'
    },
    thumb: {
      height: 18,
      width: 18,
      border: `1px solid ${theme.palette.secondary.dark}`,
      padding: 2,
      backgroundColor: theme.palette.primary.main,
      boxShadow: BoxShadow,
      marginTop: -8,
      marginLeft: -8,
      '&:focus, &:hover, &$active': {
        boxShadow: `0 3px 1px rgba(255,154,76,0.1),0 4px 8px rgba(255,154,76,0.3),0 0 0 1px rgba(255,154,76,0.02)`,
        // Reset on touch devices, it doesn't add specificity
        '@media (hover: none)': {
          boxShadow: BoxShadow
        }
      }
    },
    active: {},
    valueLabel: {
      left: 'calc(-50% + 0px)',
      top: 30,
      '& *': {
        background: 'transparent',
        color: '#fff'
      }
    },
    track: {
      height: 2
    },
    rail: {
      height: 2,
      opacity: 0.5,
      backgroundColor: theme.palette.secondary.main
    },
    mark: {
      backgroundColor: '#bfbfbf',
      height: 8,
      width: 1,
      marginTop: -3
    },
    markActive: {
      opacity: 1,
      backgroundColor: 'currentColor'
    }
  })
)(Slider);

const PREFIX = 'CustomSlider';

const classes = {
  root: `${PREFIX}-root`,
  labels: `${PREFIX}-labels`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0rem 0.5rem'
  },
  [`& .${classes.labels}`]: {
    display: 'flex',
    justifyContent: 'space-between',
    '& span': {
      color: theme.palette.text.secondary,
      fontSize: 16
    }
  }
}));

type CustomSliderProps = {
  handleTransactionFeeChangeSlider: (e: any) => void;
  mediumFee: number;
  fee: number;
};

const CustomSlider: React.FC<CustomSliderProps> = ({
  handleTransactionFeeChangeSlider,
  mediumFee,
  fee
}) => {
  const handleChange = (_e: any, v: any) => {
    handleTransactionFeeChangeSlider(v);
  };

  return (
    <Root className={classes.root}>
      <div className={classes.labels}>
        <Typography color="textSecondary">Minimum</Typography>
        <Typography color="textSecondary">Average</Typography>
        <Typography color="textSecondary">Maximum</Typography>
      </div>
      <IOSSlider
        ThumbComponent={Dot}
        aria-label="ios slider"
        value={fee}
        min={1}
        max={mediumFee * 2}
        step={1}
        onChange={handleChange}
      />
    </Root>
  );
};

CustomSlider.propTypes = {
  handleTransactionFeeChangeSlider: PropTypes.func.isRequired,
  mediumFee: PropTypes.number.isRequired,
  fee: PropTypes.number.isRequired
};

export default CustomSlider;
