// handleExport.js

export default async function handleExport(
  fileName,
  cleanedTransaksionet,
  cleanedPagesat
) {
  const sheets = [
    { name: 'Përmbledhje', data: cleanedTransaksionet }
  ];

  if (Array.isArray(cleanedPagesat) && cleanedPagesat.length > 0) {
    sheets.push({ name: 'Pagesat', data: cleanedPagesat });
  }

  const payload = { fileName, sheets };
  return await window.api.saveExcel(payload);
}
