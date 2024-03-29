import Button from '@mui/material/Button';
import { styled, useTheme } from '@mui/material/styles';
import { ApexOptions } from 'apexcharts';
import clsx from 'clsx';
import React, { useRef } from 'react';
import ReactApexChart from 'react-apexcharts';

import { useDiscreetMode } from '../../../../../store/provider';
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

const LineChart = (props: any) => {
  const discreetMode = useDiscreetMode();
  const theme = useTheme();
  const chartRef = useRef<ReactApexChart>();

  const handleSensitiveDataDisplay = React.useRef(
    discreetMode.handleSensitiveDataDisplay
  );

  const options: ApexOptions = {
    chart: {
      width: '550px',
      height: '230px',
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
      labels: {
        style: {
          colors: theme.palette.text.primary,
          fontWeight: 600
        }
      },
      type: 'datetime',
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
        formatter: (data: any) => {
          return `$ ${handleSensitiveDataDisplay.current(
            formatDisplayAmount(data, 2, true)
          )}`;
        },

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
        style: {
          colors: theme.palette.text.primary,
          fontWeight: 600
        },
        formatter(value: any) {
          return `$ ${handleSensitiveDataDisplay.current(
            formatDisplayAmount(value, 2, true)
          )}`;
        }
      }
    },
    responsive: [
      {
        breakpoint: 980,
        options: {
          chart: {
            width: '550px',
            height: '200px'
          }
        }
      },
      {
        breakpoint: 1090,
        options: {
          chart: {
            width: '600px',
            height: '210px'
          }
        }
      },
      {
        breakpoint: 1200,
        options: {
          chart: {
            width: '650px',
            height: '220px'
          }
        }
      },
      {
        breakpoint: 1350,
        options: {
          chart: {
            width: '700px',
            height: '230px'
          }
        }
      },
      {
        breakpoint: 1600,
        options: {
          chart: {
            width: '800px',
            height: '250px'
          }
        }
      },
      {
        breakpoint: 2100,
        options: {
          chart: {
            width: '900px',
            height: '300px'
          }
        }
      }
    ]
  };

  React.useEffect(() => {
    handleSensitiveDataDisplay.current =
      discreetMode.handleSensitiveDataDisplay;
    const chart = (chartRef.current as any)?.chart;
    if (chart) {
      chart.updateOptions(options);
    }
  }, [discreetMode.handleSensitiveDataDisplay]);

  const { timeActiveButton, setTimeActive, series } = props;

  const handleButtonChange = (selectedIndex: number) => {
    setTimeActive(selectedIndex);
  };

  return (
    <Root className={classes.root}>
      <div className={classes.mapNavigation}>
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
      <ReactApexChart
        ref={chartRef}
        options={options}
        series={series}
        type="area"
      />
    </Root>
  );
};

export default LineChart;
