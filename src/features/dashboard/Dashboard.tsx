import React from 'react';
import { useAuth } from '../../app/providers/AuthContext';
import { useFileHandler } from '../../shared/hooks/useFileHandler';
import { exportToXLSX, exportToPDF, exportToCSV } from '../../shared/utils/exportUtils';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const {
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
  } = useFileHandler();

  const renderTable = (data: (string | number)[][] | any[], headers: string[]) => {
    if (!data || data.length === 0) return null;

    return (
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.isArray(row) ? (
                    row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))
                  ) : (
                    headers.map((header, cellIndex) => (
                      <td key={cellIndex}>{row[header]}</td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleDownloadXLSX = () => {
    const statusSummaryData = Object.entries(countTable)
      .filter(([key]) => key !== 'Total')
      .map(([status, data]) => [status, data.length]);

    exportToXLSX(statusSummaryData, operativeTable, otherPriorityTable, priorityCodeValue);
  };

  const handleDownloadPDF = () => {
    const statusSummaryData = Object.entries(countTable)
      .filter(([key]) => key !== 'Total')
      .map(([status, data]) => [status, data.length]);

    exportToPDF(statusSummaryData, operativeTable, otherPriorityTable, priorityCodeValue);
  };

  const handleDownloadCSV = () => {
    const statusSummaryData = Object.entries(countTable)
      .filter(([key]) => key !== 'Total')
      .map(([status, data]) => [status, data.length]);

    exportToCSV(statusSummaryData, operativeTable, otherPriorityTable, priorityCodeValue);
  };

  const getStatusCount = (status: string) => {
    return countTable[status as keyof typeof countTable]?.length || 0;
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <img src="/logo.jpeg" alt="CAFM Logo" className="header-logo" />
              <h1 className="dashboard-title">CAFM Dashboard</h1>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="user-details">
                <span className="username">Welcome, {user?.username}!</span>
                <button onClick={logout} className="logout-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Stats Cards */}
        {!loading && (tables.length > 0 || operativeTable.length > 0) && (
          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon completed">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.76488 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{getStatusCount('Completed')}</h3>
                  <p className="stat-label">Completed</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon pending">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{getStatusCount('Started')}</h3>
                  <p className="stat-label">In Progress</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon due">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.82 20H20.18A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{getStatusCount('Due')}</h3>
                  <p className="stat-label">Due</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon total">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{getStatusCount('Total')}</h3>
                  <p className="stat-label">Total Tasks</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="upload-section">
          <div
            className={`drop-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="drop-zone-content">
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="upload-title">Drag & Drop Excel File Here</h3>
              <p className="upload-subtitle">or</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
              />
              <button
                className="browse-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </button>
              <p className="file-types">Supported: .xlsx, .xls</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <p className="loading-text">Processing file...</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {!loading && (tables.length > 0 || operativeTable.length > 0) && (
          <div className="results-section">
            {/* Export Controls */}
            <div className="export-controls">
              <div className="export-buttons">
                <button onClick={handleDownloadXLSX} className="export-btn xlsx">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download XLSX
                </button>
                <button onClick={handleDownloadPDF} className="export-btn pdf">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download PDF
                </button>
                <button onClick={handleDownloadCSV} className="export-btn csv">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download CSV
                </button>
              </div>
              <button onClick={handleReset} className="reset-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.49 9C19.2214 7.33125 17.4587 6.00181 15.407 5.13257C13.3554 4.26333 11.095 3.88379 8.81562 4.0315C6.53625 4.17921 4.36598 4.84918 2.48999 5.97836C0.613995 7.10754 -0.897232 8.65922 -1.7328 10.4117C-2.56837 12.1642 -2.61042 14.0612 -1.85391 15.8419C-1.0974 17.6226 0.435435 19.2228 2.34367 20.4127C4.2519 21.6026 6.45683 22.3329 8.73653 22.5264C11.0162 22.7199 13.2931 22.3722 15.407 21.5148C17.5209 20.6574 19.4026 19.3201 20.79 17.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Reset
              </button>
            </div>

            {/* Data Tables */}
            <div className="tables-container">
              {Object.entries(countTable)
                .filter(([key, data]) => key !== 'Total' && data.length > 0)
                .map(([status, data]) => (
                  <div key={status} className="data-card">
                    <div className="card-header">
                      <h3 className="card-title">{status} ({data.length})</h3>
                    </div>
                    <div className="card-content">
                      {renderTable(data, Object.keys(data[0] || {}))}
                    </div>
                  </div>
                ))}

              {operativeTable.length > 0 && (
                <div className="data-card">
                  <div className="card-header">
                    <h3 className="card-title">Operative Summary</h3>
                  </div>
                  <div className="card-content">
                    {renderTable(operativeTable, ['Mob_Optr', 'No.of.PPM', 'Completed PPM', 'Pending PPM'])}
                  </div>
                </div>
              )}

              {!loading && otherPriorityTable.length > 0 && priorityCodeValue && (
                <div className="data-card">
                  <div className="card-header">
                    <h3 className="card-title">{priorityCodeValue} STATUS</h3>
                  </div>
                  <div className="card-content">
                    {renderTable(otherPriorityTable, ['WO Status', 'No.of.Events'])}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
