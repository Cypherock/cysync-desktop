/**
 * A wrapper function to stop propagation of click events to its parent element.
 *
 * @param fn React click event listener
 */
const prevent = (fn: any) => {
  return (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    fn(e);
  };
};

export default prevent;
