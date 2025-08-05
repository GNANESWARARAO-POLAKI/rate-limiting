import React, { useState, useEffect } from 'react';
import axios from 'axios';

const APIDocs = ({ user }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testData, setTestData] = useState('{}');
  const [loading, setLoading] = useState(false);

  const endpoints = [
    {
      method: 'POST',
      path: '/check-limit',
      description: 'Check if request is within rate limit (for authenticated users)',
      requiresAuth: false,
      requiresApiKey: true,
      example: {
        api_key: user?.api_key || 'your_api_key',
        user_id: 'user123',
        endpoint: '/api/data'
      }
    },
    {
      method: 'POST',
      path: '/check-limit-ip',
      description: 'Check rate limit for anonymous users using IP address',
      requiresAuth: false,
      requiresApiKey: true,
      example: {
        api_key: user?.api_key || 'your_api_key',
        endpoint: '/api/public-endpoint'
      }
    },
    {
      method: 'GET',
      path: '/health',
      description: 'Health check endpoint',
      requiresAuth: false,
      requiresApiKey: false,
      example: null
    }
  ];

  const testEndpoint = async (endpoint) => {
    setLoading(true);
    setTestResult(null);

    try {
      let url = endpoint.path;
      let headers = { 'Content-Type': 'application/json' };
      let data = null;

      // Handle URL parameters
      if (endpoint.urlParams && endpoint.path.includes('{api_key}')) {
        url = endpoint.path.replace('{api_key}', user?.api_key || 'demo123');
      }

      // Add authorization header if required
      if (endpoint.requiresAuth && user?.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`;
      }

      // Add API key header if required
      if (endpoint.requiresApiKey && user?.api_key) {
        headers['X-API-Key'] = user.api_key;
      }

      // Parse test data for POST requests
      if (endpoint.method === 'POST' && endpoint.example) {
        try {
          data = JSON.parse(testData);
        } catch (e) {
          data = endpoint.example;
        }
      }

      const config = {
        method: endpoint.method.toLowerCase(),
        url: `http://localhost:8000${url}`,
        headers,
        ...(data && { data })
      };

      const response = await axios(config);

      setTestResult({
        success: true,
        status: response.status,
        data: response.data,
        timestamp: new Date().toLocaleTimeString()
      });

    } catch (error) {
      setTestResult({
        success: false,
        status: error.response?.status || 'Network Error',
        error: error.response?.data || error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  const selectEndpoint = (endpoint) => {
    setSelectedEndpoint(endpoint);
    setTestData(JSON.stringify(endpoint.example || {}, null, 2));
    setTestResult(null);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        📚 API Documentation & Testing
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoints List */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Available Endpoints</h3>
          <div className="space-y-2">
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                onClick={() => selectEndpoint(endpoint)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedEndpoint?.path === endpoint.path
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono">{endpoint.path}</code>
                  </div>
                  <div className="flex space-x-1">
                    {endpoint.requiresAuth && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Auth</span>
                    )}
                    {endpoint.requiresApiKey && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">API Key</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{endpoint.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Test Interface */}
        <div>
          {selectedEndpoint ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Test Endpoint: {selectedEndpoint.method} {selectedEndpoint.path}
              </h3>

              {selectedEndpoint.example && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Request Body (JSON):
                  </label>
                  <textarea
                    value={testData}
                    onChange={(e) => setTestData(e.target.value)}
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                    placeholder="Enter JSON data..."
                  />
                </div>
              )}

              <div className="mb-4">
                <button
                  onClick={() => testEndpoint(selectedEndpoint)}
                  disabled={loading || (selectedEndpoint.requiresAuth && !user?.access_token)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Testing...
                    </>
                  ) : (
                    '🚀 Test Endpoint'
                  )}
                </button>

                {selectedEndpoint.requiresAuth && !user?.access_token && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ This endpoint requires authentication. Please login first.
                  </p>
                )}
              </div>

              {testResult && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Response</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {testResult.status}
                      </span>
                      <span className="text-xs text-gray-500">{testResult.timestamp}</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                    <pre className="text-sm overflow-auto max-h-64">
                      {JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>👈 Select an endpoint from the list to test it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default APIDocs;
