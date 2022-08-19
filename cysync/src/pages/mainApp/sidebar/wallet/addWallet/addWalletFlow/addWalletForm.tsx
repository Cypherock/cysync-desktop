import AddCircleIcon from '@mui/icons-material/AddCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import success from '../../../../../../assets/icons/generic/success.png';
import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import ModAvatar from '../../../../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import TextView from '../../../../../../designSystem/designComponents/textComponents/textView';
import Device from '../../../../../../designSystem/iconGroups/device';

const PREFIX = 'AddWalletForm';

const classes = {
  root: `${PREFIX}-root`,
  content: `${PREFIX}-content`,
  error: `${PREFIX}-error`,
  continue: `${PREFIX}-continue`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  [`& .${classes.content}`]: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    paddingBottom: '5rem'
  },
  [`& .${classes.error}`]: {
    color: 'red'
  },
  [`& .${classes.continue}`]: {
    background: theme.palette.primary.light,
    color: theme.palette.text.secondary,
    marginTop: '2rem'
  }
}));

interface AddWalletFormProps {
  handleClose: (
    abort?: boolean | undefined,
    openAddCoinForm?: boolean | undefined
  ) => void;
  walletName?: string;
  walletSuccess: boolean;
}

const AddWalletForm: React.FC<AddWalletFormProps> = ({
  walletName,
  walletSuccess,
  handleClose
}) => {
  const [active, setActive] = React.useState(0);

  const handleNext = () => {
    setTimeout(() => {
      setActive(active + 1);
    }, 500);
  };

  useEffect(() => {
    if (walletSuccess) {
      handleNext();
    }
  }, [walletSuccess]);

  const setActiveView = () => {
    switch (active) {
      case -1:
        return (
          <>
            <Icon size={157} viewBox="0 0 157 70" iconGroup={<Device />} />
            <div className={classes.content} style={{ paddingBottom: '8rem' }}>
              <Typography color="error" style={{ display: 'flex' }}>
                <ErrorOutlineIcon style={{ marginRight: '0.5rem' }} />
                <span>
                  {` No wallet found on X1 wallet, Add a wallet on device
                  first`}
                </span>
              </Typography>
            </div>
          </>
        );
      case 0:
        return (
          <>
            <Icon size={157} viewBox="0 0 157 70" iconGroup={<Device />} />
            <div className={classes.content}>
              <Typography color="textSecondary">
                Follow the Steps on the Device
              </Typography>
              <TextView
                completed={!!walletName}
                inProgress={!walletName}
                text="Select the Wallet on Device which you want to import"
              />
            </div>
          </>
        );
      case 1:
        return (
          <>
            <ModAvatar src={success} alt="success" />
            <Typography
              color="textPrimary"
              variant="body1"
              style={{
                paddingBottom: '4rem',
                fontWeight: 700,
                marginTop: '1rem'
              }}
            >
              {`Wallet ${walletName} added successfully`}
            </Typography>
            <CustomButton
              disableRipple
              style={{
                margin: '1rem 0rem',
                color: '#FFF',
                padding: '0.5rem 3rem'
              }}
              startIcon={<AddCircleIcon />}
              onClick={() => handleClose(true, true)}
            >
              ADD COINS
            </CustomButton>
          </>
        );
      default:
        return null;
    }
  };

  return <Root className={classes.root}>{setActiveView()}</Root>;
};

AddWalletForm.propTypes = {
  handleClose: PropTypes.func.isRequired,
  walletName: PropTypes.string,
  walletSuccess: PropTypes.bool.isRequired
};

AddWalletForm.defaultProps = {
  walletName: undefined
};

export default AddWalletForm;
