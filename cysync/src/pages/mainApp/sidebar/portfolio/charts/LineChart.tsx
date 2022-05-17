import Button from '@mui/material/Button';
import { styled, useTheme } from '@mui/material/styles';
import { ApexOptions } from 'apexcharts';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';

import DropMenu from '../../../../../designSystem/designComponents/menu/DropMenu';
import formatDisplayAmount from '../../../../../utils/formatDisplayAmount';

const PREFIX = 'LineChart';

const classes = {
  root: `${PREFIX}-root`,
  mapNavigation: `${PREFIX}-mapNavigation`,
  buttons: `${PREFIX}-buttons`,
  button: `${PREFIX}-button`,
  selected: `${PREFIX}-selected`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0.3rem 0rem'
  },
  [`& .${classes.mapNavigation}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0rem 1rem'
  },
  [`& .${classes.buttons}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '20%'
  },
  [`& .${classes.button}`]: {
    background: theme.palette.background.default,
    color: theme.palette.text.secondary,
    padding: '2px 8px',
    minWidth: 'max-content'
  },
  [`& .${classes.selected}`]: {
    border: `1px solid ${theme.palette.text.secondary}`,
    color: theme.palette.text.primary
  }
}));

const ApexChart = (props: any) => {
  const theme = useTheme();
  const [chartWidth, setChartWidth] = useState(600);

  const updateDimensions = () => {
    if (window.innerWidth <= 1090 && chartWidth !== 600) setChartWidth(600);
    else if (
      window.innerWidth > 1090 &&
      window.innerWidth <= 1200 &&
      chartWidth !== 650
    )
      setChartWidth(650);
    else if (
      window.innerWidth > 1200 &&
      window.innerWidth <= 1350 &&
      chartWidth !== 700
    )
      setChartWidth(700);
    else if (
      window.innerWidth > 1350 &&
      window.innerWidth <= 1600 &&
      chartWidth !== 800
    )
      setChartWidth(800);
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getChartComponent = () => {
    return (
      <Chart
        options={options}
        series={series}
        type="area"
        width={chartWidth}
        height={230}
      />
    );
  };

  const {
    timeActiveButton,
    setTimeActive,
    coinList,
    coinIndex,
    setCoinIndex,
    series
  } = props;

  const handleButtonChange = (selectedIndex: number) => {
    setTimeActive(selectedIndex);
  };

  const handleMenuItemSelectionChange = (selectedIndex: number) => {
    setCoinIndex(selectedIndex);
  };

  const options: ApexOptions = {
    chart: {
      background: theme.palette.primary.main,
      type: 'area',
      dropShadow: {
        enabled: false,
        top: 18,
        left: 7,
        blur: 10,
        opacity: 0.2
      },
      toolbar: {
        show: false
      },
      zoom: { enabled: false }
    },
    colors: ['#DB953C', '#328332', '#F3BA2F'],
    annotations: {},
    xaxis: {
      type: 'datetime',
      tickAmount: 6,
      tooltip: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 1
    },
    grid: {
      show: true,
      borderColor: theme.palette.text.secondary,
      strokeDashArray: 7,
      position: 'back',
      row: {
        colors: [theme.palette.primary.main, 'transparent'],
        opacity: 0.1
      }
    },
    markers: {
      size: 0,
      radius: 1,
      strokeWidth: 0.5,
      strokeColors: ['#DB953C', '#328332', '#F3BA2F']
    },
    legend: {
      show: false
    },
    plotOptions: {},
    tooltip: {
      enabled: true,
      shared: true,
      followCursor: false,
      intersect: false,
      inverseOrder: false,
      custom: undefined,
      fillSeriesColor: false,
      theme: 'dark',
      style: {
        fontSize: '10px',
        fontFamily: undefined
      },
      onDatasetHover: {
        highlightDataSeries: false
      },
      x: {
        show: false
      },
      y: {
        formatter: (data: any) => `$ ${formatDisplayAmount(data, 2, true)}`,
        title: {
          formatter: (seriesName: any) => `${seriesName.toUpperCase()} : `
        }
      },
      items: {
        display: 'flex'
      }
    },
    yaxis: {
      labels: {
        formatter(value: any) {
          return `$ ${formatDisplayAmount(value, 2, true)}`;
        }
      }
    }
  };

  return (
    <Root className={classes.root}>
      <div className={classes.mapNavigation}>
        <DropMenu
          options={coinList.map((item: any) => item.toUpperCase())}
          handleMenuItemSelectionChange={handleMenuItemSelectionChange}
          index={coinIndex}
          bg={false}
        />
        <div className={classes.buttons}>
          <Button
            variant="outlined"
            className={clsx(
              classes.button,
              timeActiveButton === 7 ? classes.selected : ' '
            )}
            onClick={() => handleButtonChange(7)}
          >
            1 W
          </Button>
          <Button
            variant="outlined"
            className={clsx(
              classes.button,
              timeActiveButton === 30 ? classes.selected : ' '
            )}
            onClick={() => handleButtonChange(30)}
          >
            1 M
          </Button>
          <Button
            variant="outlined"
            className={clsx(
              classes.button,
              timeActiveButton === 365 ? classes.selected : ' '
            )}
            onClick={() => handleButtonChange(365)}
          >
            1 Y
          </Button>
        </div>
      </div>
      {getChartComponent()}
    </Root>
  );
};

export default ApexChart;
