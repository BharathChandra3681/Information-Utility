'use client';

import { useState, useEffect } from 'react';
import io from 'socket.io-client';

export default function CreditorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [submittedRecords, setSubmittedRecords] = useState([]);
  const [formData, setFormData] = useState({
    borrowerId: '',
    loanAmount: '',
    loanStartDate: '',
    maturityDate: '',
    interestRate: '',
    term: '',
    purpose: '',
    assetRecords: '',
    balanceSheet: '',
    existingLiabilities: ''
  });
  const [availableBorrowers, setAvailableBorrowers] = useState([]);
  const [loadingBorrowers, setLoadingBorrowers] = useState(false);
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
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [userOrg, setUserOrg] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check logged in user role
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'Creditor') {
      alert('Unauthorized access. Please login as Creditor.');
      window.location.href = '/';
      return;
    }

    setCurrentUser(loggedInUser);
    setUserOrg(loggedInUser.organization || 'Creditor');
    setIsAdmin(loggedInUser.role === 'Admin');

    // Load available borrowers for dropdown
    loadBorrowers();
    // Load loans for this creditor
    fetchLoans(loggedInUser.userId);
    // Load my documents list
    loadMyDocs(loggedInUser.userId);

    // Setup WebSocket connection for real-time updates
    const socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected to server');
    });

    socket.on('loan-update', (update) => {
      console.log('🔔 Real-time loan update received:', update.type, update.data);
      setLastRefresh(new Date());

      // Refresh loan data to get latest state
      fetchLoans(loggedInUser.userId);

      // If documents were added, reload documents list
      if (update.type === 'loan-documents-added') {
        loadMyDocs(loggedInUser.userId);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected from server');
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const loadBorrowers = async () => {
    try {
      setLoadingBorrowers(true);
      const res = await fetch('/api/auth/users?role=Corporate Debtor');
      const data = await res.json();
      if (data.success) {
        setAvailableBorrowers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading borrowers:', error);
      setAvailableBorrowers([]);
    } finally {
      setLoadingBorrowers(false);
    }
  };

  const fetchLoans = async (userId) => {
    if (!userId) return;
    try {
      console.log('🔄 Fetching loans for creditor:', userId);
      const res = await fetch(`/api/loans?org=creditor&userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        const list = data.data || [];
        setSubmittedRecords(list.filter(r => r.docType === 'SimpleLoan'));
        setLastRefresh(new Date());
        console.log('✅ Loans fetched successfully, count:', list.filter(r => r.docType === 'SimpleLoan').length);
      }
    } catch (error) {
      console.error('❌ Error fetching loans:', error);
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

    if (!currentUser) {
      alert('User session expired. Please login again.');
      return;
    }

    const {
      borrowerId,
      loanAmount,
      loanStartDate,
      maturityDate,
      interestRate,
      term,
      purpose
    } = formData;

    // Validate required fields
    if (!borrowerId || !loanAmount || !loanStartDate || !interestRate || !term || !purpose) {
      alert('Please fill in all required fields (marked with *).');
      return;
    }

    const startISO = normalizeDate(loanStartDate);
    const maturityISO = maturityDate ? normalizeDate(maturityDate) : '';

    try {
      // Prepare loan data for submission
      const loanData = {
        creditorId: currentUser.userId,
        borrowerId: borrowerId,
        amount: String(loanAmount).trim(),
        interestRate: String(interestRate).trim(),
        term: String(term).trim(),
        purpose: String(purpose).trim(),
        loanStartDate: startISO,
        maturityDate: maturityISO
      };

      // Create FormData for multipart upload
      const form = new FormData();
      form.append('loanData', JSON.stringify(loanData));

      const res = await fetch('/api/loans', {
        method: 'POST',
        body: form
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Submission failed');
      }

      const result = await res.json();
      console.log('Loan created:', result);

      await fetchLoans(currentUser.userId);

      // Reset form
      setFormData({
        borrowerId: '',
        loanAmount: '',
        loanStartDate: '',
        maturityDate: '',
        interestRate: '',
        term: '',
        purpose: '',
        assetRecords: '',
        balanceSheet: '',
        existingLiabilities: ''
      });

      setActiveTab('records');
      alert(`Loan created successfully! Loan ID: ${result.data.loanId}`);
    } catch (err) {
      console.error('Error creating loan:', err);
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
      if (!loanIdForUpload || !loanIdForUpload.trim()) {
        alert('Please provide a Loan ID');
        return;
      }
      setIsUploading(true);
      setUploadResponse(null);
      const form = new FormData();
      form.append('documents', selectedFile);

      const res = await fetch(`/api/loans/${loanIdForUpload}/documents?org=creditor`, {
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
      // Fetch documents for all loans submitted by creditor
      const allDocs = [];
      for (const loan of submittedRecords) {
        try {
          const res = await fetch(`/api/loans/${loan.loanId || loan.transactionId}/documents?org=creditor`);
          if (res.ok) {
            const data = await res.json();
            const docs = data.documents || [];
            if (Array.isArray(docs)) {
              allDocs.push(...docs.map(d => ({
                id: d.documentId,
                filename: d.fileName,
                loan_id: loan.loanId || loan.transactionId,
                size_bytes: d.fileSize,
                verified: d.status === 'verified' || false,
                uploadedAt: d.uploadedAt
              })));
            }
          }
        } catch (docErr) {
          console.error(`Error fetching documents for loan ${loan.loanId}:`, docErr);
        }
      }
      setMyDocs(allDocs);
    } catch (_) {
      setMyDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  return (
    <div className="font-inter bg-gray-100 min-h-screen">
      <header className="bg-white shadow-md p-4 sticky top-0 z-50 flex justify-between items-center">
        <div>
          <h1 className="text-blue-800 font-bold text-xl">Creditor Dashboard</h1>
          <p className="text-gray-600">{userOrg} - Manage loan records and track verification status</p>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {lastRefresh.toISOString().slice(11, 19)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="logoutBtn"
            onClick={logout}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Logout
          </button>
        </div>
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
          <div className="text-3xl font-bold text-blue-600">—</div>
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
          </div>
          <div className="panel bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Pending Actions</h3>
            <div className="text-gray-500">No pending actions required.</div>
          </div>
        </div>
      )}

      {activeTab === 'smart' && (
        <div className="section p-6">
          <div className="panel bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">+ Submit New Loan Record</h3>
            <p className="mb-4">Record new loan and financial data on the blockchain for borrower verification (Loan ID will be auto-generated)</p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group mb-4">
                <label>Select Borrower (Corporate Debtor) *</label>
                <select
                  name="borrowerId"
                  value={formData.borrowerId}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                  required
                  disabled={loadingBorrowers}
                >
                  <option value="">-- Select a borrower --</option>
                  {availableBorrowers.map(borrower => (
                    <option key={borrower.userId} value={borrower.userId}>
                      {borrower.organization} ({borrower.email})
                    </option>
                  ))}
                </select>
                {loadingBorrowers && <p className="text-sm text-gray-500 mt-1">Loading borrowers...</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group mb-4">
                  <label>Loan Amount *</label>
                  <input
                    type="number"
                    name="loanAmount"
                    placeholder="e.g., 50000000"
                    value={formData.loanAmount}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div className="form-group mb-4">
                  <label>Interest Rate (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="interestRate"
                    placeholder="e.g., 8.5"
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group mb-4">
                  <label>Loan Term (months) *</label>
                  <input
                    type="number"
                    name="term"
                    placeholder="e.g., 60"
                    value={formData.term}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div className="form-group mb-4">
                  <label>Loan Purpose *</label>
                  <input
                    type="text"
                    name="purpose"
                    placeholder="e.g., Working Capital"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group mb-4">
                  <label>Loan Start Date *</label>
                  <input
                    type="date"
                    name="loanStartDate"
                    value={formData.loanStartDate}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg"
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
                  />
                </div>
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
                <label className="block mb-1">Loan ID *</label>
                <input
                  type="text"
                  value={loanIdForUpload}
                  onChange={(e) => setLoanIdForUpload(e.target.value)}
                  placeholder="e.g., LOAN001"
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Select Document *</label>
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
            <div className="mb-4">
              <h3 className="font-bold text-lg">Submitted Loan Records</h3>
              <p className="text-gray-600">Track status of all your submitted loan records (real-time updates)</p>
            </div>
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
            <div className="mb-3">
              <h3 className="font-bold text-lg">My Documents</h3>
            </div>
            <p className="mb-4">Documents you uploaded. Admin will verify and anchor their hashes on-chain (real-time updates).</p>
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
                          href={`/api/loans/${encodeURIComponent(d.loan_id)}/documents/${encodeURIComponent(d.id)}?org=creditor`}
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
