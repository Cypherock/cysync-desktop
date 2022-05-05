/**
 * A pre-function to stop propagation of any React event to its parent element.
 *
 * @param e React event
 */
const prevent = (e: React.SyntheticEvent) => {
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
};

export default prevent;
