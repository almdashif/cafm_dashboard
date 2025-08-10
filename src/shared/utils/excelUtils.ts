import { ExcelRow, PriorityCodeInfo } from '../types';

export const detectPriorityCode = (headers: string[]): PriorityCodeInfo => {
  const priorityCodeHeader = headers.find(header => 
    header.toLowerCase().includes('priority') || 
    header.toLowerCase().includes('code')
  );

  if (!priorityCodeHeader) {
    return {
      isPriorityCodeP11OrP15: false,
      isOtherPriorityCode: false,
      priorityCodeValue: null,
    };
  }

  // This is a simplified logic - in production, you'd want more sophisticated detection
  const isPriorityCodeP11OrP15 = headers.some(header => 
    header.toLowerCase().includes('mob_optr') || 
    header.toLowerCase().includes('ppm')
  );

  const isOtherPriorityCode = headers.some(header => 
    header.toLowerCase().includes('wo status') || 
    header.toLowerCase().includes('work order')
  );

  return {
    isPriorityCodeP11OrP15,
    isOtherPriorityCode,
    priorityCodeValue: priorityCodeHeader,
  };
};

export const processOperativeSummary = (data: ExcelRow[]): (string | number)[][] => {
  // Simplified operative summary processing
  // In production, this would have more complex logic based on business requirements
  const summary = data.reduce((acc, row) => {
    const operator = row['Mob_Optr'] || 'Unknown';
    const existing = acc.find((item: [string, number]) => item[0] === operator);
    
    if (existing) {
      existing[1] = (existing[1] as number) + 1;
      existing[2] = (existing[2] as number) + (row['Status'] === 'Completed' ? 1 : 0);
      existing[3] = (existing[3] as number) + (row['Status'] !== 'Completed' ? 1 : 0);
    } else {
      acc.push([
        operator,
        1,
        row['Status'] === 'Completed' ? 1 : 0,
        row['Status'] !== 'Completed' ? 1 : 0,
      ]);
    }
    
    return acc;
  }, [] as any);

  return summary;
};

export const processStatusGroups = (data: ExcelRow[]): any => {
  const groups = {
    Completed: [] as ExcelRow[],
    Due: [] as ExcelRow[],
    Reported: [] as ExcelRow[],
    Started: [] as ExcelRow[],
    Total: data,
  };

  data.forEach(row => {
    const status = row['Status'] || row['WO Status'] || 'Unknown';
    
    if (status.toLowerCase().includes('complete')) {
      groups.Completed.push(row);
    } else if (status.toLowerCase().includes('due')) {
      groups.Due.push(row);
    } else if (status.toLowerCase().includes('report')) {
      groups.Reported.push(row);
    } else if (status.toLowerCase().includes('start')) {
      groups.Started.push(row);
    }
  });

  return groups;
};

export const processWorkflowStatus = (data: ExcelRow[]): (string | number)[][] => {
  // Process workflow status data
  const statusCounts = data.reduce((acc, row) => {
    const status = row['WO Status'] || 'Unknown';
    const existing = acc.find((item:[string, number])  => item[0] === status);
    
    if (existing) {
      existing[1] = (existing[1] as number) + 1;
    } else {
      acc.push([status, 1]);
    }
    
    return acc;
  }, [] as any);

  return statusCounts;
};
