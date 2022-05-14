import { useTheme } from '@mui/material/styles';
import { ApexOptions } from 'apexcharts';
import PropTypes from 'prop-types';
import React from 'react';
import Chart from 'react-apexcharts';

import formatDisplayAmount from '../../../../../utils/formatDisplayAmount';

type chartProps = {
  series: number[];
  labels: string[];
  hasCoins: boolean;
  currentCoinLabel: string;
};

const Donut: React.FC<chartProps> = ({
  series,
  hasCoins,
  labels,
  currentCoinLabel
}) => {
  const theme = useTheme();
  const options: ApexOptions = {
    labels:
      labels.length > 0
        ? labels.map(label => label.toUpperCase())
        : hasCoins
        ? ['Test coins']
        : [],
    legend: {
      show: false
    },
    chart: {},
    colors: ['#DB953C', '#328332', '#F3BA2F'],
    stroke: {
      show: false
    },
    dataLabels: {
      enabled: true
    },
    tooltip: {
      y: {
        formatter(val) {
          return `$ ${formatDisplayAmount(val, 2, true)}`;
        }
      }
    },
    plotOptions: {
      pie: {
        customScale: 0.85,
        dataLabels: {
          offset: 25,
          minAngleToShowLabel: 30
        },
        donut: {
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: 5
            },
            value: {
              show: false
            },
            total: {
              show: true,
              showAlways: false,
              label: currentCoinLabel,
              fontWeight: 600,
              fontSize: '13',
              color: theme.palette.text.secondary,
              formatter(w: any) {
                const total = w.globals.seriesTotals.reduce(
                  (a: any, b: any) => {
                    return a + b;
                  },
                  0
                );
                return `$ ${formatDisplayAmount(total, 2, true)}`;
              }
            }
          }
        }
      }
    }
  };

  return (
    <Chart
      options={options}
      series={series.length > 0 ? series : hasCoins ? [0] : []}
      type="donut"
      width="70%"
    />
  );
};

Donut.propTypes = {
  series: PropTypes.array.isRequired,
  labels: PropTypes.array.isRequired,
  hasCoins: PropTypes.bool.isRequired,
  currentCoinLabel: PropTypes.string.isRequired
};

export default Donut;
