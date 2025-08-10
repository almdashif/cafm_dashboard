import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    <div style={{ margin: "2rem 0" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr className="theadStyle">
            {title?.map((cell, i) => (
              <th key={i} style={{ border: "1px solid #999", padding: "6px" }}>
                {cell}
              </th>
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
                    border: "1px solid #999",
                    padding: "6px",
                    backgroundColor:
                      cell === "Event Rejected"
                        ? "#f8d7da"
                        : cell === "Grand Total"
                        ? "#d4edda"
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
  );

  return (
    <div className="mainContainer">
      <header>
        <div className="logoContainer">
          <img src="/logo.jpeg" alt="" />
        </div>
        <div className="btnContainer">
          <button onClick={downloadAsXLSX}>Download XLSX</button>
          <button onClick={downloadAsPDF}>Download PDF</button>
          <button onClick={downloadAsCSV}>Download CSV</button>
          <button onClick={handleReset} style={{ backgroundColor: "red" }}>
            Reset
          </button>
        </div>
      </header>

      <div
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
        style={{ padding: "2rem", position: "relative" }}
      >
        {dragging && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "2rem",
              fontWeight: "bold",
              pointerEvents: "none",
            }}
          >
            Drop your file here...
          </div>
        )}

        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed #888",
            padding: "2rem",
            textAlign: "center",
            borderRadius: "8px",
            cursor: "pointer",
            background: "#f9f9f9",
          }}
        >
          <p>Drag & drop a .xlsx file here, or click to browse</p>
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

        {loading && (
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {/* P11/P15 Tables */}
        {!loading && statusSummaryData.length > 0 && operativeTable.length > 0 && (
          <>
            {renderTable(statusSummaryData, ["Event Status", "Count"])}
            {renderTable(operativeTable, ["Mob_Optr", "No.of.PPM", "Completed PPM", "Pending PPM"])}
          </>
        )}

        {/* Other priorities pivot tables */}
        {!loading &&
          Object.entries(pivotTables).map(([priority, entries]) =>
            renderTable(
              entries.map((e) => [e.status, e.count]),
              [`${priority} (WO STATUS)`, "No.of.Events"]
            )
          )}
      </div>
    </div>
  );
};

export default App;
