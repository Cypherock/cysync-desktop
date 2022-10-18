export function ellipsisMiddle(str: string, size: number): string {
  if (str.length > size) {
    return (
      str.substr(0, size / 2) +
      '...' +
      str.substr(str.length - size / 2, str.length)
    );
  }
  return str;
}
