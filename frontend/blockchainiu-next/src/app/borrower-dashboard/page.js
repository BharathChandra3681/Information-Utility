'use client';

import { useState, useEffect } from 'react';

// Client-only component to prevent hydration issues
function ClientOnlyTime({ date }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <span className="text-sm text-gray-500">Last updated: --:--:--</span>;
  }
  
  return (
    <span className="text-sm text-gray-500">
      Last updated: {date.toISOString().slice(11, 19)}
    </span>
  );
}

export default function BorrowerDashboard() {
  const [activeTab, setActiveTab] = useState('pending-review');
  const [loanRecords, setLoanRecords] = useState({ pending: [], confirmed: [], rejected: [] });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'Corporate Debtor') {
      alert('Unauthorized access. Please login as Corporate Debtor.');
      window.location.href = '/';
      return;
    }
    loadLoans();
  }, []);


  // Additional effect to ensure data is always fresh
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh triggered');
      loadLoans();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/';
  };

  const loadLoans = async () => {
    try {
      console.log('🔄 Loading loans for debtor dashboard...');
      // Use temporary backend while Fabric issues are resolved
      const res = await fetch('/api/loans?org=debtor');
      const data = await res.json();
      console.log('📋 Received data:', data);
      
      const all = Array.isArray(data) ? data.filter(r => r.docType === 'SimpleLoan') : [];
      const pending = all.filter(r => r.status === 'awaiting-borrower' || r.status === 'awaiting-admin');
      const confirmed = all.filter(r => r.status === 'confirmed');
      const rejected = all.filter(r => r.status === 'rejected-by-borrower' || r.status === 'rejected-by-admin');
      
      console.log('📊 Filtered data:', { 
        total: all.length,
        pending: pending.length, 
        confirmed: confirmed.length, 
        rejected: rejected.length 
      });
      console.log('📊 Pending loans:', pending.map(p => ({ id: p.loanId, status: p.status, borrower: p.borrowerName })));
      console.log('📊 Confirmed loans:', confirmed.map(c => ({ id: c.loanId, status: c.status, borrower: c.borrowerName })));
      console.log('📊 Rejected loans:', rejected.map(r => ({ id: r.loanId, status: r.status, borrower: r.borrowerName })));
      
      // Force state update by creating new objects and ensuring proper state management
      const newLoanRecords = { 
        pending: [...pending], 
        confirmed: [...confirmed], 
        rejected: [...rejected] 
      };
      
      console.log('🔄 Setting new loan records:', newLoanRecords);
      setLoanRecords(newLoanRecords);
      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('❌ Error loading loans:', error);
      setLoanRecords({ pending: [], confirmed: [], rejected: [] });
    }
  };

  const handleConfirm = async (loanId) => {
    try {
      console.log('✅ Approving loan:', loanId);
      // Use temporary backend while Fabric issues are resolved
      const res = await fetch(`/api/loans/${encodeURIComponent(loanId)}/borrower/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ org: 'debtor' }) });
      if (!res.ok) throw new Error((await res.json()).error || 'Confirm failed');
      console.log('✅ Loan approved, reloading data...');
      
      // Immediate reload
      await loadLoans();
      
      // Additional reloads to ensure data consistency
      setTimeout(async () => {
        console.log('🔄 Secondary reload after approval...');
        await loadLoans();
      }, 1000);
      
      setTimeout(async () => {
        console.log('🔄 Final reload after approval...');
        await loadLoans();
      }, 2000);
      
      alert('Loan approved successfully!');
    } catch (e) { 
      console.error('❌ Error approving loan:', e);
      alert(e.message); 
    }
  };

  const handleReject = async (loanId) => {
    try {
      const reason = prompt('Please provide a reason for rejection:');
      if (!reason) return;
      // Use temporary backend while Fabric issues are resolved
      const res = await fetch(`/api/loans/${encodeURIComponent(loanId)}/borrower/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ org: 'debtor', reason }) });
      if (!res.ok) throw new Error((await res.json()).error || 'Reject failed');
      
      // Immediate reload
      await loadLoans();
      
      // Additional reloads to ensure data consistency
      setTimeout(async () => {
        console.log('🔄 Secondary reload after rejection...');
        await loadLoans();
      }, 1000);
      
      setTimeout(async () => {
        console.log('🔄 Final reload after rejection...');
        await loadLoans();
      }, 2000);
      
      alert('Loan rejected successfully!');
    } catch (e) { 
      console.error('❌ Error rejecting loan:', e);
      alert(e.message); 
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Corporate Debtor Dashboard</h1>
            <p className="text-gray-700">Review and manage submitted loan records</p>
          </div>
          <div className="flex items-center gap-4">
            <ClientOnlyTime date={lastRefresh} />
          </div>
        </div>

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
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Pending Review ({loanRecords.pending.length})</h3>
                <button
                  onClick={() => {
                    console.log('🔄 Pending tab refresh triggered');
                    loadLoans();
                  }}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition text-sm"
                >
                  🔄 Refresh
                </button>
              </div>
              {loanRecords.pending.map(record => (
                <div key={record.loanId || record.transactionId} className="loan-record border border-gray-200 rounded-lg p-6 mb-6 bg-white shadow-lg">
                  {/* Header Section */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-blue-800 mb-1">{record.creditorName || 'Creditor'}</h2>
                      <p className="text-sm text-gray-500">Loan ID: {record.loanId || record.transactionId}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Awaiting Your Approval
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted: {(record.createdAt || record.submittedAt || record.loanStartDate || '').slice(0,10)}
                      </p>
                    </div>
                  </div>

                  {/* Loan Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Financial Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">💰 Financial Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Loan Amount:</span>
                          <span className="text-sm font-semibold text-green-600">₹{record.loanAmount || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Start Date:</span>
                          <span className="text-sm font-medium">{record.loanStartDate || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Maturity Date:</span>
                          <span className="text-sm font-medium">{record.maturityDate || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Loan Duration:</span>
                          <span className="text-sm font-medium">
                            {record.loanStartDate && record.maturityDate ? 
                              `${Math.ceil((new Date(record.maturityDate) - new Date(record.loanStartDate)) / (1000 * 60 * 60 * 24 * 30))} months` : 
                              'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Borrower Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">🏢 Borrower Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Company Name:</span>
                          <span className="text-sm font-medium">{record.borrowerName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Organization:</span>
                          <span className="text-sm font-medium">{record.org || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Document Type:</span>
                          <span className="text-sm font-medium">{record.docType || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Submitted By:</span>
                          <span className="text-sm font-medium">{record.submittedBy || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Asset Information */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3">📊 Asset Records</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600 block mb-1">Assets:</span>
                          <span className="text-sm font-medium">{record.assets || 'No asset information provided'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 block mb-1">Balance Sheet:</span>
                          <span className="text-sm font-medium">{record.balanceSheet || 'No balance sheet provided'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Liability Information */}
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-red-800 mb-3">📋 Liability Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600 block mb-1">Existing Liabilities:</span>
                          <span className="text-sm font-medium">{record.existingLiabilities || 'No existing liabilities reported'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 block mb-1">Risk Assessment:</span>
                          <span className="text-sm font-medium">
                            {record.loanAmount && parseFloat(record.loanAmount) > 1000000 ? 'High Value Loan' : 'Standard Loan'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => handleReject(record.loanId || record.transactionId)} 
                      className="btn bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-semibold flex items-center gap-2"
                    >
                      ❌ Reject Loan
                    </button>
                    <button 
                      onClick={() => handleConfirm(record.loanId || record.transactionId)} 
                      className="btn bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-2"
                    >
                      ✅ Approve Loan
                    </button>
                  </div>
                </div>
              ))}
              {!loanRecords.pending.length && <div className="text-gray-500">No records pending your review</div>}
            </div>
          )}

          {activeTab === 'confirmed' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-xl font-bold">Confirmed Loan Records ({loanRecords.confirmed.length})</h3>
                <button
                  onClick={() => {
                    console.log('🔄 Confirmed tab refresh triggered');
                    loadLoans();
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm"
                >
                  🔄 Refresh
                </button>
              </div>
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
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-xl font-bold">Rejected Loan Records ({loanRecords.rejected.length})</h3>
                <button
                  onClick={() => {
                    console.log('🔄 Rejected tab refresh triggered');
                    loadLoans();
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
                >
                  🔄 Refresh
                </button>
              </div>
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
