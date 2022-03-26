import Avatar from '@material-ui/core/Avatar';
import { withStyles } from '@material-ui/core/styles';
import React from 'react';

const ModAvatar = withStyles(() => ({
  root: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },
  img: {
    width: 'auto',
    height: 'auto'
  }
}))(Avatar);
const ModAvatarSmall = withStyles(() => ({
  root: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },
  img: {
    width: '60px',
    height: '60px'
  }
}))(Avatar);
const ModAvatarExtraSmall = withStyles(() => ({
  root: {
    height: 'auto',
    width: 'auto',
    margin: '0px 10px'
  },
  img: {
    width: '30px',
    height: '30px'
  }
}))(Avatar);

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
      return <ModAvatarSmall src={src} alt={alt} {...props} />;
    if (size === 'xsmall')
      return <ModAvatarExtraSmall src={src} alt={alt} {...props} />;
  }

  return <ModAvatar src={src} alt={alt} {...props} />;
};

export default AvatarIcon;
