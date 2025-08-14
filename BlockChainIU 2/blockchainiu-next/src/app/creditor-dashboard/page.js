'use client';

import { useState, useEffect } from 'react';

export default function CreditorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [submittedRecords, setSubmittedRecords] = useState([]);
  const [formData, setFormData] = useState({
    borrowerName: '',
    loanAmount: '',
    loanStartDate: '',
    maturityDate: '',
    loanStatus: 'Active',
    assetRecords: '',
    balanceSheet: '',
    existingLiabilities: ''
  });
  const [dropdownStatus, setDropdownStatus] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [loanIdForUpload, setLoanIdForUpload] = useState('');
  const [uploadResponse, setUploadResponse] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [myDocs, setMyDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  // Admin and details modal state
  const [isAdmin, setIsAdmin] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  useEffect(() => {
    // Check logged in user role
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'Creditor') {
      alert('Unauthorized access. Please login as Creditor.');
      window.location.href = '/';
    }
    setIsAdmin(loggedInUser?.role === 'Admin');
    // Load from chain (not localStorage)
    fetchLoans();
    // Load my documents list
    loadMyDocs(loggedInUser?.email);
  }, []);

  const fetchLoans = async () => {
    try {
      const res = await fetch(`/api/loans?org=creditor&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSubmittedRecords(list.filter(r => r.docType === 'SimpleLoan' || r.loanId));
    } catch {
      setSubmittedRecords([]);
    }
  };

  const logout = () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/';
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  // Normalize status labels
  const statusLabel = (s) => ({
    unconfirmed: 'Unconfirmed',
    confirmed: 'Confirmed',
    'awaiting-admin': 'Awaiting Admin',
    'awaiting-borrower': 'Awaiting Borrower',
    'rejected-by-borrower': 'Rejected by Borrower',
    'rejected-by-admin': 'Rejected by Admin',
    npa: 'NPA',
    closed: 'Closed'
  }[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : ''));

  // Normalize date to YYYY-MM-DD across browsers (Safari fallback included)
  const normalizeDate = (val) => {
    if (!val) return '';
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // already ISO
    const m = s.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
    if (m) {
      const d = m[1].padStart(2, '0');
      const mo = m[2].padStart(2, '0');
      const y = m[3];
      // assume day-first for common locales (dd/mm/yyyy)
      return `${y}-${mo}-${d}`;
    }
    const dt = new Date(s);
    if (!Number.isNaN(dt.getTime())) {
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return s;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const v = (name === 'loanStartDate' || name === 'maturityDate') ? normalizeDate(value) : value;
    setFormData(prev => ({ ...prev, [name]: v }));
  };

  const handleDropdownToggle = (id) => {
    if (!isAdmin) {
      alert('Only Admin can update the loan status');
      return;
    }
    setDropdownStatus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDropdownSelect = (id, status) => {
    if (!isAdmin) {
      alert('Only Admin can update the loan status');
      return;
    }
    setDropdownStatus(prev => ({
      ...prev,
      [id]: false
    }));
    setSubmittedRecords(prevRecords => {
      const updatedRecords = prevRecords.map(record => {
        if (record.transactionId === id) {
          return { ...record, status };
        }
        return record;
      });
      localStorage.setItem('submittedRecords', JSON.stringify(updatedRecords));
      return updatedRecords;
    });
  };

  // Details modal helpers
  const openDetails = (record) => { setDetailsRecord(record); setDetailsOpen(true); };
  const closeDetails = () => { setDetailsOpen(false); setDetailsRecord(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      borrowerName,
      loanAmount,
      loanStartDate,
      maturityDate,
      loanStatus,
      assetRecords,
      balanceSheet,
      existingLiabilities
    } = formData;

    const isBlank = (s) => !s || !String(s).trim();
    const isValidDate = (s) => {
      if (isBlank(s)) return false;
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(String(s).trim());
      if (iso) return true;
      const n = normalizeDate(s);
      return /^\d{4}-\d{2}-\d{2}$/.test(n);
    };

    const startISO = normalizeDate(loanStartDate);
    const maturityISO = normalizeDate(maturityDate);

    if (isBlank(borrowerName) || isBlank(loanAmount) || !isValidDate(startISO)) {
      alert('Please fill in required fields (Borrower, Amount, Start Date).');
      return;
    }

    const loanId = `LOAN${Date.now()}`;

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, borrowerName: String(borrowerName).trim(), loanAmount: String(loanAmount).trim(), loanStartDate: startISO, maturityDate: maturityISO || '', org: 'creditor' })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Submission failed');
      }
      await fetchLoans();
      setFormData({
        borrowerName: '',
        loanAmount: '',
        loanStartDate: '',
        maturityDate: '',
        loanStatus: 'Active',
        assetRecords: '',
        balanceSheet: '',
        existingLiabilities: ''
      });
      setActiveTab('records');
      alert('Loan submitted on-chain and awaiting admin approval');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    try {
      if (!selectedFile) {
        alert('Please choose a document file');
        return;
      }
      setIsUploading(true);
      setUploadResponse(null);
      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
      const owner = loggedInUser?.email || 'unknown-owner';
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('owner', owner);
      if (loanIdForUpload) form.append('loanId', loanIdForUpload);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      setUploadResponse(data);
      alert('Document uploaded for verification');
      setSelectedFile(null);
      setLoanIdForUpload('');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const loadMyDocs = async (email) => {
    try {
      setLoadingDocs(true);
      const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
      const owner = email || loggedInUser?.email;
      if (!owner) return;
      const res = await fetch(`/api/documents?owner=${encodeURIComponent(owner)}`);
      const data = await res.json();
      setMyDocs(Array.isArray(data) ? data : []);
    } catch (_) {
      setMyDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Helper: compute total exposure from on-chain records (numeric amounts only)
  const totalExposure = submittedRecords.reduce((acc, r) => {
    const n = parseFloat(String(r.loanAmount || '').replace(/[^0-9.]/g, ''));
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);

  return (
    <div className="font-inter bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md p-4 sticky top-0 z-50 flex justify-between items-center">
        <div>
          <h1 className="text-blue-800 font-bold text-xl">Creditor Dashboard</h1>
          <p className="text-gray-600">HDFC Bank Ltd - Manage loan records and track verification status</p>
        </div>
        <button
          id="logoutBtn"
          onClick={logout}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
        <div className="card bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-blue-800 font-bold mb-2">Total Submissions</h2>
          <div className="text-3xl font-bold text-blue-600">{submittedRecords.length}</div>
        </div>
        <div className="card bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-blue-800 font-bold mb-2">Pending Confirmation</h2>
          <div className="text-3xl font-bold text-yellow-600">
            {submittedRecords.filter(r => ['unconfirmed','awaiting-admin','awaiting-borrower'].includes(r.status)).length}
          </div>
        </div>
        <div className="card bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-blue-800 font-bold mb-2">Confirmed Records</h2>
          <div className="text-3xl font-bold text-green-600">
            {submittedRecords.filter(r => r.status === 'confirmed').length}
          </div>
        </div>
        <div className="card bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-blue-800 font-bold mb-2">Total Exposure</h2>
          <div className="text-3xl font-bold text-blue-600">₹{new Intl.NumberFormat('en-IN').format(Math.round(totalExposure))}</div>
        </div>
      </div>

      <div className="tabs flex justify-center gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
          onClick={() => switchTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'smart' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
          onClick={() => switchTab('smart')}
        >
          Smart Contract
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'records' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
          onClick={() => switchTab('records')}
        >
          Submitted Records
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="section p-6">
          <div className="panel bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
            {submittedRecords.slice(-3).reverse().map((record) => (
              <div key={record.loanId || record.transactionId} className="loan-item flex justify-between items-center border border-gray-200 rounded-lg p-4 mb-2">
                <div>
                  {record.borrowerName}<br />
                  <span className={`status ${record.status}`}>{statusLabel(record.status)}</span>
                </div>
              </div>
            ))}
            {!submittedRecords.length && (
              <div className="text-gray-500">No recent activity</div>
            )}
          </div>
          <div className="panel bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Pending Actions</h3>
            {(submittedRecords.filter(r => ['awaiting-admin','awaiting-borrower'].includes(r.status)).slice(0,3)).map((r) => (
              <div key={(r.loanId || r.transactionId) + '-pending'} className="loan-item border border-gray-200 rounded-lg p-4 mb-2">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{r.borrowerName}</div>
                    <small>{(r.submittedAt || r.loanStartDate || '').slice(0,10)}</small>
                  </div>
                  <span className="inline-block bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-full px-2 py-0.5 text-xs font-bold">
                    {statusLabel(r.status)}
                  </span>
                </div>
              </div>
            ))}
            {!submittedRecords.filter(r => ['awaiting-admin','awaiting-borrower'].includes(r.status)).length && (
              <div className="text-gray-500">Nothing pending right now</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'smart' && (
        <div className="section p-6">
          <div className="panel bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">+ Submit New Loan Record</h3>
            <p className="mb-4">Record new loan and financial data on the blockchain for borrower verification</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group mb-4">
                <label>Borrower Name *</label>
                <input
                  type="text"
                  name="borrowerName"
                  placeholder="e.g., Reliance Capital Ltd"
                  value={formData.borrowerName}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label>Loan Amount *</label>
                <input
                  type="text"
                  name="loanAmount"
                  placeholder="e.g., ₹500 Crore"
                  value={formData.loanAmount}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label>Loan Start Date *</label>
                <input
                  type="date"
                  name="loanStartDate"
                  value={formData.loanStartDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                  placeholder="YYYY-MM-DD"
                  inputMode="numeric"
                  pattern="\d{4}-\d{2}-\d{2}"
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label>Maturity Date</label>
                <input
                  type="date"
                  name="maturityDate"
                  value={formData.maturityDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                  placeholder="YYYY-MM-DD"
                  inputMode="numeric"
                  pattern="\d{4}-\d{2}-\d{2}"
                />
              </div>
              <div className="form-group mb-4">
                <label>Current Loan Status</label>
                <select
                  name="loanStatus"
                  value={formData.loanStatus}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select loan status</option>
                  <option value="Active">Active</option>
                  <option value="Defaulted">Defaulted</option>
                </select>
              </div>
              <div className="form-group mb-4">
                <label>Asset Records</label>
                <textarea
                  name="assetRecords"
                  placeholder="Describe assets, collateral, etc."
                  value={formData.assetRecords}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="form-group mb-4">
                <label>Balance Sheet Summary</label>
                <textarea
                  name="balanceSheet"
                  placeholder="Total assets, liabilities, equity details..."
                  value={formData.balanceSheet}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="form-group mb-4">
                <label>Existing Liabilities</label>
                <textarea
                  name="existingLiabilities"
                  placeholder="Other outstanding loans, obligations..."
                  value={formData.existingLiabilities}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="form-buttons flex justify-end gap-4">
                <button type="button" className="btn-draft bg-gray-300 text-gray-700 rounded-lg px-4 py-2" onClick={() => alert('Draft saved!')}>
                  Save as Draft
                </button>
                <button type="submit" className="btn-submit bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">
                  Submit to Blockchain
                </button>
              </div>
            </form>
          </div>

          <div className="panel bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="font-bold text-lg mb-4">+ Upload Supporting Documents</h3>
            <p className="mb-4">Upload loan-related documents for admin verification. Hash will be anchored on-chain after approval.</p>
            <form onSubmit={handleDocumentUpload} className="space-y-4" noValidate>
              <div>
                <label className="block mb-1">Loan ID (optional)</label>
                <input
                  type="text"
                  value={loanIdForUpload}
                  onChange={(e) => setLoanIdForUpload(e.target.value)}
                  placeholder="e.g., LOAN001"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block mb-1">Select Document (optional)</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="submit" disabled={isUploading} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
                  {isUploading ? 'Uploading...' : 'Upload for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="section p-6">
          <div className="panel bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Submitted Loan Records</h3>
            <p className="mb-4">Track status of all your submitted loan records</p>
            {submittedRecords.map(record => (
              <div key={record.loanId || record.transactionId} className="loan-item flex justify-between items-center border border-gray-200 rounded-lg p-4 mb-2" data-status={record.status}>
                <div>
                  <strong>{record.borrowerName}</strong><br />
                  Loan ID: {record.loanId || record.transactionId}<br />
                  Amount <strong>{record.loanAmount}</strong><br />
                  Submitted <strong>{record.loanStartDate}</strong><br />
                  {record.status === 'confirmed' ? (
                    <>Confirmed <strong>{record.maturityDate || '-'}</strong></>
                  ) : (
                    <>Maturity <strong>{record.maturityDate || '-'}</strong></>
                  )}
                </div>
                <div className="status-and-actions flex items-center gap-4">
                  <span className="inline-block bg-gray-100 text-gray-800 border border-gray-300 rounded-lg px-3 py-1 font-semibold text-sm min-w-[170px] text-center">
                    {statusLabel(record.status)}
                  </span>
                  <button onClick={() => openDetails(record)} className="view-details-btn bg-blue-600 text-white rounded-lg px-3 py-1 font-semibold hover:bg-blue-700">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="panel bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">My Documents</h3>
              <button onClick={() => loadMyDocs()} className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">
                {loadingDocs ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <p className="mb-4">Documents you uploaded. Admin will verify and anchor their hashes on-chain.</p>
            <div className="overflow-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-blue-100 text-blue-800">
                  <tr>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Filename</th>
                    <th className="p-2 text-left">Loan ID</th>
                    <th className="p-2 text-left">Size</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myDocs.map((d) => (
                    <tr key={d.id} className="border-b border-gray-200">
                      <td className="p-2">{d.id}</td>
                      <td className="p-2">{d.filename}</td>
                      <td className="p-2">{d.loan_id || '-'}</td>
                      <td className="p-2">{Math.round(d.size_bytes / 1024)} KB</td>
                      <td className="p-2">
                        {d.verified ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">Verified</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">Pending</span>
                        )}
                      </td>
                      <td className="p-2">
                        <a
                          href={`/api/documents/${encodeURIComponent(d.id)}/download`}
                          className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                  {!myDocs.length && (
                    <tr>
                      <td className="p-3 text-center text-gray-500" colSpan={6}>No documents uploaded yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsOpen && detailsRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
            <h3 className="font-bold text-lg mb-4">Loan Details</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Borrower:</strong> {detailsRecord.borrowerName}</div>
              <div><strong>Amount:</strong> {detailsRecord.loanAmount}</div>
              <div><strong>Start Date:</strong> {detailsRecord.loanStartDate}</div>
              <div><strong>Maturity Date:</strong> {detailsRecord.maturityDate || '-'}</div>
              <div><strong>Status:</strong> {statusLabel(detailsRecord.status)}</div>
              <div><strong>Loan ID:</strong> {detailsRecord.loanId || detailsRecord.transactionId}</div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={closeDetails} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
