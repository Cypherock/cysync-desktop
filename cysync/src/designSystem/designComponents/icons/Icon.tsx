import PropTypes from 'prop-types';
import React from 'react';

type Props = {
  color?: string;
  size?: number;
  icon?: string;
  style?: React.CSSProperties;
  iconGroup?: JSX.Element | JSX.Element[];
  viewBox?: string;
  className?: string | undefined;
  pathStyles?: object | undefined;
  height?: number;
};

const Icon: React.FC<Props> = props => {
  const {
    color,
    className,
    style,
    height,
    size,
    pathStyles,
    viewBox,
    iconGroup,
    icon
  } = props;

  const styles = {
    svg: {
      display: 'inline-block',
      verticalAlign: 'middle',
      margin: '0px 10px'
    },
    path: {
      fill: color
    }
  };

  return (
    <svg
      className={className}
      style={style || styles.svg}
      width={`${size}px`}
      height={height ? `${height}px` : `${size}px`}
      viewBox={!viewBox ? '0 0 1024 1024' : viewBox}
    >
      {icon ? (
        <path style={styles.path} d={icon} {...pathStyles} />
      ) : (
        {
          ...iconGroup
        }
      )}
    </svg>
  );
};

Icon.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
  icon: PropTypes.string,
  style: PropTypes.any,
  iconGroup: PropTypes.any,
  viewBox: PropTypes.string,
  className: PropTypes.string,
  pathStyles: PropTypes.object,
  height: PropTypes.number
};

Icon.defaultProps = {
  color: undefined,
  size: 16,
  icon: undefined,
  style: undefined,
  iconGroup: undefined,
  viewBox: undefined,
  className: undefined,
  pathStyles: undefined,
  height: undefined
};

export default Icon;
