import React, { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../providers/AuthContext";
import { authUtils } from "../../shared/utils/authUtils";

declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

import "./App.css";

type StatusKey = "Completed" | "Due" | "Reported" | "Started" | "Total";

interface PivotEntry {
  status: string;
  count: number;
}

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // P11 / P15 data
  const [countTable, setCountTable] = useState<Record<StatusKey, any[]>>({
    Completed: [],
    Due: [],
    Reported: [],
    Started: [],
    Total: [],
  });
  const [operativeTable, setOperativeTable] = useState<(string | number)[][]>([]);

  // Other priorities pivot data
  const [pivotTables, setPivotTables] = useState<Record<string, PivotEntry[]>>({});

  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update user's last active time
  useEffect(() => {
    // Update immediately when component mounts
    authUtils.updateLastActive();

    // Update every 5 minutes while user is active
    const interval = setInterval(() => {
      authUtils.updateLastActive();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleFile = (file: File) => {
    if (!file || !file.name.endsWith(".xlsx")) {
      alert("Please upload a valid .xlsx file.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: "binary" });
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

      // Split into P11/P15 and others
      const p11OrP15Data = formattedObjects.filter((row) => {
        const code = String(row["Priority Code"] || "").toLowerCase();
        return code === "p11" || code === "p15";
      });

      const otherPrioritiesData = formattedObjects.filter((row) => {
        const code = String(row["Priority Code"] || "").toLowerCase();
        return code && !["p11", "p15"].includes(code);
      });

      // --- P11/P15 Existing Logic ---
      if (p11OrP15Data.length > 0) {
        const operativeSummaryMap: Record<string, { total: number; completed: number; pending: number }> = {};
        p11OrP15Data.forEach((row) => {
          const operative = row["Operative"] ?? "Not Assigned";
          const status = row["Status"];
          if (!operativeSummaryMap[operative]) {
            operativeSummaryMap[operative] = { total: 0, completed: 0, pending: 0 };
          }
          operativeSummaryMap[operative].total++;
          if (status?.toLowerCase() === "completed" || status?.toLowerCase() === "rts") {
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

        p11OrP15Data.forEach((row) => {
          const status = row["Status"] as StatusKey;
          if (status?.toLowerCase() === "rts") {
            statusGroups["Completed"].push(row);
          } else if (statusGroups[status]) {
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

        operativeSummaryData.push(["Grand Total", grandTotal.total, grandTotal.completed, grandTotal.pending]);

        statusGroups["Total"] = [...p11OrP15Data];
        setCountTable(statusGroups);
        setOperativeTable(operativeSummaryData);
      } else {
        setCountTable({
          Completed: [],
          Due: [],
          Reported: [],
          Started: [],
          Total: [],
        });
        setOperativeTable([]);
      }

      // --- Other Priorities Pivot Logic ---
      const pivotDataByPriority: Record<string, PivotEntry[]> = {};
      otherPrioritiesData.forEach((row) => {
        const priority = row["Priority Code"] || "Unknown";
        const status = row["Workflow Status"] || "Unknown";
        if (!pivotDataByPriority[priority]) pivotDataByPriority[priority] = [];
        const existing = pivotDataByPriority[priority].find((s) => s.status === status);
        if (existing) {
          existing.count++;
        } else {
          pivotDataByPriority[priority].push({ status, count: 1 });
        }
      });

      // Add Grand Total rows
      Object.keys(pivotDataByPriority).forEach((priority) => {
        const total = pivotDataByPriority[priority].reduce((sum, s) => sum + s.count, 0);
        pivotDataByPriority[priority].push({ status: "Grand Total", count: total });
      });

      setPivotTables(pivotDataByPriority);
      setTables(formattedObjects);
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  // --- Downloads ---
  const statusSummaryData = Object.entries(countTable).map(([status, items]) => [status, items.length]);

  const downloadAsXLSX = () => {
    if (tables.length === 0) {
      alert("Please upload a valid .xlsx file first.");
      return;
    }
  
    const rand = Math.floor(10000 + Math.random() * 9000000);
    const wb = XLSX.utils.book_new();
  
    // Helper to sanitize sheet names
    const safeSheetName = (name: string) =>
      name.replace(/[:\\\/\?\*\[\]]/g, "").substring(0, 31) || "Sheet";
  
    // P11/P15 sheet
    if (statusSummaryData.length > 0 && operativeTable.length > 0) {
      const ws1 = XLSX.utils.aoa_to_sheet([["Event Status", "Count"], ...statusSummaryData]);
      const ws2 = XLSX.utils.aoa_to_sheet([
        ["Mob_Optr", "No.of.PPM", "Completed PPM", "Pending PPM"],
        ...operativeTable,
      ]);
      XLSX.utils.book_append_sheet(wb, ws1, safeSheetName("Status Summary (P11/P15)"));
      XLSX.utils.book_append_sheet(wb, ws2, safeSheetName("Operative Summary (P11/P15)"));
    }
  
    // Other priorities
    Object.entries(pivotTables).forEach(([priority, entries]) => {
      const ws = XLSX.utils.aoa_to_sheet([["WO Status", "No.of.Events"], ...entries.map((e) => [e.status, e.count])]);
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName(`${priority} STATUS`));
    });
  
    XLSX.writeFile(wb, `Summary_${rand}.xlsx`);
  };
  

  const downloadAsPDF = () => {
    if (tables.length === 0) {
      alert("Please upload a valid .xlsx file first.");
      return;
    }
    const rand = Math.floor(10000 + Math.random() * 9000000);
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(12);

    // P11/P15
    if (statusSummaryData.length > 0 && operativeTable.length > 0) {
      doc.text("Event Status Summary (P11/P15)", 14, 16);
      autoTable(doc, {
        startY: 20,
        head: [["Event Status", "Count"]],
        body: statusSummaryData,
      });
      const yAfter = (doc as any).lastAutoTable.finalY + 10;
      doc.text("Operative PPM Summary (P11/P15)", 14, yAfter);
      autoTable(doc, {
        startY: yAfter + 5,
        head: [["Mob_Optr", "No.of.PPM", "Completed PPM", "Pending PPM"]],
        body: operativeTable,
      });
    }

    // Other priorities
    let y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 20;
    Object.entries(pivotTables).forEach(([priority, entries]) => {
      doc.text(`${priority} STATUS`, 14, y);
      autoTable(doc, {
        startY: y + 5,
        head: [["WO Status", "No.of.Events"]],
        body: entries.map((e) => [e.status, e.count]),
      });
      y = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`Summary_${rand}.pdf`);
  };

  const downloadAsCSV = () => {
    if (tables.length === 0) {
      alert("Please upload a valid .xlsx file first.");
      return;
    }
    const rand = Math.floor(10000 + Math.random() * 9000000);
    let csvContent = "";

    // P11/P15
    if (statusSummaryData.length > 0 && operativeTable.length > 0) {
      csvContent += "Event Status,Count\n";
      csvContent += statusSummaryData.map((row) => row.join(",")).join("\n") + "\n\n";
      csvContent += "Mob_Optr,No.of.PPM,Completed PPM,Pending PPM\n";
      csvContent += operativeTable.map((row) => row.join(",")).join("\n") + "\n\n";
    }

    // Other priorities
    Object.entries(pivotTables).forEach(([priority, entries]) => {
      csvContent += `${priority} STATUS\nWO Status,No.of.Events\n`;
      csvContent += entries.map((e) => `${e.status},${e.count}`).join("\n") + "\n\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Summary_${rand}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    setPivotTables({});
    setLoading(false);
  };

  const renderTable = (data: (string | number)[][], title?: string[]) => (
    <div className="data-card">
      <div className="card-header">
        <h3 className="card-title">{title?.[0] || "Data Table"}</h3>
      </div>
      <div className="card-content">
        <div className="table-container">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {title?.map((cell, i) => (
                    <th key={i}>{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        style={{
                          backgroundColor:
                            cell === "Event Rejected"
                              ? "#be3121"
                              : cell === "Grand Total"
                              ? "#308d46"
                              : "transparent",
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <img src="/logo.jpeg" alt="Logo" className="header-logo" />
              <h1 className="app-title">CAFM Dashboard</h1>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <span className="username">{user?.username}</span>
                <button className="logout-btn" onClick={logout}>
                  Logout
                </button>
              </div>
            </div>
            <div className="export-controls">
              <div className="export-buttons">
                <button className="export-btn xlsx" onClick={downloadAsXLSX}>
                  Download XLSX
                </button>
                <button className="export-btn pdf" onClick={downloadAsPDF}>
                  Download PDF
                </button>
                <button className="export-btn csv" onClick={downloadAsCSV}>
                  Download CSV
                </button>
                <button className="reset-btn" onClick={handleReset}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Upload Section */}
        <section className="upload-section">
          <div
            className={`drop-zone ${dragging ? 'dragging' : ''}`}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files[0]);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-zone-content">
              <div className="upload-icon">📁</div>
              <h2 className="upload-title">Upload Excel File</h2>
              <p className="upload-subtitle">Drag & drop a .xlsx file here, or click to browse</p>
              <button className="browse-btn">Choose File</button>
              <p className="file-types">Supported format: .xlsx</p>
            </div>
            <input
              type="file"
              accept=".xlsx"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
              style={{ display: "none" }}
            />
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <p className="loading-text">Processing your file...</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {!loading && (statusSummaryData.length > 0 || Object.keys(pivotTables).length > 0) && (
          <section className="results-section">
            <div className="tables-container">
              {/* P11/P15 Tables */}
              {statusSummaryData.length > 0 && operativeTable.length > 0 && (
                <>
                  {renderTable(statusSummaryData, ["Event Status", "Count"])}
                  {renderTable(operativeTable, ["Mob_Optr", "No.of.PPM", "Completed PPM", "Pending PPM"])}
                </>
              )}

              {/* Other priorities pivot tables */}
              {Object.entries(pivotTables).map(([priority, entries]) =>
                renderTable(
                  entries.map((e) => [e.status, e.count]),
                  [`${priority} STATUS`, "No.of.Events"]
                )
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
