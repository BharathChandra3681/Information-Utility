'use client';

import { useState, useEffect } from 'react';

export default function BorrowerDashboard() {
  const [activeTab, setActiveTab] = useState('pending-review');
  const [loanRecords, setLoanRecords] = useState({
    pending: [
      {
        id: 'TXN004',
        creditor: 'HDFC Bank Ltd',
        submittedDate: '2024-01-15',
        deadline: '2024-01-29',
        period: '2023-06-15 to 2025-06-15',
        status: 'Active',
        amount: '₹500 Crore',
        assets: 'Prime commercial properties in Mumbai and Delhi, machinery worth ₹200 Cr',
        balanceSheet: 'Total Assets: ₹1200 Cr, Liabilities: ₹800 Cr, Equity: ₹400 Cr',
        liabilities: 'Term loan from SBI: ₹300 Cr, Working capital from ICICI: ₹150 Cr'
      },
      {
        id: 'TXN005',
        creditor: 'State Bank of India',
        submittedDate: '2024-01-18',
        deadline: '2024-02-01',
        period: '2023-09-01 to 2026-09-01',
        status: 'Restructured',
        amount: '₹250 Crore',
        assets: 'Manufacturing units in Gujarat, inventory worth ₹100 Cr',
        balanceSheet: 'Total Assets: ₹800 Cr, Liabilities: ₹600 Cr, Equity: ₹200 Cr',
        liabilities: 'Housing loan from HDFC: ₹80 Cr, Equipment financing: ₹120 Cr'
      }
    ],
    confirmed: [
      {
        id: 'TXN002',
        creditor: 'HDFC Bank Ltd',
        submittedDate: '2024-01-10',
        confirmedDate: '2024-01-12',
        amount: '₹300 Crore',
        status: 'Confirmed'
      },
      {
        id: 'TXN006',
        creditor: 'ICICI Bank Ltd',
        submittedDate: '2024-01-11',
        confirmedDate: '2024-01-14',
        amount: '₹180 Crore',
        status: 'Confirmed'
      }
    ],
    rejected: [
      {
        id: 'TXN003',
        creditor: 'Axis Bank Ltd',
        submittedDate: '2024-01-08',
        rejectedDate: '2024-01-11',
        amount: '₹400 Crore',
        status: 'Rejected',
        reason: 'Incorrect loan amount reported. Actual disbursed amount was ₹350 Crore.'
      }
    ]
  });

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'Corporate Debtor') {
      alert('Unauthorized access. Please login as Corporate Debtor.');
      window.location.href = '/';
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/';
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  const handleConfirm = (recordId) => {
    const record = loanRecords.pending.find(r => r.id === recordId);
    if (record) {
      setLoanRecords(prev => ({
        ...prev,
        pending: prev.pending.filter(r => r.id !== recordId),
        confirmed: [...prev.confirmed, { ...record, confirmedDate: new Date().toISOString().split('T')[0], status: 'Confirmed' }]
      }));
    }
  };

  const handleReject = (recordId) => {
    const record = loanRecords.pending.find(r => r.id === recordId);
    if (record) {
      const reason = prompt('Please provide a reason for rejection:');
      if (reason) {
        setLoanRecords(prev => ({
          ...prev,
          pending: prev.pending.filter(r => r.id !== recordId),
          rejected: [...prev.rejected, { ...record, rejectedDate: new Date().toISOString().split('T')[0], status: 'Rejected', reason }]
        }));
      }
    }
  };

  const getTabCounts = () => ({
    pending: loanRecords.pending.length,
    confirmed: loanRecords.confirmed.length,
    rejected: loanRecords.rejected.length
  });

  const counts = getTabCounts();

  return (
    <div className="font-inter bg-gray-50 min-h-screen">
      <nav className="navbar bg-white shadow-md sticky top-0 z-50 p-4 flex justify-between items-center">
        <div className="container nav-container flex items-center gap-4">
          <div className="logo font-bold text-blue-800 text-xl select-none">🔗 BlockchainIU</div>
          <button
            id="logoutBtn"
            onClick={logout}
            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Corporate Debtor Dashboard</h1>
        <p className="mb-6 text-gray-700">Reliance Capital Ltd - Review and manage submitted loan records</p>

        <section className="overview-cards grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-lg font-bold mb-2">Pending Review</h3>
            <p className="card-number text-3xl font-bold text-yellow-600">{counts.pending}</p>
            <p>Requires your attention</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-lg font-bold mb-2">Confirmed</h3>
            <p className="card-number text-3xl font-bold text-green-600">{counts.confirmed}</p>
            <p>Successfully verified</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-lg font-bold mb-2">Rejected</h3>
            <p className="card-number text-3xl font-bold text-red-600">{counts.rejected}</p>
            <p>Disputed records</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-lg font-bold mb-2">Total Exposure</h3>
            <p className="card-number text-3xl font-bold text-blue-600">₹1.2K Cr</p>
            <p>Across all creditors</p>
          </div>
        </section>

        <section className="dashboard-tabs flex gap-2 mb-6">
          {['pending-review', 'confirmed', 'rejected'].map(tab => (
            <button
              key={tab}
              className={`tab px-4 py-2 rounded-lg font-semibold ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => switchTab(tab)}
            >
              {tab.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} ({counts[tab.replace('-review', '')]})
            </button>
          ))}
        </section>

        <section className="dashboard-content">
          {activeTab === 'pending-review' && (
            <div>
              {loanRecords.pending.map(record => (
                <div key={record.id} className="loan-record border border-gray-200 rounded-lg p-6 mb-4 bg-white shadow">
                  <h2 className="text-xl font-bold mb-2">{record.creditor}</h2>
                  <p className="text-sm text-gray-600 mb-1">Transaction ID: {record.id}</p>
                  <p className="text-sm text-gray-600 mb-1">Submitted Date: {record.submittedDate}</p>
                  <p className="text-sm text-gray-600 mb-1">Review Deadline: {record.deadline}</p>
                  <p className="text-sm text-gray-600 mb-1">Loan Period: {record.period}</p>
                  <p className="text-sm text-gray-600 mb-1">Current Status: {record.status}</p>
                  <span className="status pending-review bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold mb-2 inline-block">
                    Review Required
                  </span>
                  <p className="text-sm mb-2"><strong>Amount:</strong> {record.amount}</p>
                  <p className="text-sm mb-2"><strong>Asset Records:</strong> {record.assets}</p>
                  <p className="text-sm mb-2"><strong>Balance Sheet Summary:</strong> {record.balanceSheet}</p>
                  <p className="text-sm mb-4"><strong>Existing Liabilities:</strong> {record.liabilities}</p>
                  <div className="action-buttons flex gap-4">
                    <button
                      onClick={() => handleReject(record.id)}
                      className="btn bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      Reject Record
                    </button>
                    <button
                      onClick={() => handleConfirm(record.id)}
                      className="btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Confirm Record
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'confirmed' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Confirmed Loan Records</h3>
              <p className="mb-4">Records you have confirmed and verified</p>
              {loanRecords.confirmed.map(record => (
                <div key={record.id} className="loan-item border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{record.creditor}</strong><br />
                      Transaction ID: {record.id}<br />
                      Amount <strong>{record.amount}</strong><br />
                      Submitted <strong>{record.submittedDate}</strong><br />
                      Confirmed <strong>{record.confirmedDate}</strong>
                    </div>
                    <div>
                      <span className="status confirmed bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                        Confirmed
                      </span>
                      <br />
                      <button className="view-details-btn bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 mt-2">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'rejected' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Rejected Loan Records</h3>
              <p className="mb-4">Records you have disputed or rejected</p>
              {loanRecords.rejected.map(record => (
                <div key={record.id} className="loan-item border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{record.creditor}</strong><br />
                      Transaction ID: {record.id}<br />
                      Amount <strong>{record.amount}</strong><br />
                      Submitted <strong>{record.submittedDate}</strong><br />
                      Rejected <strong>{record.rejectedDate}</strong>
                    </div>
                    <div>
                      <span className="status rejected bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                        Rejected
                      </span>
                      <br />
                      <button className="view-details-btn bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 mt-2">
                        View Details
                      </button>
                    </div>
                  </div>
                  {record.reason && (
                    <div className="rejection-reason bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 mt-3">
                      <strong>Rejection Reason:</strong> {record.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
