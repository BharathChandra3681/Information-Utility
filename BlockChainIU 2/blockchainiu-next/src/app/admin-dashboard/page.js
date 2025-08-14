'use client';

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  // Loan approvals state
  const [loanRecords, setLoanRecords] = useState([]);
  const [loanLoading, setLoanLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  const statusLabel = (s) => ({
    unconfirmed: 'Unconfirmed',
    confirmed: 'Confirmed',
    'awaiting-admin': 'Awaiting Admin',
    'awaiting-borrower': 'Awaiting Borrower',
    'rejected-by-borrower': 'Rejected by Borrower',
    'rejected-by-admin': 'Rejected by Admin',
    npa: 'NPA',
    closed: 'Closed'
  }[s] || s);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'Admin') {
      alert('Unauthorized access. Please login as Admin.');
      window.location.href = '/';
      return;
    }
    loadLoanRecords();
    // Auto-refresh when tab focused and on interval
    const onVis = () => { if (document.visibilityState === 'visible') loadLoanRecords(); };
    document.addEventListener('visibilitychange', onVis);
    const timer = setInterval(loadLoanRecords, 15000);
    return () => { document.removeEventListener('visibilitychange', onVis); clearInterval(timer); };
  }, []);

  const logout = () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/';
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  // Load loan records from backend
  async function loadLoanRecords() {
    try {
      setLoanLoading(true);
      const res = await fetch(`/api/loans?org=admin&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setLoanRecords(Array.isArray(data) ? data : []);
    } finally {
      setLoanLoading(false);
    }
  }

  async function adminApprove(loanId) {
    try {
      await fetch(`/api/loans/${encodeURIComponent(loanId)}/admin/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org: 'admin' }),
      });
      await loadLoanRecords();
      closeDetails();
    } catch {
      alert('Approval failed');
    }
  }

  async function adminReject(loanId) {
    try {
      await fetch(`/api/loans/${encodeURIComponent(loanId)}/admin/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected by admin', org: 'admin' }),
      });
      await loadLoanRecords();
      closeDetails();
    } catch {
      alert('Rejection failed');
    }
  };

  const openDetails = (record) => { setDetailsRecord(record); setDetailsOpen(true); };
  const closeDetails = () => { setDetailsOpen(false); setDetailsRecord(null); };

  const loadPending = async () => {
    try {
      setLoadingPending(true);
      const res = await fetch('/api/documents/pending/list');
      const data = await res.json();
      setPendingDocs(Array.isArray(data) ? data : []);
    } catch (_) {
      setPendingDocs([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const verifyDoc = async (id) => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
      const res = await fetch(`/api/documents/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: loggedInUser?.email || 'admin' })
      });
      if (!res.ok) throw new Error('Verify failed');
      await loadPending();
      alert('Document verified and anchored');
    } catch (e) {
      alert(e.message);
    }
  };

  // Derived counts for overview cards
  const totalRecords = loanRecords.length;
  const pendingCount = loanRecords.filter(r => ['awaiting-admin','awaiting-borrower','unconfirmed'].includes(r.status)).length;
  const confirmedCount = loanRecords.filter(r => r.status === 'confirmed').length;

  return (
    <div className="font-inter bg-gray-100 min-h-screen">
      <nav className="navbar bg-white shadow-md sticky top-0 z-50 p-4 flex justify-between items-center">
        <div className="container nav-container flex items-center gap-4">
          <div className="logo font-bold text-blue-800 text-xl select-none">🔗 BlockchainIU</div>
          <button onClick={loadLoanRecords} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-200">{loanLoading ? 'Refreshing...' : 'Refresh'}</button>
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
        <h1 className="text-blue-800 font-bold text-2xl mb-2">Admin Dashboard</h1>
        <p className="mb-6 text-gray-700">Information Utility Authority - Monitor and audit blockchain records</p>

        <section className="overview-cards grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-blue-800 font-bold mb-2">Total Records</h3>
            <p className="card-number text-3xl font-bold text-blue-600">{totalRecords}</p>
            <p>On blockchain</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-blue-800 font-bold mb-2">Pending Review</h3>
            <p className="card-number text-3xl font-bold text-yellow-600">{pendingCount}</p>
            <p>Awaiting confirmation</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-blue-800 font-bold mb-2">Verified Records</h3>
            <p className="card-number text-3xl font-bold text-green-600">{confirmedCount}</p>
            <p>Successfully confirmed</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-blue-800 font-bold mb-2">System Health</h3>
            <p className="card-number text-3xl font-bold text-blue-600">99.9%</p>
            <p>Blockchain uptime</p>
          </div>
        </section>

        <section className="dashboard-tabs flex gap-4 mb-6">
          {['overview', 'all-records', 'analytics', 'reports'].map(tab => (
            <button
              key={tab}
              className={`tab px-4 py-2 rounded-lg font-semibold ${
                activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-100 text-blue-800'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </section>

        <section className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="active">
              <div className="recent-activity mb-6">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                <ul className="list-none p-0">
                  {loanRecords
                    .slice()
                    .sort((a,b) => new Date(b.submittedAt || b.loanStartDate) - new Date(a.submittedAt || a.loanStartDate))
                    .slice(0,5)
                    .map(r => (
                      <li key={r.loanId} className="bg-white p-4 rounded-lg shadow mb-4 hover:shadow-lg transition">
                        <strong>{r.creditorName || 'Creditor'} → {r.borrowerName}</strong><br />
                        {r.loanAmount || '-'} • {r.loanStartDate || (r.submittedAt || '').slice(0,10)}
                        <span className="ml-2 inline-block bg-gray-100 text-gray-800 border border-gray-300 rounded-full px-2 py-0.5 text-xs font-bold">
                          {statusLabel(r.status)}
                        </span>
                      </li>
                  ))}
                  {!loanRecords.length && (
                    <li className="text-gray-500">No recent activity</li>
                  )}
                </ul>
              </div>
              {/* Keep generic alerts; removed hardcoded record rows */}
              <div className="system-alerts">
                <h2 className="text-xl font-bold mb-4">System Alerts</h2>
                <div className="alert alert-success p-4 rounded-lg shadow">All systems operational</div>
              </div>
            </div>
          )}

          {activeTab === 'all-records' && (
            <div className="all-records bg-white p-6 rounded-lg shadow mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Submitted Loan Records</h2>
                <div className="flex gap-2">
                  <button onClick={loadLoanRecords} className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">
                    {loanLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
              <div className="overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-blue-100 text-blue-800">
                    <tr>
                      <th className="p-2 text-left">Borrower</th>
                      <th className="p-2 text-left">Amount</th>
                      <th className="p-2 text-left">Submitted</th>
                      <th className="p-2 text-left">Maturity</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanRecords.map(r => (
                      <tr key={r.loanId} className="border-b border-gray-200">
                        <td className="p-2 font-semibold">{r.borrowerName}<br /><small className="text-gray-500">{r.loanId}</small></td>
                        <td className="p-2">{r.loanAmount}</td>
                        <td className="p-2">{r.loanStartDate}</td>
                        <td className="p-2">{r.maturityDate || '-'}</td>
                        <td className="p-2">
                          <span className="inline-block bg-gray-100 text-gray-800 border border-gray-300 rounded-full px-2 py-1 font-bold text-xs">{statusLabel(r.status)}</span>
                        </td>
                        <td className="p-2 flex flex-wrap gap-2">
                          <button onClick={() => openDetails(r)} className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">View Details</button>
                          <button onClick={() => adminApprove(r.loanId)} disabled={r.adminApproval === 'approved' || r.status === 'confirmed'} className="bg-green-600 disabled:opacity-50 text-white px-3 py-1 rounded-lg hover:bg-green-700">Approve</button>
                          <button onClick={() => adminReject(r.loanId)} disabled={r.status === 'confirmed'} className="bg-red-600 disabled:opacity-50 text-white px-3 py-1 rounded-lg hover:bg-red-700">Reject</button>
                        </td>
                      </tr>
                    ))}
                    {!loanRecords.length && (
                      <tr>
                        <td className="p-3 text-center text-gray-500" colSpan={6}>No submitted records</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics p-6 bg-white rounded-lg shadow">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[300px]">
                  <h2 className="text-xl font-bold mb-2">Transaction Volume</h2>
                  <p className="mb-4">Monthly transaction trends</p>
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg h-48 flex items-center justify-center text-gray-400 font-semibold">
                    Analytics charts would be rendered here
                  </div>
                </div>
                <div className="flex-1 min-w-[300px]">
                  <h2 className="text-xl font-bold mb-2">Institution Performance</h2>
                  <p className="mb-4">Creditor and borrower activity</p>
                  <div className="bg-white rounded-lg p-4 shadow">
                    <div className="flex justify-between mb-2">
                      <span>HDFC Bank Ltd</span>
                      <span className="bg-green-600 text-white rounded-full px-2 text-sm">Active</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>State Bank of India</span>
                      <span className="bg-green-600 text-white rounded-full px-2 text-sm">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reliance Capital Ltd</span>
                      <span className="bg-green-600 text-white rounded-full px-2 text-sm">Responsive</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="reports p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-bold mb-2">Generate Compliance Report</h2>
              <p className="mb-4">Create regulatory reports for authorities</p>
              <form>
                <label htmlFor="report-type" className="block mb-1">Report Type</label>
                <select id="report-type" name="report-type" className="w-full p-2 rounded-lg border border-gray-300 mb-4">
                  <option>Monthly Summary</option>
                  <option>Quarterly Summary</option>
                  <option>Annual Summary</option>
                </select>
                <fieldset className="mb-4">
                  <legend className="font-semibold mb-2">Include Data</legend>
                  <label className="block"><input type="checkbox" defaultChecked /> Verified Records</label>
                  <label className="block"><input type="checkbox" defaultChecked /> Pending Records</label>
                  <label className="block"><input type="checkbox" /> Rejected Records</label>
                </fieldset>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                  Generate Report
                </button>
              </form>
              <h2 className="text-xl font-bold mt-8 mb-2">System Health Report</h2>
              <p className="mb-4">Blockchain and system performance metrics</p>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="flex justify-between mb-2">
                  <span>Blockchain Integrity</span>
                  <span className="bg-green-600 text-white rounded-full px-2 text-sm">100%</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Network Uptime</span>
                  <span className="bg-green-600 text-white rounded-full px-2 text-sm">99.9%</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Transaction Success Rate</span>
                  <span className="bg-green-600 text-white rounded-full px-2 text-sm">99.7%</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Response Time</span>
                  <span className="bg-gray-300 rounded-full px-2 text-sm">2.3s</span>
                </div>
                <button
                  id="downloadReportBtn"
                  className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Download System Report
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Details Modal */}
      {detailsOpen && detailsRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
            <h3 className="font-bold text-lg mb-4">Loan Details</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Borrower:</strong> {detailsRecord.borrowerName}</div>
              <div><strong>Creditor:</strong> {detailsRecord.creditorName || '-'}</div>
              <div><strong>Amount:</strong> {detailsRecord.loanAmount}</div>
              <div><strong>Start Date:</strong> {detailsRecord.loanStartDate}</div>
              <div><strong>Maturity Date:</strong> {detailsRecord.maturityDate || '-'}</div>
              <div><strong>Status:</strong> {statusLabel(detailsRecord.status)}</div>
              <div><strong>Admin Approval:</strong> {detailsRecord.adminApproval}</div>
              <div><strong>Borrower Decision:</strong> {detailsRecord.borrowerDecision}</div>
              <div><strong>Loan ID:</strong> {detailsRecord.loanId}</div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => adminApprove(detailsRecord.loanId)} disabled={detailsRecord.adminApproval === 'approved' || detailsRecord.status === 'confirmed'} className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50">Approve</button>
              <button onClick={() => adminReject(detailsRecord.loanId)} disabled={detailsRecord.status === 'confirmed'} className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 disabled:opacity-50">Reject</button>
              <button onClick={closeDetails} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
