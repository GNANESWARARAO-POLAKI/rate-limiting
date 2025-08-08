import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateAPIKeyModal from './CreateAPIKeyModal';
import APIDocs from './APIDocs';
import { backendWakeUp } from '../utils/backendWakeUp';

const Dashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [userApiKeys, setUserApiKeys] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [wakeUpStatus, setWakeUpStatus] = useState({
    isWaking: false,
    message: '',
    progress: 0,
    isReady: false
  });

  useEffect(() => {
    const fetchData = async () => {
      if (user?.access_token) {
        // First fetch API keys, then fetch stats
        await fetchUserApiKeys();
      }
    };
    fetchData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate useEffect to fetch stats after API keys are loaded
  useEffect(() => {
    const fetchDataAfterKeys = async () => {
      if (userApiKeys.length > 0) {
        await Promise.all([
          fetchStats(),
          fetchSystemStats()
        ]);
      }
    };
    fetchDataAfterKeys();
  }, [userApiKeys]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async () => {
    if (!user?.access_token || userApiKeys.length === 0) return;

    try {
      // Fetch stats for all user's API keys
      const statsPromises = userApiKeys.map(async (apiKeyObj) => {
        try {
      const response = await backendWakeUp.makeAPICall(
            () => axios.get(`https://rate-limiting.onrender.com/stats/${apiKeyObj.api_key}`),
        (status) => setWakeUpStatus(status)
      );
          return {
            api_key: apiKeyObj.api_key,
            name: apiKeyObj.name,
            ...response.data
          };
        } catch (error) {
          console.error(`Failed to fetch stats for API key ${apiKeyObj.name}:`, error);
          return null;
        }
      });

      const allStats = await Promise.all(statsPromises);
      const validStats = allStats.filter(stat => stat !== null);
      
      console.log('All API keys stats:', validStats);
      setStats(validStats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await backendWakeUp.makeAPICall(
        () => axios.get('https://rate-limiting.onrender.com/system-stats'),
        (status) => setWakeUpStatus(status)
      );
      console.log('System stats response:', response.data);
      setSystemStats(response.data);
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  const fetchUserApiKeys = async () => {
    if (!user?.access_token) return;

    try {
      const response = await axios.get('https://rate-limiting.onrender.com/api-keys', {
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
      const response = await axios.get('https://rate-limiting.onrender.com/api/protected', {
        params: { api_key: user.api_key }
      });
      setTestResult({
        success: true,
        data: response.data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      let errorMessage = 'Request failed';
      let retryAfter = null;

      if (error.response?.status === 429) {
        const detail = error.response.data?.detail;
        if (typeof detail === 'object' && detail.error) {
          errorMessage = detail.error;
          retryAfter = detail.retry_after;
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else {
          errorMessage = 'Rate limit exceeded';
        }
      } else {
        errorMessage = error.response?.data?.detail || error.message;
      }

      setTestResult({
        success: false,
        error: errorMessage,
        status: error.response?.status,
        retryAfter: retryAfter,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setTestLoading(false);
      setTimeout(fetchStats, 500);
    }
  };

  const createNewApiKey = async (keyData) => {
    try {
      const response = await axios.post('https://rate-limiting.onrender.com/api-keys', keyData, {
        headers: { Authorization: `Bearer ${user.access_token}` }
      });

      alert('API Key created successfully!');
      fetchUserApiKeys();
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || error.message);
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg disabled:opacity-50 flex items-center text-sm sm:text-base"
          >
            <span className="mr-1 sm:mr-2">{loading ? '🔄' : '🔄'}</span>
            <span className="hidden sm:inline">Refresh All</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>
      </div>

      {/* Backend Wake-up Status */}
      {wakeUpStatus.isWaking && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-blue-800">
                  {wakeUpStatus.message}
                </p>
                <div className="mt-2">
                  <div className="bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${wakeUpStatus.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg text-gray-900 mt-1">{user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg text-gray-900 mt-1">{user.email}</p>
              </div>
            </div>
          </div>

          {/* System Statistics */}
          {systemStats && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                🌐 System Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{systemStats.total_users}</p>
                  <p className="text-sm text-blue-700">Total Users</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{systemStats.total_api_keys}</p>
                  <p className="text-sm text-green-700">Total API Keys</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{systemStats.total_requests_24h}</p>
                  <p className="text-sm text-purple-700">Requests (24h)</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{systemStats.active_api_keys_24h}</p>
                  <p className="text-sm text-orange-700">Active Keys (24h)</p>
                </div>
              </div>
            </div>
          )}

          {/* Personal Statistics */}
          {stats && stats.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                📊 Your Usage Statistics ({stats.length} API Key{stats.length !== 1 ? 's' : ''})
              </h2>
              
              {/* Aggregated Statistics */}
              {(() => {
                const totalRequests24h = stats.reduce((sum, stat) => sum + (stat.total_requests_24h || 0), 0);
                const totalCurrentWindow = stats.reduce((sum, stat) => sum + (stat.current_window_requests || 0), 0);
                const allEndpoints = {};
                
                stats.forEach(stat => {
                  if (stat.endpoint_breakdown) {
                    Object.entries(stat.endpoint_breakdown).forEach(([endpoint, count]) => {
                      allEndpoints[endpoint] = (allEndpoints[endpoint] || 0) + count;
                    });
                  }
                });

                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{totalRequests24h}</p>
                  <p className="text-sm text-blue-700">Total Requests (24h)</p>
                        <p className="text-xs text-blue-600 mt-1">Across all keys</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{totalCurrentWindow}</p>
                  <p className="text-sm text-green-700">🕐 Current Window</p>
                        <p className="text-xs text-green-600 mt-1">All active keys</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{stats.length}</p>
                        <p className="text-sm text-purple-700">⚡ Active API Keys</p>
                        <p className="text-xs text-purple-600 mt-1">With recent activity</p>
                </div>
              </div>

                    {/* Combined Endpoint Breakdown */}
                    {Object.keys(allEndpoints).length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-medium text-gray-900 mb-3">📍 Combined Endpoint Usage (24h)</h3>
                  <div className="space-y-2">
                          {Object.entries(allEndpoints)
                            .sort(([,a], [,b]) => b - a)
                            .map(([endpoint, count]) => (
                      <div key={endpoint} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <code className="text-sm text-gray-700">{endpoint}</code>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                          {count} requests
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                  </>
                );
              })()}

              {/* Individual API Key Statistics */}
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-4">📋 Individual API Key Statistics</h3>
                <div className="space-y-4">
                  {stats.map((stat, index) => (
                    <div key={stat.api_key} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{stat.name}</h4>
                        <code className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                          {stat.api_key.substring(0, 8)}...
                        </code>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-lg font-bold text-blue-600">{stat.total_requests_24h || 0}</p>
                          <p className="text-xs text-blue-700">24h Requests</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-lg font-bold text-green-600">{stat.current_window_requests || 0}</p>
                          <p className="text-xs text-green-700">Current Window</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-lg font-bold text-purple-600">
                            {stat.rate_limit ? `${stat.rate_limit.max_requests}/${stat.rate_limit.window_seconds}s` : 'N/A'}
                          </p>
                          <p className="text-xs text-purple-700">Rate Limit</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-lg font-bold text-orange-600">
                            {stat.last_request ? '✅' : '❌'}
                          </p>
                          <p className="text-xs text-orange-700">Recent Activity</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                        <div className="bg-white p-2 rounded">
                          <span className="font-medium">Last Request:</span><br/>
                          {stat.last_request ? new Date(stat.last_request).toLocaleString() : 'No requests yet'}
                        </div>
                        <div className="bg-white p-2 rounded">
                          <span className="font-medium">Window Started:</span><br/>
                          {stat.window_start ? new Date(stat.window_start).toLocaleString() : 'No window active'}
                        </div>
                      </div>

                      {/* Individual endpoint breakdown */}
                      {stat.endpoint_breakdown && Object.keys(stat.endpoint_breakdown).length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium text-gray-700 mb-2 text-sm">Endpoint Usage:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(stat.endpoint_breakdown).map(([endpoint, count]) => (
                              <div key={endpoint} className="flex justify-between items-center p-2 bg-white rounded text-xs">
                                <code className="text-gray-600">{endpoint}</code>
                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                  {count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* No Statistics Available */}
          {(!stats || stats.length === 0) && userApiKeys.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                📊 Your Usage Statistics
              </h2>
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Usage Data Yet</h3>
                <p className="text-gray-600 mb-4">
                  Start using your API keys to see usage statistics here.
                </p>
                <p className="text-sm text-gray-500">
                  Statistics will show requests, rate limits, and endpoint usage across all your API keys.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                🔑 API Key Management
              </h2>
              <button
                onClick={() => setShowCreateKeyModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto"
              >
                <span className="sm:hidden">➕ Create Key</span>
                <span className="hidden sm:inline">➕ Create New API Key</span>
              </button>
            </div>

            {/* API Keys List */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">All Your API Keys</h3>
              {userApiKeys.length > 0 ? (
                <div className="space-y-3">
                  {userApiKeys.map((apiKey, index) => (
                    <div key={index} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 w-full sm:w-auto">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base">{apiKey.name}</h4>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-1">
                            <code className="text-xs sm:text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded break-all w-full sm:w-auto">
                              {apiKey.api_key}
                            </code>
                            <button
                              onClick={() => navigator.clipboard.writeText(apiKey.api_key)}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs whitespace-nowrap"
                            >
                              📋 Copy
                            </button>
                          </div>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          <p className="text-xs sm:text-sm text-gray-600">
                            {apiKey.max_requests} req / {apiKey.window_seconds}s
                          </p>
                          <p className="text-xs text-gray-500">
                            (~{Math.round((apiKey.max_requests * 60) / apiKey.window_seconds)} req/min)
                          </p>
                          <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${apiKey.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {apiKey.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8 text-sm sm:text-base">No additional API keys found</p>
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
            Test your rate limiting functionality. Demo users can make up to 10 requests per minute (10 requests per 60 seconds).
            Try clicking the test button rapidly to see rate limiting in action!
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
                    {testResult.status === 429 && testResult.retryAfter && (
                      <p className="text-red-600 text-sm mt-2 font-medium">
                        🔄 Rate limit exceeded. Refresh in {testResult.retryAfter}s
                      </p>
                    )}
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

      {/* Create API Key Modal */}
      <CreateAPIKeyModal
        isOpen={showCreateKeyModal}
        onClose={() => setShowCreateKeyModal(false)}
        onCreateKey={createNewApiKey}
        user={user}
      />
    </div>
  );
};

export default Dashboard;