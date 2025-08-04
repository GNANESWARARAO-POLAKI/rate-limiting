import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface RateLimitStats {
  api_key: string;
  total_requests: number;
  allowed_requests: number;
  rejected_requests: number;
  last_hour_requests: number;
  last_day_requests: number;
}

interface SystemStats {
  total_api_keys: number;
  total_users: number;
  total_requests_today: number;
  active_rate_limits: number;
  system_status: string;
}

function App() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [apiKey, setApiKey] = useState('demo123');
  const [keyStats, setKeyStats] = useState<RateLimitStats | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/system-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  const fetchKeyStats = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/stats/${apiKey}`);
      setKeyStats(response.data);
    } catch (error) {
      console.error('Failed to fetch key stats:', error);
    }
  };

  const testRateLimit = async () => {
    try {
      const response = await axios.post('http://localhost:8000/check-limit', {
        api_key: apiKey,
        user_id: 'dashboard_user',
        endpoint: '/api/test'
      });
      setTestResult(response.data);
    } catch (error) {
      console.error('Failed to test rate limit:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🚀 Rate Limiting Dashboard
          </h1>
          <p className="text-gray-600">Monitor and manage your API rate limits</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* System Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🔑</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total API Keys
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total_api_keys}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">👥</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total_users}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📊</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Requests Today
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total_requests_today}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">⚡</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Limits
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.active_rate_limits}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Key Testing */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              🧪 Test Rate Limiting
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter API key"
                />
                
                <div className="mt-4 space-x-4">
                  <button
                    onClick={testRateLimit}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Test Rate Limit
                  </button>
                  <button
                    onClick={fetchKeyStats}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Get Stats
                  </button>
                </div>
              </div>

              <div>
                {testResult && (
                  <div className={`p-4 rounded-md ${testResult.allowed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <h4 className="font-medium mb-2">Test Result:</h4>
                    <p><strong>Allowed:</strong> {testResult.allowed ? '✅ Yes' : '❌ No'}</p>
                    <p><strong>Remaining:</strong> {testResult.remaining_quota}</p>
                    <p><strong>Retry After:</strong> {testResult.retry_after}s</p>
                    <p><strong>Message:</strong> {testResult.message}</p>
                  </div>
                )}

                {keyStats && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium mb-2">API Key Stats:</h4>
                    <p><strong>Total Requests:</strong> {keyStats.total_requests}</p>
                    <p><strong>Allowed:</strong> {keyStats.allowed_requests}</p>
                    <p><strong>Rejected:</strong> {keyStats.rejected_requests}</p>
                    <p><strong>Last Hour:</strong> {keyStats.last_hour_requests}</p>
                    <p><strong>Last Day:</strong> {keyStats.last_day_requests}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* API Endpoints Documentation */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              📚 API Endpoints
            </h3>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">POST /check-limit</h4>
                <p className="text-gray-600">Check if a request is within rate limits</p>
                <code className="text-xs bg-gray-100 p-2 rounded block mt-2">
                  {`{"api_key": "demo123", "user_id": "user123", "endpoint": "/api/login"}`}
                </code>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium">POST /register</h4>
                <p className="text-gray-600">Register a new user account</p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-medium">GET /stats/{`{api_key}`}</h4>
                <p className="text-gray-600">Get usage statistics for an API key</p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium">GET /logs</h4>
                <p className="text-gray-600">View usage logs and violations</p>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block"
              >
                📖 View Full API Documentation
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
