import React, { useState, useEffect } from 'react';
import axios from 'axios';
import APIDocs from './APIDocs';

const Dashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [userApiKeys, setUserApiKeys] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.api_key) {
        await Promise.all([
          fetchStats(),
          fetchSystemStats(),
          fetchUserApiKeys()
        ]);
      }
    };
    fetchData();
  }, [user]);

  const fetchStats = async () => {
    if (!user?.api_key) return;
    
    try {
      const response = await axios.get(`/stats/${user.api_key}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await axios.get('/system-stats');
      setSystemStats(response.data);
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  const fetchUserApiKeys = async () => {
    if (!user?.access_token) return;
    
    try {
      const response = await axios.get('/api-keys', {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });
      setUserApiKeys(response.data.api_keys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  const testRateLimit = async () => {
    if (!user?.api_key) return;
    
    setTestLoading(true);
    try {
      const response = await axios.post('/test-endpoint', {}, {
        headers: { 'X-API-Key': user.api_key }
      });
      setTestResult({
        success: true,
        data: response.data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.response?.data?.detail || 'Request failed',
        status: error.response?.status,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setTestLoading(false);
      setTimeout(fetchStats, 500);
    }
  };

  const createNewApiKey = async () => {
    const name = prompt('Enter API key name:');
    if (!name) return;

    try {
      const response = await axios.post('/api-keys', {
        name,
        max_requests: 10,
        window_seconds: 60
      }, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });
      
      alert('API Key created successfully!');
      fetchUserApiKeys();
    } catch (error) {
      alert('Failed to create API key: ' + (error.response?.data?.detail || error.message));
    }
  };

  const refreshAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchSystemStats(),
      fetchUserApiKeys()
    ]);
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: '📊 Overview', icon: '📊' },
    { id: 'api-keys', name: '🔑 API Keys', icon: '🔑' },
    { id: 'testing', name: '🧪 Testing', icon: '🧪' },
    { id: 'docs', name: '📚 API Docs', icon: '📚' }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🎯 Rate Limiting Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Monitor, test, and manage your rate limiting service
            </p>
          </div>
          <button
            onClick={refreshAllData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center"
          >
            {loading ? '🔄' : '🔄'} Refresh All
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* User Info Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              👤 Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg text-gray-900 mt-1">{user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg text-gray-900 mt-1">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">User ID</p>
                <p className="text-sm text-gray-900 mt-1 font-mono">{user.user_id}</p>
              </div>
            </div>
          </div>

          {/* System Statistics */}
          {systemStats && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                🌐 System Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{systemStats.total_users}</p>
                  <p className="text-sm text-blue-700">Total Users</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{systemStats.total_api_keys}</p>
                  <p className="text-sm text-green-700">Total API Keys</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{systemStats.total_requests_today}</p>
                  <p className="text-sm text-purple-700">Requests Today</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{systemStats.active_rate_limits}</p>
                  <p className="text-sm text-orange-700">Active Limits</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{systemStats.system_status}</p>
                  <p className="text-sm text-gray-700">System Status</p>
                </div>
              </div>
            </div>
          )}

          {/* Personal Statistics */}
          {stats && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                📊 Your Usage Statistics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.total_requests}</p>
                  <p className="text-sm text-blue-700">Total Requests</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.allowed_requests}</p>
                  <p className="text-sm text-green-700">✅ Allowed</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{stats.rejected_requests}</p>
                  <p className="text-sm text-red-700">❌ Rejected</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{stats.last_hour_requests}</p>
                  <p className="text-sm text-purple-700">⏰ Last Hour</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{stats.last_day_requests}</p>
                  <p className="text-sm text-orange-700">📅 Last Day</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                🔑 API Key Management
              </h2>
              <button
                onClick={createNewApiKey}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                ➕ Create New API Key
              </button>
            </div>

            {/* Current API Key */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Current API Key</h3>
              <div className="flex items-center space-x-2">
                <code className="bg-white px-3 py-2 rounded border flex-1 font-mono text-sm">
                  {user.api_key || 'No API key available'}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(user.api_key)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            {/* API Keys List */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">All Your API Keys</h3>
              {userApiKeys.length > 0 ? (
                <div className="space-y-3">
                  {userApiKeys.map((apiKey, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                          <code className="text-sm text-gray-600 font-mono">{apiKey.api_key}</code>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {apiKey.max_requests} req / {apiKey.window_seconds}s
                          </p>
                          <span className={`inline-block px-2 py-1 text-xs rounded ${
                            apiKey.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {apiKey.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No additional API keys found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'testing' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            🧪 Rate Limit Testing
          </h2>
          <p className="text-gray-600 mb-6">
            Test your rate limiting functionality. You can make up to 10 requests per minute.
          </p>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={testRateLimit}
              disabled={testLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {testLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing...
                </>
              ) : (
                '🚀 Send Test Request'
              )}
            </button>
          </div>

          {testResult && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Test Result</h3>
                <span className="text-sm text-gray-500">{testResult.timestamp}</span>
              </div>
              
              <div className={`p-3 rounded ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {testResult.success ? (
                  <div>
                    <p className="text-green-800 font-medium">✅ Request Successful</p>
                    <pre className="text-sm mt-2 text-green-700 overflow-auto">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <p className="text-red-800 font-medium">❌ Request Failed</p>
                    <p className="text-red-700 text-sm mt-1">
                      Status: {testResult.status} | Error: {testResult.error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'docs' && (
        <APIDocs user={user} />
      )}
    </div>
  );
};

export default Dashboard;