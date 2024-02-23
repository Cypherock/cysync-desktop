// tslint:disable-next-line: no-any
const jsonToCSV = (objArray: any) => {
  const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
  let str = '';

  for (let i = 0; i < array.length; i++) {
    let line = '';
    for (const index of Object.keys(array[i])) {
      if (line !== '') line += ',';

      line += array[i][index];
    }

    str += line + '\r\n';
  }

  return str;
};

// tslint:disable-next-line: no-any
export default function csvDownloader(data: any, filename: string) {
  const csvContent = jsonToCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
