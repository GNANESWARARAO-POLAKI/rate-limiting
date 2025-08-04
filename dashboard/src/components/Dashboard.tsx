import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  user_id: string;
  name: string;
  email: string;
  access_token: string;
  api_key?: string;
}

interface RateLimitStats {
  api_key: string;
  total_requests: number;
  allowed_requests: number;
  rejected_requests: number;
  last_hour_requests: number;
  last_day_requests: number;
}

interface DashboardProps {
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.api_key) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user?.api_key) return;
    
    try {
      const response = await axios.get(`http://localhost:8000/stats/${user.api_key}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const testRateLimit = async () => {
    if (!user?.api_key) return;
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/test-endpoint', {}, {
        headers: {
          'X-API-Key': user.api_key
        }
      });
      setTestResult(response.data);
    } catch (error: any) {
      setTestResult({
        error: error.response?.data?.detail || 'Request failed',
        status: error.response?.status
      });
    } finally {
      setLoading(false);
      // Refresh stats after test
      setTimeout(fetchStats, 500);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
          
          {/* User Info */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg text-gray-900">{user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg text-gray-900">{user.email}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">API Key</p>
                <p className="text-lg text-gray-900 font-mono bg-gray-100 p-2 rounded">
                  {user.api_key || 'Not available'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rate Limit Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.total_requests}</p>
                  <p className="text-sm text-gray-500">Total Requests</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.allowed_requests}</p>
                  <p className="text-sm text-gray-500">Allowed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{stats.rejected_requests}</p>
                  <p className="text-sm text-gray-500">Rejected</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">{stats.last_hour_requests}</p>
                  <p className="text-sm text-gray-500">Last Hour</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{stats.last_day_requests}</p>
                  <p className="text-sm text-gray-500">Last Day</p>
                </div>
              </div>
            </div>
          )}

          {/* Test Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Rate Limiting</h2>
            <p className="text-gray-600 mb-4">
              Test the rate limiting functionality. You can make up to 10 requests per minute.
            </p>
            
            <div className="flex space-x-4 mb-4">
              <button
                onClick={testRateLimit}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Request'}
              </button>
              
              <button
                onClick={fetchStats}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Refresh Stats
              </button>
            </div>

            {testResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h3 className="font-semibold mb-2">Test Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
