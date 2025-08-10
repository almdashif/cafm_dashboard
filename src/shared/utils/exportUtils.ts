import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToXLSX = (
  statusSummaryData: (string | number)[][],
  operativeTable: (string | number)[][],
  otherPriorityTable: (string | number)[][],
  priorityCodeValue: string | null
) => {
  const workbook = XLSX.utils.book_new();
  
  // Status Summary Sheet
  if (statusSummaryData.length > 0) {
    const statusSheet = XLSX.utils.aoa_to_sheet([
      ['Status', 'Count'],
      ...statusSummaryData
    ]);
    XLSX.utils.book_append_sheet(workbook, statusSheet, 'Status Summary');
  }
  
  // Operative Summary Sheet
  if (operativeTable.length > 0) {
    const operativeSheet = XLSX.utils.aoa_to_sheet([
      ['Mob_Optr', 'No.of.PPM', 'Completed PPM', 'Pending PPM'],
      ...operativeTable
    ]);
    XLSX.utils.book_append_sheet(workbook, operativeSheet, 'Operative Summary');
  }
  
  // Other Priority Sheet
  if (otherPriorityTable.length > 0) {
    const otherPrioritySheet = XLSX.utils.aoa_to_sheet([
      ['WO Status', 'No.of.Events'],
      ...otherPriorityTable
    ]);
    XLSX.utils.book_append_sheet(workbook, otherPrioritySheet, `${priorityCodeValue || 'Other'} Status`);
  }
  
  XLSX.writeFile(workbook, 'cafm_dashboard_export.xlsx');
};

export const exportToPDF = (
  statusSummaryData: (string | number)[][],
  operativeTable: (string | number)[][],
  otherPriorityTable: (string | number)[][],
  priorityCodeValue: string | null
) => {
  const doc = new jsPDF();
  
  let yPosition = 20;
  
  // Title
  doc.setFontSize(20);
  doc.text('CAFM Dashboard Report', 20, yPosition);
  yPosition += 20;
  
  // Status Summary
  if (statusSummaryData.length > 0) {
    doc.setFontSize(16);
    doc.text('Status Summary', 20, yPosition);
    yPosition += 10;
    
    const statusTableData = statusSummaryData.map(row => [row[0], row[1]]);
    (doc as any).autoTable({
      startY: yPosition,
      head: [['Status', 'Count']],
      body: statusTableData,
      margin: { top: 20 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Operative Summary
  if (operativeTable.length > 0) {
    doc.setFontSize(16);
    doc.text('Operative Summary', 20, yPosition);
    yPosition += 10;
    
    const operativeTableData = operativeTable.map(row => [row[0], row[1], row[2], row[3]]);
    (doc as any).autoTable({
      startY: yPosition,
      head: [['Mob_Optr', 'No.of.PPM', 'Completed PPM', 'Pending PPM']],
      body: operativeTableData,
      margin: { top: 20 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Other Priority
  if (otherPriorityTable.length > 0) {
    doc.setFontSize(16);
    doc.text(`${priorityCodeValue || 'Other'} Status`, 20, yPosition);
    yPosition += 10;
    
    const otherPriorityTableData = otherPriorityTable.map(row => [row[0], row[1]]);
    (doc as any).autoTable({
      startY: yPosition,
      head: [['WO Status', 'No.of.Events']],
      body: otherPriorityTableData,
      margin: { top: 20 }
    });
  }
  
  doc.save('cafm_dashboard_export.pdf');
};

export const exportToCSV = (
  statusSummaryData: (string | number)[][],
  operativeTable: (string | number)[][],
  otherPriorityTable: (string | number)[][],
  priorityCodeValue: string | null
) => {
  let csvContent = 'data:text/csv;charset=utf-8,';
  
  // Status Summary
  if (statusSummaryData.length > 0) {
    csvContent += 'Status Summary\n';
    csvContent += 'Status,Count\n';
    statusSummaryData.forEach(row => {
      csvContent += `${row[0]},${row[1]}\n`;
    });
    csvContent += '\n';
  }
  
  // Operative Summary
  if (operativeTable.length > 0) {
    csvContent += 'Operative Summary\n';
    csvContent += 'Mob_Optr,No.of.PPM,Completed PPM,Pending PPM\n';
    operativeTable.forEach(row => {
      csvContent += `${row[0]},${row[1]},${row[2]},${row[3]}\n`;
    });
    csvContent += '\n';
  }
  
  // Other Priority
  if (otherPriorityTable.length > 0) {
    csvContent += `${priorityCodeValue || 'Other'} Status\n`;
    csvContent += 'WO Status,No.of.Events\n';
    otherPriorityTable.forEach(row => {
      csvContent += `${row[0]},${row[1]}\n`;
    });
  }
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'cafm_dashboard_export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
