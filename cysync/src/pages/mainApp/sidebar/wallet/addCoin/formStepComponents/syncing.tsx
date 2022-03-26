import CircularProgress from '@material-ui/core/CircularProgress';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React, { useEffect } from 'react';

import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import {
  useAddCoinContext,
  useConnection
} from '../../../../../../store/provider';
import Analytics from '../../../../../../utils/analytics';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      padding: '2rem 4rem',
      minHeight: '15rem'
    },
    center: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%'
    }
  })
);

const Verify: React.FC<StepComponentProps> = ({ handleNext }) => {
  const { coinAdder } = useAddCoinContext();
  const { connected } = useConnection();

  useEffect(() => {
    if (coinAdder.addCoinCompleted) {
      Analytics.Instance.event(
        Analytics.Categories.ADD_COIN,
        Analytics.Actions.COMPLETED
      );
      coinAdder.resetHooks();
      handleNext();
    }
  }, [coinAdder.addCoinCompleted]);

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Typography
        style={{ marginBottom: '10px' }}
        color="textSecondary"
        gutterBottom
      >
        Fetching balance from the blockchain
      </Typography>

      <div className={classes.center}>
        {coinAdder.addCoinStatus.length === 0 && (
          <CircularProgress color="secondary" />
        )}
      </div>

      {coinAdder.addCoinStatus.length > 0 &&
        coinAdder.addCoinStatus.map(coin => (
          <TextView
            key={coin.name}
            failed={coin.status === -1}
            completed={coin.status === 2}
            inProgress={coin.status === 1}
            text={coin.name}
            stylex={{ marginTop: '0px' }}
          />
        ))}
      {connected || (
        <div style={{ marginTop: '10px' }} className={classes.center}>
          <Icon
            size={50}
            viewBox="0 0 60 60"
            iconGroup={<ErrorExclamation />}
          />
          <Typography variant="body2" color="secondary">
            Internet connection is required for this action
          </Typography>
        </div>
      )}
    </div>
  );
};

Verify.propTypes = StepComponentPropTypes;

export default Verify;
