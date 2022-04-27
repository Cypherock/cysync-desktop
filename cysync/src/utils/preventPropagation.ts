/**
 * A pre-function to stop propagation of click events to its parent element.
 *
 * @param fn React click event listener
 */
const prevent = (e: React.MouseEvent) => {
  e.stopPropagation();
  e.nativeEvent.stopImmediatePropagation();
};

export default prevent;
