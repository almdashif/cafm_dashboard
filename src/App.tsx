import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from "jspdf";
import "jspdf-autotable"; // Ensure this line is added

import './App.css';

type StatusKey = 'Completed' | 'Due' | 'Reported' | 'Started' | 'Total';

const App: React.FC = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [countTable, setCountTable] = useState<Record<StatusKey, any[]>>({
    Completed: [],
    Due: [],
    Reported: [],
    Started: [],
    Total: [],
  });
  const [operativeTable, setOperativeTable] = useState<(string | number)[][]>([]);
  const [dragging, setDragging] = useState(false); // State for handling drag status
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file || !file.name.endsWith('.xlsx')) {
      alert('Please upload a valid .xlsx file.');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const allData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

      const [headers, ...rows] = allData;

      const formattedObjects = rows.map((row) => {
        const obj: Record<string, any> = {};
        headers.forEach((key: string, index: number) => {
          obj[key] = row[index] ?? null;
        });
        return obj;
      });

      const operativeSummaryMap: Record<string, { total: number; completed: number; pending: number }> = {};
      formattedObjects.forEach((row) => {
        const operative = row['Operative'];
        const status = row['Status'];
        if (!operativeSummaryMap[operative]) {
          operativeSummaryMap[operative] = { total: 0, completed: 0, pending: 0 };
        }
        operativeSummaryMap[operative].total++;
        if (status === 'Completed') {
          operativeSummaryMap[operative].completed++;
        } else {
          operativeSummaryMap[operative].pending++;
        }
      });

      const statusGroups: Record<StatusKey, any[]> = {
        Completed: [],
        Due: [],
        Reported: [],
        Started: [],
        Total: [],
      };

      formattedObjects.forEach((row) => {
        const status = row['Status'] as StatusKey;
        if (statusGroups[status]) {
          statusGroups[status].push(row);
        }
      });

      const operativeSummaryData = Object.entries(operativeSummaryMap).map(
        ([operative, { total, completed, pending }]) => [operative, total, completed, pending]
      );

      const grandTotal = Object.values(operativeSummaryMap).reduce(
        (acc, { total, completed, pending }) => {
          acc.total += total;
          acc.completed += completed;
          acc.pending += pending;
          return acc;
        },
        { total: 0, completed: 0, pending: 0 }
      );

      operativeSummaryData.push(['Grand Total', grandTotal.total, grandTotal.completed, grandTotal.pending]);

      statusGroups['Total'] = [...rows];
      setCountTable(statusGroups);
      setTables(formattedObjects);
      setOperativeTable(operativeSummaryData);
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true); // Enable dragging backdrop when file is being dragged
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false); // Disable dragging backdrop when file leaves the drop area
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const renderTable = (data: (string | number)[][], title?: string[]) => (
    <div style={{ margin: '2rem 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr className="theadStyle">
            {title?.map((cell, cellIndex) => (
              <th key={cellIndex} style={{ border: '1px solid #999', padding: '6px' }}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={`${rowIndex === data.length - 1 ? 'tbodyStyle' : ''}`}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={{ border: '1px solid #999', padding: '6px' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const statusSummaryData = Object.entries(countTable).map(([status, items]) => [status, items.length]);


  const downloadAsXLSX = () => {
    // Check if statusSummaryData or operativeTable is empty
    if (statusSummaryData.length === 0 || operativeTable.length === 0) {
      // Show alert if no file has been uploaded yet
      alert('Please upload a valid .xlsx file first.');
      return;
    }

    const rand = Math.floor(10000 + Math.random() * 9000000); // 10-digit number
    const ws1 = XLSX.utils.aoa_to_sheet([['Event Status', 'Count'], ...statusSummaryData]);
    const ws2 = XLSX.utils.aoa_to_sheet([['Mob_Optr', 'No.of.PPM', 'Completed PPM', 'Pending PPM'], ...operativeTable]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Status Summary');
    XLSX.utils.book_append_sheet(wb, ws2, 'Operative Summary');
    XLSX.writeFile(wb, `Summary_${rand}.xlsx`);
  };


  const downloadAsPDF = () => {
    // Check if tables or operativeTable is empty
    if (tables.length === 0 || operativeTable.length === 0) {
      // Show alert if no file has been uploaded yet
      alert('Please upload a valid .xlsx file first.');
      return;
    }

    const rand = Math.floor(10000 + Math.random() * 9000000); // 10-digit number
    const doc = new jsPDF();

    // Set font for the document
    doc.setFont('helvetica');
    doc.setFontSize(12);

    // Add Event Status Summary table
    doc.text('Event Status Summary', 14, 16);
    doc.autoTable({
      startY: 20,
      head: [['Event Status', 'Count']],
      body: statusSummaryData,
      theme: 'striped', // Optional theme
      styles: { cellPadding: 2, fontSize: 10 },
    });

    // Ensure proper finalY value before adding the next table
    const yAfterStatusSummary = doc.autoTable.previous.finalY + 10;

    // Add Operative PPM Summary table
    doc.text('Operative PPM Summary', 14, yAfterStatusSummary);
    doc.autoTable({
      startY: yAfterStatusSummary + 10,
      head: [['Mob_Optr', 'No.of.PPM', 'Completed PPM', 'Pending PPM']],
      body: operativeTable,
      theme: 'striped', // Optional theme
      styles: { cellPadding: 2, fontSize: 10 },
    });

    // Save the PDF with a random file name
    doc.save(`Summary_${rand}.pdf`);
  };

  const downloadAsCSV = () => {
    if (statusSummaryData.length === 0 || operativeTable.length === 0) {
      alert('Please upload a valid .xlsx file first.');
      return;
    }

    const rand = Math.floor(10000 + Math.random() * 9000000); // Unique file identifier

    // Convert each section to CSV string
    const statusCSV = [
      ['Event Status', 'Count'],
      ...statusSummaryData
    ]
      .map((row) => row.join(','))
      .join('\n');

    const operativeCSV = [
      ['Mob_Optr', 'No.of.PPM', 'Completed PPM', 'Pending PPM'],
      ...operativeTable
    ]
      .map((row) => row.join(','))
      .join('\n');

    // Combine both CSV sections with an empty line between
    const fullCSV = `${statusCSV}\n\n${operativeCSV}`;

    // Trigger download
    const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Summary_${rand}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div style={{ padding: '2rem', position: 'relative' }}>
      {/* Download Button */}
      <div className='btnContainer'>
        <button onClick={downloadAsXLSX} >
          Download XLSX
        </button>
        {/* <button onClick={downloadAsPDF}>Download PDF</button> */}
        <button onClick={downloadAsCSV} >Download CSV</button>

      </div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{ padding: '2rem', position: 'relative' }}
      >
        {dragging && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '2rem',
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}>
            Drop your file here...
          </div>
        )}

        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #888',
            padding: '2rem',
            textAlign: 'center',
            borderRadius: '8px',
            cursor: 'pointer',
            background: '#f9f9f9',
          }}
        >
          <p>Drag & drop a .xlsx file here, or click to browse</p>
          <input
            type="file"
            accept=".xlsx"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {!loading && Number(statusSummaryData[statusSummaryData.length - 1][1]) > 0 && renderTable(statusSummaryData, ['Event Status', 'Count'])}

        {!loading && operativeTable.length > 0 &&
          renderTable(operativeTable, ['Mob_Optr', 'No.of.PPM', 'Completed PPM', 'Pending PPM'])}
      </div>
    </div>
  );
};

export default App;
