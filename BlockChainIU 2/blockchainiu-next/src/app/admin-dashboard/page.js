'use client';

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'Admin') {
      alert('Unauthorized access. Please login as Admin.');
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

  return (
    <div className="font-inter bg-gray-100 min-h-screen">
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
        <h1 className="text-blue-800 font-bold text-2xl mb-2">Admin Dashboard</h1>
        <p className="mb-6 text-gray-700">Information Utility Authority - Monitor and audit blockchain records</p>

        <section className="overview-cards grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-blue-800 font-bold mb-2">Total Records</h3>
            <p className="card-number text-3xl font-bold text-blue-600">5</p>
            <p>On blockchain</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-blue-800 font-bold mb-2">Pending Review</h3>
            <p className="card-number text-3xl font-bold text-yellow-600">2</p>
            <p>Awaiting confirmation</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-blue-800 font-bold mb-2">Verified Records</h3>
            <p className="card-number text-3xl font-bold text-green-600">2</p>
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
              onClick={() => switchTab(tab)}
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
                  <li className="bg-white p-4 rounded-lg shadow mb-4 hover:shadow-lg transition">
                    <strong>HDFC Bank Ltd → Reliance Capital Ltd</strong><br />
                    ₹500 Crore • 2024-01-15
                    <span className="status pending ml-2">Pending Confirmation</span>
                  </li>
                  <li className="bg-white p-4 rounded-lg shadow mb-4 hover:shadow-lg transition">
                    <strong>HDFC Bank Ltd → Jet Airways India Ltd</strong><br />
                    ₹250 Crore • 2024-01-10
                    <span className="status confirmed ml-2">Confirmed</span>
                  </li>
                  <li className="bg-white p-4 rounded-lg shadow mb-4 hover:shadow-lg transition">
                    <strong>Axis Bank Ltd → Videocon Industries Ltd</strong><br />
                    ₹800 Crore • 2024-01-08
                    <span className="status rejected ml-2">Rejected</span>
                  </li>
                  <li className="bg-white p-4 rounded-lg shadow mb-4 hover:shadow-lg transition">
                    <strong>State Bank of India → Reliance Capital Ltd</strong><br />
                    ₹250 Crore • 2024-01-18
                    <span className="status pending ml-2">Pending Confirmation</span>
                  </li>
                  <li className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
                    <strong>ICICI Bank Ltd → Reliance Capital Ltd</strong><br />
                    ₹180 Crore • 2024-01-11
                    <span className="status confirmed ml-2">Confirmed</span>
                  </li>
                </ul>
              </div>

              <div className="system-alerts">
                <h2 className="text-xl font-bold mb-4">System Alerts</h2>
                <div className="alert alert-warning p-4 rounded-lg mb-4 shadow">
                  <strong>High Volume Alert</strong><br />
                  15 records pending review
                </div>
                <div className="alert alert-success p-4 rounded-lg mb-4 shadow">
                  <strong>Security Status: Normal</strong><br />
                  All systems operational
                </div>
                <div className="alert alert-info p-4 rounded-lg shadow">
                  <strong>Monthly Growth</strong><br />
                  25% increase in submissions
                </div>
              </div>
            </div>
          )}

          {activeTab === 'all-records' && (
            <div className="all-records bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Blockchain Records Audit</h2>
              <p className="mb-4">Search and filter all loan records on the blockchain</p>
              <div className="flex flex-wrap gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search by creditor, borrower, or transaction ID..."
                  className="flex-grow p-2 rounded-lg border border-gray-300 text-sm"
                />
                <select className="p-2 rounded-lg border border-gray-300 text-sm">
                  <option>All Status</option>
                  <option>Pending Confirmation</option>
                  <option>Confirmed</option>
                  <option>Rejected</option>
                </select>
                <select className="p-2 rounded-lg border border-gray-300 text-sm">
                  <option>Last 30 days</option>
                  <option>Last 60 days</option>
                  <option>Last 90 days</option>
                </select>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                  Export Data
                </button>
              </div>
              <table className="w-full border-collapse text-sm">
                <thead className="bg-blue-100 text-blue-800">
                  <tr>
                    <th className="p-2 text-left">Creditor → Borrower</th>
                    <th className="p-2 text-left">Amount</th>
                    <th className="p-2 text-left">Submitted</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Blockchain Hash</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Sample rows */}
                  <tr className="border-b border-gray-200">
                    <td className="p-2 font-bold">
                      HDFC Bank Ltd → Reliance Capital Ltd<br />
                      <small>Transaction ID: TXN001</small>
                    </td>
                    <td className="p-2">₹500 Crore</td>
                    <td className="p-2">2024-01-15</td>
                    <td className="p-2">Loan Record</td>
                    <td className="p-2">
                      <a href="#" className="text-blue-600 hover:underline">0x1a2b3c4d...</a>
                    </td>
                    <td className="p-2">
                      <span className="status pending px-2 py-1 rounded-full font-bold">Pending Confirmation</span>
                    </td>
                    <td className="p-2">
                      <button className="view-details-btn bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">
                        Audit Details
                      </button>
                    </td>
                  </tr>
                  {/* Add more rows as needed */}
                </tbody>
              </table>
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
    </div>
  );
}
