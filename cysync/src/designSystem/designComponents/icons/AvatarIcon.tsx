import Avatar from '@mui/material/Avatar';
import { styled } from '@mui/material/styles';
import React from 'react';

const ModAvatar = Avatar;
const ModAvatarSmall = Avatar;
const ModAvatarExtraSmall = Avatar;

const PREFIX = 'AvatarIcon';

const classes = {
  root: `${PREFIX}-root`,
  img: `${PREFIX}-img`,
  root2: `${PREFIX}-root2`,
  img2: `${PREFIX}-img2`,
  root3: `${PREFIX}-root3`,
  img3: `${PREFIX}-img3`
};

const StyledModAvatar = styled(ModAvatar)(() => ({
  [`& .${classes.root}`]: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },

  [`& .${classes.img}`]: {
    width: 'auto',
    height: 'auto'
  },

  [`& .${classes.root2}`]: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },

  [`& .${classes.img2}`]: {
    width: '60px',
    height: '60px'
  },

  [`& .${classes.root3}`]: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },

  [`& .${classes.img3}`]: {
    width: '30px',
    height: '30px'
  }
}));

type AvatarIconProps = {
  src: string;
  alt: string;
  size?: 'small' | 'xsmall';
  style?: any;
};

const AvatarIcon: React.FC<AvatarIconProps> = (props: any) => {
  const { src, alt, size } = props;

  if (size) {
    if (size === 'small')
      return (
        <ModAvatarSmall
          src={src}
          alt={alt}
          {...props}
          classes={{
            root: classes.root2,
            img: classes.img2
          }}
        />
      );
    if (size === 'xsmall')
      return (
        <ModAvatarExtraSmall
          src={src}
          alt={alt}
          {...props}
          classes={{
            root: classes.root3,
            img: classes.img3
          }}
        />
      );
  }

  return <StyledModAvatar src={src} alt={alt} {...props} />;
};

export default AvatarIcon;
