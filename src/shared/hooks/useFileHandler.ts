import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ExcelRow, StatusGroups } from '../types';
import { detectPriorityCode, processOperativeSummary, processStatusGroups, processWorkflowStatus } from '../utils/excelUtils';

export const useFileHandler = () => {
  const [tables, setTables] = useState<ExcelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [countTable, setCountTable] = useState<StatusGroups>({
    Completed: [],
    Due: [],
    Reported: [],
    Started: [],
    Total: [],
  });
  const [operativeTable, setOperativeTable] = useState<(string | number)[][]>([]);
  const [otherPriorityTable, setOtherPriorityTable] = useState<(string | number)[][]>([]);
  const [priorityCodeValue, setPriorityCodeValue] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    
    try {
      const data = await readExcelFile(file);
      const { headers, rows } = data;
      
      const priorityInfo = detectPriorityCode(headers);
      const formattedObjects = formatExcelData(rows, headers);
      
      let operativeSummaryData: (string | number)[][] = [];
      let otherPriorityData: (string | number)[][] = [];
      
      if (priorityInfo.isPriorityCodeP11OrP15) {
        // For P11/P15: Use operative summary logic
        // Fix: Remove undefined from processOperativeSummary result
        operativeSummaryData = processOperativeSummary(formattedObjects).map(row =>
          row.filter((cell): cell is string | number => cell !== undefined)
        );
        const statusGroups = processStatusGroups(formattedObjects);
        setCountTable(statusGroups);
      } else if (priorityInfo.isOtherPriorityCode) {
        // For P12/P13/P14/P16: Use workflow status logic
        otherPriorityData = processWorkflowStatus(formattedObjects);
        setCountTable({
          Completed: [],
          Due: [],
          Reported: [],
          Started: [],
          Total: formattedObjects,
        });
      } else {
        // Default logic for non-priority files
        // Fix: Remove undefined from processOperativeSummary result
        operativeSummaryData = processOperativeSummary(formattedObjects).map(row =>
          row.filter((cell): cell is string | number => cell !== undefined)
        );
        // Fix: processStatusGroups expects only one argument
        const statusGroups = processStatusGroups(formattedObjects);
        setCountTable(statusGroups);
      }
      setTables(formattedObjects);
      setOperativeTable(operativeSummaryData);
      setOtherPriorityTable(otherPriorityData);
      setPriorityCodeValue(priorityInfo.priorityCodeValue);
      
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const readExcelFile = (file: File): Promise<{ headers: string[]; rows: any[][] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const allData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (allData.length === 0) {
            reject(new Error('File is empty'));
            return;
          }
          
          const [headers, ...rows] = allData;
          resolve({ headers: headers as string[], rows });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const formatExcelData = (rows: any[][], headers: string[]): ExcelRow[] => {
    return rows.map((row) => {
      const obj: ExcelRow = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  };

  const handleReset = () => {
    setTables([]);
    setCountTable({
      Completed: [],
      Due: [],
      Reported: [],
      Started: [],
      Total: [],
    });
    setOperativeTable([]);
    setOtherPriorityTable([]);
    setPriorityCodeValue(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
    );
    
    if (excelFile) {
      handleFile(excelFile);
    } else {
      alert('Please drop an Excel file (.xlsx or .xls)');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return {
    tables,
    loading,
    countTable,
    operativeTable,
    otherPriorityTable,
    priorityCodeValue,
    dragging,
    fileInputRef,
    handleReset,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
  };
};
