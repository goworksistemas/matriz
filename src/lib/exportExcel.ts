import ExcelJS from 'exceljs';

interface ExportExcelOptions {
  data: Record<string, unknown>[];
  sheetName: string;
  fileName: string;
  columnWidths?: number[];
}

export async function exportToExcel({
  data,
  sheetName,
  fileName,
  columnWidths,
}: ExportExcelOptions): Promise<void> {
  if (data.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  const headers = Object.keys(data[0]);
  worksheet.addRow(headers);

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: 'center' };

  for (const item of data) {
    worksheet.addRow(headers.map((h) => item[h] ?? ''));
  }

  if (columnWidths) {
    columnWidths.forEach((width, index) => {
      const col = worksheet.getColumn(index + 1);
      col.width = width;
    });
  } else {
    headers.forEach((_, index) => {
      const col = worksheet.getColumn(index + 1);
      col.width = 18;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
