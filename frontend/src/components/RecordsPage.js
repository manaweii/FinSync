import React, { useState, useEffect } from 'react';

const RecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', amount: '', category: '', description: '' });
  const [newRecord, setNewRecord] = useState({ date: '', amount: '', category: '', description: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState(null);

  // Fetch records and metrics on component mount
  useEffect(() => {
    fetchRecords();
    fetchMetrics();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/imports/records', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch records');
      }
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/imports/metrics', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/imports/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newRecord)
      });
      if (!response.ok) {
        throw new Error('Failed to create record');
      }
      setNewRecord({ date: '', amount: '', category: '', description: '' });
      await fetchRecords();
    } catch (error) {
      console.error('Error creating record:', error);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`/api/imports/records/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editForm)
      });
      if (!response.ok) {
        throw new Error('Failed to update record');
      }
      setEditingId(null);
      setEditForm({ date: '', amount: '', category: '', description: '' });
      await fetchRecords();
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const requestDelete = (id) => {
    setDeleteRecordId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteRecordId) return;
    try {
      const response = await fetch(`/api/imports/records/${deleteRecordId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete record');
      }
      setShowDeleteConfirm(false);
      setDeleteRecordId(null);
      await fetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteRecordId(null);
  };

  const startEdit = (record) => {
    setEditingId(record._id);
    setEditForm({ 
      date: record.date, 
      amount: record.amount.toString(), 
      category: record.category, 
      description: record.description 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            ${metrics.totalRevenue?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600">
            ${metrics.totalExpenses?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Net Cash Flow</h3>
          <p className={`text-3xl font-bold ${metrics.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${metrics.netCashFlow?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Record Count</h3>
          <p className="text-3xl font-bold text-blue-600">{records.length}</p>
        </div>
      </div>

      {/* Add New Record Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Add New Record</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="date"
            value={newRecord.date}
            onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={newRecord.amount}
            onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <select
            value={newRecord.category}
            onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value })}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select Category</option>
            <option value="Revenue">Revenue</option>
            <option value="Expense">Expense</option>
            <option value="Investment">Investment</option>
          </select>
          <input
            type="text"
            placeholder="Description"
            value={newRecord.description}
            onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2 lg:col-span-1"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium md:col-span-2 lg:col-span-1"
          >
            Add Record
          </button>
        </form>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Financial Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No records found. Add your first record above.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${parseFloat(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.category === 'Revenue' ? 'bg-green-100 text-green-800' :
                        record.category === 'Expense' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {record.category}
                      </span>
                    </td>
                    <td 
                      className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate cursor-pointer hover:text-blue-600" 
                      title={record.description}
                      onClick={() => editingId === record._id && setEditForm(prev => ({ ...prev, description: record.description }))}
                    >
                      {record.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {editingId === record._id ? (
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={handleUpdate}
                            className="text-green-600 hover:text-green-900 px-2 py-1 rounded font-medium"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditForm({ date: '', amount: '', category: '', description: '' });
                            }}
                            className="text-gray-600 hover:text-gray-900 px-2 py-1 rounded font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => startEdit(record)}
                            className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(record._id)}
                            className="text-red-600 hover:text-red-900 px-2 py-1 rounded font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this record? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-200 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordsPage;
