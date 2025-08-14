'use client';

import { useState, useEffect } from 'react';

export default function BorrowerDashboard() {
  const [activeTab, setActiveTab] = useState('pending-review');
  const [loanRecords, setLoanRecords] = useState({ pending: [], confirmed: [], rejected: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'Corporate Debtor') {
      alert('Unauthorized access. Please login as Corporate Debtor.');
      window.location.href = '/';
      return;
    }
    loadLoans();
    const onVis = () => { if (document.visibilityState === 'visible') loadLoans(); };
    document.addEventListener('visibilitychange', onVis);
    const timer = setInterval(loadLoans, 15000);
    return () => { document.removeEventListener('visibilitychange', onVis); clearInterval(timer); };
  }, []);

  const logout = () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/';
  };

  const loadLoans = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/loans?org=debtor&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      const all = Array.isArray(data) ? data.filter(r => r.docType === 'SimpleLoan') : [];
      const pending = all.filter(r => r.status === 'awaiting-borrower');
      const confirmed = all.filter(r => r.status === 'confirmed');
      const rejected = all.filter(r => r.status === 'rejected-by-borrower' || r.status === 'rejected-by-admin');
      setLoanRecords({ pending, confirmed, rejected });
    } catch (_) {
      setLoanRecords({ pending: [], confirmed: [], rejected: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (loanId) => {
    try {
      await fetch(`/api/loans/${encodeURIComponent(loanId)}/borrower/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org: 'debtor' }),
      });
      await loadLoans();
    } catch {
      alert('Approval failed');
    }
  };

  const handleReject = async (loanId) => {
    try {
      await fetch(`/api/loans/${encodeURIComponent(loanId)}/borrower/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected by borrower', org: 'debtor' }),
      });
      await loadLoans();
    } catch {
      alert('Rejection failed');
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
        <p className="mb-6 text-gray-700">Review and manage submitted loan records</p>

        <section className="overview-cards grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-2">Pending Review</h3>
            <p className="text-3xl font-bold text-yellow-600">{counts.pending}</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-2">Confirmed</h3>
            <p className="text-3xl font-bold text-green-600">{counts.confirmed}</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-2">Rejected</h3>
            <p className="text-3xl font-bold text-red-600">{counts.rejected}</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-2">Total Exposure</h3>
            <p className="text-3xl font-bold text-blue-600">—</p>
          </div>
        </section>

        <section className="dashboard-tabs flex gap-2 mb-6">
          {['pending-review', 'confirmed', 'rejected'].map(tab => (
            <button
              key={tab}
              className={`tab px-4 py-2 rounded-lg font-semibold ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} ({counts[tab.replace('-review', '')]})
            </button>
          ))}
        </section>

        <section className="dashboard-content">
          {activeTab === 'pending-review' && (
            <div>
              {loanRecords.pending.map(record => (
                <div key={record.loanId || record.transactionId} className="loan-record border border-gray-200 rounded-lg p-6 mb-4 bg-white shadow">
                  <h2 className="text-xl font-bold mb-2">{record.creditorName || 'Creditor'}</h2>
                  <p className="text-sm text-gray-600 mb-1">Loan ID: {record.loanId || record.transactionId}</p>
                  <p className="text-sm text-gray-600 mb-1">Submitted Date: {(record.submittedAt || record.loanStartDate || '').slice(0,10)}</p>
                  <p className="text-sm text-gray-600 mb-1">Loan Period: {(record.loanStartDate || '') + (record.maturityDate ? ` → ${record.maturityDate}` : '')}</p>
                  <p className="text-sm text-gray-600 mb-1">Current Status: Awaiting Your Approval</p>
                  <p className="text-sm mb-2"><strong>Amount:</strong> {record.loanAmount}</p>
                  <p className="text-sm mb-2"><strong>Asset Records:</strong> {record.assetRecords || record.assets || '-'}</p>
                  <p className="text-sm mb-2"><strong>Balance Sheet Summary:</strong> {record.balanceSheet || '-'}</p>
                  <p className="text-sm mb-4"><strong>Existing Liabilities:</strong> {record.existingLiabilities || '-'}</p>
                  <div className="action-buttons flex gap-4">
                    <button onClick={() => handleReject(record.loanId || record.transactionId)} className="btn bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Reject Record</button>
                    <button onClick={() => handleConfirm(record.loanId || record.transactionId)} className="btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Confirm Record</button>
                  </div>
                </div>
              ))}
              {!loanRecords.pending.length && <div className="text-gray-500">No records pending your review</div>}
            </div>
          )}

          {activeTab === 'confirmed' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Confirmed Loan Records</h3>
              <p className="mb-4">Records you have confirmed and verified</p>
              {loanRecords.confirmed.map(record => (
                <div key={record.loanId || record.transactionId} className="loan-item border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{record.creditorName || 'Creditor'}</strong><br />
                      Loan ID: {record.loanId || record.transactionId}<br />
                      Amount <strong>{record.loanAmount}</strong><br />
                      Submitted <strong>{(record.submittedAt || record.loanStartDate || '').slice(0,10)}</strong>
                    </div>
                    <div>
                      <span className="status confirmed bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Confirmed</span>
                    </div>
                  </div>
                </div>
              ))}
              {!loanRecords.confirmed.length && <div className="text-gray-500">No confirmed records</div>}
            </div>
          )}

          {activeTab === 'rejected' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Rejected Loan Records</h3>
              <p className="mb-4">Records you have disputed or rejected</p>
              {loanRecords.rejected.map(record => (
                <div key={record.loanId || record.transactionId} className="loan-item border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{record.creditorName || 'Creditor'}</strong><br />
                      Loan ID: {record.loanId || record.transactionId}<br />
                      Amount <strong>{record.loanAmount}</strong><br />
                      Submitted <strong>{(record.submittedAt || record.loanStartDate || '').slice(0,10)}</strong>
                    </div>
                    <div>
                      <span className="status rejected bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">Rejected</span>
                    </div>
                  </div>
                  {record.rejectionReason && (
                    <div className="rejection-reason bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 mt-3">
                      <strong>Rejection Reason:</strong> {record.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
              {!loanRecords.rejected.length && <div className="text-gray-500">No rejected records</div>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
