import { COINS } from '@cypherock/communication';
import Slider, { SliderProps, SliderThumb } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import { useCurrentCoin } from '../../../../../../store/provider';

const THUMB_PREFIX = 'CustomSliderThumb';

const thumbClasses = {
  innerCircle: `${THUMB_PREFIX}-innerCircle`,
  currentValue: `${THUMB_PREFIX}-currentValue`
};

const CustomSliderThumb = styled(SliderThumb)(({ theme }) => ({
  [`& .${thumbClasses.innerCircle}`]: {
    height: 12,
    width: 12,
    borderRadius: 6,
    background: theme.palette.secondary.dark
  },
  [`& .${thumbClasses.currentValue}`]: {
    marginTop: 35,
    width: 200,
    textAlign: 'center',
    position: 'absolute',
    color: theme.palette.text.secondary
  }
}));

interface ThumbComponentProps extends React.HTMLAttributes<unknown> {
  ownerState: {
    value: number;
    dragging: boolean;
  };
}

function ThumbComponent(props: ThumbComponentProps) {
  const { children, ...other } = props;
  const { coinDetails } = useCurrentCoin();
  return (
    <CustomSliderThumb {...other}>
      {children}
      <span className={thumbClasses.currentValue}>
        {`${props.ownerState.value} ${
          (COINS[coinDetails.coinId] || { fees: '0' }).fees
        }`}
      </span>
      <span className={thumbClasses.innerCircle} />
    </CustomSliderThumb>
  );
}

const BoxShadow =
  '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)';

const IOSSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.secondary.dark,
  height: 2,
  padding: '15px 0',
  '& .MuiSlider-thumb': {
    height: 18,
    width: 18,
    border: `1px solid ${theme.palette.secondary.dark}`,
    padding: 2,
    backgroundColor: theme.palette.primary.main,
    '&:focus, &:hover, &.Mui-active': {
      boxShadow: `0 3px 1px rgba(255,154,76,0.1),0 4px 8px rgba(255,154,76,0.3),0 0 0 1px rgba(255,154,76,0.02)`,
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        boxShadow: BoxShadow
      }
    }
  },
  '& .MuiSlider-valueLabel': {
    left: 'calc(-50% + 0px)',
    top: 30,
    '& *': {
      background: 'transparent',
      color: '#fff'
    }
  },
  '& .MuiSlider-track': {
    height: 2
  },
  '& .MuiSlider-rail': {
    height: 2,
    opacity: 0.5,
    backgroundColor: theme.palette.secondary.main
  },
  '& .MuiSlider-mark': {
    backgroundColor: '#bfbfbf',
    height: 8,
    width: 1,
    marginTop: -3,
    '&.MuiSlider-markActive': {
      opacity: 1,
      backgroundColor: 'currentColor'
    }
  }
}));

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
  step?: number;
  valueLabelDisplay?: SliderProps['valueLabelDisplay'];
  valueLabelFormat?: SliderProps['valueLabelFormat'];
};

const CustomSlider: React.FC<CustomSliderProps> = ({
  handleTransactionFeeChangeSlider,
  mediumFee,
  fee,
  step,
  valueLabelFormat,
  valueLabelDisplay
}) => {
  const handleChange = (_e: any, v: any) => {
    handleTransactionFeeChangeSlider(v);
  };

  // Use specified step value or '1% of the value' as step value
  const stepValue = step ?? Number((mediumFee * 0.01).toPrecision(1));

  return (
    <Root className={classes.root}>
      <div className={classes.labels}>
        <Typography color="textSecondary">Minimum</Typography>
        <Typography color="textSecondary">Average</Typography>
        <Typography color="textSecondary">Maximum</Typography>
      </div>
      <IOSSlider
        aria-label="ios slider"
        value={fee}
        min={0}
        max={mediumFee * 2}
        step={stepValue} // number of steps is dynamically calculated based on the mediumFee or from the props
        onChange={handleChange}
        valueLabelDisplay={valueLabelDisplay}
        valueLabelFormat={valueLabelFormat}
        components={{ Thumb: ThumbComponent }}
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
