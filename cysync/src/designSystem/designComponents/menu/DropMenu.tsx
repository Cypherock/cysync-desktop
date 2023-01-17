import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Typography } from '@mui/material';
import ListItem from '@mui/material/ListItem';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled, useTheme } from '@mui/material/styles';
import withStyles from '@mui/styles/withStyles';
import React from 'react';

export const StyledMenu = withStyles(() => ({
  paper: {
    border: `1px solid #404854`,
    background: '#272A2F'
  }
}))((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center'
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'center'
    }}
    {...props}
  />
));

export const StyledMenuItem = withStyles(theme => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0.5rem 2rem',
    fontSize: '0.9rem',
    color: theme.palette.text.secondary,
    '&:focus': {
      background: '#272A2F'
    }
  },
  selected: {
    background: '#272A2F',
    color: theme.palette.text.primary
  }
}))(MenuItem);

const PREFIX = 'DropMenu';

const classes = {
  button: `${PREFIX}-button`,
  button2: `${PREFIX}-button2`
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.button}`]: {
    color: theme.palette.text.primary,
    width: 'fit-content',
    background: theme.palette.primary.light,
    fontFamily: 'Lato',
    fontSize: '0.9rem',
    padding: '0px'
  },
  [`& .${classes.button2}`]: {
    color: '#FFFFFF',
    background: '#1A2129 !important',
    fontFamily: 'Lato',
    fontSize: '0.9rem',
    borderRadius: 5
  }
}));

export interface DropMenuProps {
  startAdornment?: React.ReactNode;
  stylex?: any;
  index: number;
  bg?: boolean;
  disabled?: boolean;
  handleMenuItemSelectionChange?: (index: number, type?: string) => void;
  type?: string;
  options: Array<
    string | { name: string; tag?: string; value: string; tooltip?: string }
  >;
  style?: any;
}

const DropMenu = (props: DropMenuProps) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (
    _event: React.MouseEvent<HTMLElement>,
    i: number
  ) => {
    if (props.type) props.handleMenuItemSelectionChange(i, props.type);
    else props.handleMenuItemSelectionChange(i);
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const { style, stylex, startAdornment, options, index, bg, disabled } = props;

  return (
    <Root style={style}>
      <ListItem
        button
        onClick={handleClickListItem}
        className={stylex === 2 ? classes.button2 : classes.button}
        style={{ background: bg ? '' : 'rgba(0,0,0,0)' }}
        disabled={disabled}
      >
        {startAdornment || null}
        {options[index]}
        {anchorEl === null ? (
          <ExpandMoreIcon
            style={{
              color: theme.palette.text.secondary,
              marginLeft: stylex === 2 ? '0.7rem' : '0rem'
            }}
          />
        ) : (
          <ExpandLessIcon
            style={{
              color: theme.palette.text.secondary,
              marginLeft: stylex === 2 ? '0.7rem' : '0rem'
            }}
          />
        )}
      </ListItem>
      <StyledMenu
        id="lock-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {options.map((option, i: number) => {
          let name = '';
          let value = '';
          let tag = '';
          let tooltip = '';

          if (typeof option === 'string') {
            name = option.toUpperCase();
            value = option;
          } else {
            name = option.name;
            value = option.value;
            tag = option.tag;
            tooltip = option.tooltip;
          }

          return (
            <StyledMenuItem
              key={value}
              selected={i === index}
              color="secondary"
              onClick={event => handleMenuItemClick(event, i)}
              disabled={disabled}
            >
              {tag || tooltip ? (
                <Typography>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start'
                    }}
                  >
                    {name}
                  </div>
                  {tag && (
                    <Typography
                      style={{
                        color: '#ADABAA',
                        border: '1px solid #ADABAA',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '8px',
                        width: 'fit-content'
                      }}
                    >
                      {tag}
                    </Typography>
                  )}
                </Typography>
              ) : (
                name
              )}
            </StyledMenuItem>
          );
        })}
      </StyledMenu>
    </Root>
  );
};

export default DropMenu;
