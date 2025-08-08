import React, { useState } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';

const APIDocs = ({ user }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('JavaScript');
  const [testResult, setTestResult] = useState(null);
  const [testData, setTestData] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  const API_BASE_URL = 'https://rate-limiting.onrender.com';

  const languages = ['JavaScript', 'Python', 'Java', 'cURL', 'PHP'];

  const endpoints = [
    {
      method: 'POST',
      path: '/check-limit',
      description: 'Check if request is within rate limit (for authenticated users)',
      requiresAuth: false,
      requiresApiKey: true,
      parameters: [
        { name: 'api_key', type: 'string', required: true, description: 'Your API key' },
        { name: 'user_id', type: 'string', required: true, description: 'Unique user identifier' },
        { name: 'endpoint', type: 'string', required: true, description: 'The endpoint being accessed' }
      ],
      example: {
        api_key: user?.api_key || 'your_api_key_here',
        user_id: 'user123',
        endpoint: '/api/data'
      },
      response: {
        success: {
          allowed: true,
          remaining: 95,
          reset_time: "2025-08-06T10:15:00Z",
          user_id: "user123"
        },
        rateLimited: {
          allowed: false,
          remaining: 0,
          reset_time: "2025-08-06T10:15:00Z",
          user_id: "user123"
        }
      },
      responseExample: {
        allowed: true,
        remaining_quota: 9,
        retry_after: 0,
        message: "Request allowed",
        endpoint: "/api/data",
        user_id: "user123"
      }
    },
    {
      method: 'POST',
      path: '/check-limit-ip',
      description: 'Check rate limit for anonymous users using IP address',
      requiresAuth: false,
      requiresApiKey: true,
      parameters: [
        { name: 'api_key', type: 'string', required: true, description: 'Your API key' },
        { name: 'endpoint', type: 'string', required: true, description: 'The endpoint being accessed' }
      ],
      example: {
        api_key: user?.api_key || 'your_api_key_here',
        endpoint: '/api/public-endpoint'
      },
      response: {
        success: {
          allowed: true,
          remaining: 8,
          reset_time: "2025-08-06T10:15:00Z",
          client_ip: "111.111.1.100"
        }
      },
      responseExample: {
        allowed: true,
        remaining_quota: 9,
        retry_after: 0,
        message: "Request allowed",
        endpoint: "/api/public-endpoint",
        client_ip: "106.215.170.116",
        identifier: "ip_106.215.111.226"
      }
    },
    {
      method: 'GET',
      path: '/health',
      description: 'Health check endpoint - Check if the API service is running',
      requiresAuth: false,
      requiresApiKey: false,
      parameters: [],
      example: null,
      response: {
        success: {
          status: "healthy",
          database: "connected",
          version: "2.0.0",
          service: "rate-limiting-api",
          timestamp: "2025-08-06T17:07:06.887695Z"
        }
      },
      responseExample: {
        status: "healthy",
        database: "connected", 
        version: "2.0.0",
        service: "rate-limiting-api",
        timestamp: "2025-08-06T15:34:28.213069Z"
      }
    }
  ];

  // Generate code examples for different languages
  const generateCodeExample = (endpoint, language) => {
    const url = `${API_BASE_URL}${endpoint.path}`;
    const apiKey = user?.api_key || 'your_api_key_here';
    
    // Build headers object
    const headers = { 'Content-Type': 'application/json' };
    if (endpoint.requiresApiKey) {
      headers['X-API-Key'] = apiKey;
    }
    if (endpoint.requiresAuth) {
      headers['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN';
    }
    
    switch (language.toLowerCase()) {
      case 'javascript':
        if (endpoint.method === 'GET') {
          const headersStr = endpoint.requiresApiKey || endpoint.requiresAuth 
            ? `  headers: ${JSON.stringify(headers, null, 4)},` 
            : '';
          return `// JavaScript (Fetch API)
fetch('${url}', {${headersStr ? '\n' + headersStr : ''}
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// JavaScript (Axios)
import axios from 'axios';

const config = {
  method: 'GET',
  url: '${url}'${headersStr ? ',\n  headers: ' + JSON.stringify(headers, null, 2) : ''}
};

axios(config)
  .then(response => console.log(response.data))
  .catch(error => console.error('Error:', error));`;
        } else {
          return `// JavaScript (Fetch API)
fetch('${url}', {
  method: 'POST',
  headers: ${JSON.stringify(headers, null, 4)},
  body: JSON.stringify(${JSON.stringify(endpoint.example, null, 2)})
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));

// JavaScript (Axios)
import axios from 'axios';

const config = {
  method: 'POST',
  url: '${url}',
  headers: ${JSON.stringify(headers, null, 2)},
  data: ${JSON.stringify(endpoint.example, null, 2)}
};

axios(config)
  .then(response => console.log(response.data))
  .catch(error => console.error('Error:', error));`;
        }
        
      case 'python':
        const pythonHeaders = { 'Content-Type': 'application/json' };
        if (endpoint.requiresApiKey) {
          pythonHeaders['X-API-Key'] = apiKey;
        }
        if (endpoint.requiresAuth) {
          pythonHeaders['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN';
        }
        
        const pythonHeadersStr = `\nheaders = ${JSON.stringify(pythonHeaders, null, 4).replace(/"/g, "'")}`;
        
        if (endpoint.method === 'GET') {
          return `# Python (requests library)
import requests${pythonHeadersStr}

response = requests.get('${url}', headers=headers)
print(response.json())

# Python (with error handling)
import requests${pythonHeadersStr}

try:
    response = requests.get('${url}', headers=headers)
    response.raise_for_status()  # Raise an exception for bad status codes
    data = response.json()
    print(data)
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")`;
        } else {
          return `# Python (requests library)
import requests${pythonHeadersStr}

data = ${JSON.stringify(endpoint.example, null, 2).replace(/"/g, "'")}

response = requests.post('${url}', json=data, headers=headers)
print(response.json())

# Python (with error handling)
import requests${pythonHeadersStr}

try:
    data = ${JSON.stringify(endpoint.example, null, 2).replace(/"/g, "'")}
    response = requests.post('${url}', json=data, headers=headers)
    response.raise_for_status()
    result = response.json()
    print(result)
except requests.exceptions.RequestException as e:
    print(f"Error: {e}")`;
        }
        
      case 'java':
        if (endpoint.method === 'GET') {
          let javaHeaders = '.header("Content-Type", "application/json")';
          if (endpoint.requiresApiKey) {
            javaHeaders += `\n    .header("X-API-Key", "${apiKey}")`;
          }
          if (endpoint.requiresAuth) {
            javaHeaders += '\n    .header("Authorization", "Bearer YOUR_ACCESS_TOKEN")';
          }
          
          return `// Java (using HttpURLConnection)
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${url}"))
    ${javaHeaders}
    .GET()
    .build();

try {
    HttpResponse<String> response = client.send(request, 
        HttpResponse.BodyHandlers.ofString());
    System.out.println(response.body());
} catch (Exception e) {
    e.printStackTrace();
}`;
        } else {
          let javaHeaders = '.header("Content-Type", "application/json")';
          if (endpoint.requiresApiKey) {
            javaHeaders += `\n    .header("X-API-Key", "${apiKey}")`;
          }
          if (endpoint.requiresAuth) {
            javaHeaders += '\n    .header("Authorization", "Bearer YOUR_ACCESS_TOKEN")';
          }
          
          return `// Java (using HttpURLConnection)
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

String json = """
${JSON.stringify(endpoint.example, null, 2)}
""";

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${url}"))
    ${javaHeaders}
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();

try {
    HttpResponse<String> response = client.send(request, 
        HttpResponse.BodyHandlers.ofString());
    System.out.println(response.body());
} catch (Exception e) {
    e.printStackTrace();
}`;
        }
        
      case 'curl':
        const curlHeaders = [];
        if (endpoint.requiresApiKey) {
          curlHeaders.push(`-H "X-API-Key: ${apiKey}"`);
        }
        if (endpoint.requiresAuth) {
          curlHeaders.push(`-H "Authorization: Bearer YOUR_ACCESS_TOKEN"`);
        }
        curlHeaders.push(`-H "Content-Type: application/json"`);
        
        if (endpoint.method === 'GET') {
          return `# cURL
curl -X GET "${url}" \\
  ${curlHeaders.join(' \\\n  ')}
  
# cURL (with verbose output)
curl -X GET "${url}" \\
  ${curlHeaders.join(' \\\n  ')} \\
  -v`;
        } else {
          return `# cURL
curl -X POST "${url}" \\
  ${curlHeaders.join(' \\\n  ')} \\
  -d '${JSON.stringify(endpoint.example)}'
  
# cURL (formatted)
curl -X POST "${url}" \\
  ${curlHeaders.join(' \\\n  ')} \\
  -d '${JSON.stringify(endpoint.example, null, 2)}'`;
        }
        
      case 'php':
        const phpHeaders = ['Content-Type: application/json'];
        if (endpoint.requiresApiKey) {
          phpHeaders.push(`X-API-Key: ${apiKey}`);
        }
        if (endpoint.requiresAuth) {
          phpHeaders.push('Authorization: Bearer YOUR_ACCESS_TOKEN');
        }
        
        if (endpoint.method === 'GET') {
          return `<?php
// PHP (using cURL)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${url}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    '${phpHeaders.join("',\n    '")}'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 200) {
    $data = json_decode($response, true);
    print_r($data);
} else {
    echo "Error: HTTP $httpCode";
}
?>`;
        } else {
          return `<?php
// PHP (using cURL)
$data = ${JSON.stringify(endpoint.example, null, 2)};

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${url}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    '${phpHeaders.join("',\n    '")}'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 200) {
    $result = json_decode($response, true);
    print_r($result);
} else {
    echo "Error: HTTP $httpCode";
}
?>`;
        }
        
      default:
        return 'Language not supported';
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCode(label);
      setTimeout(() => setCopiedCode(''), 2000);
    });
  };

  // Get Monaco language mapping
  const getMonacoLanguage = (language) => {
    const languageMap = {
      'JavaScript': 'javascript',
      'Python': 'python',
      'Java': 'java',
      'cURL': 'shell',
      'PHP': 'php'
    };
    return languageMap[language] || 'javascript';
  };

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
        url: `https://rate-limiting.onrender.com${url}`,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            🚀 Rate Limiting API Documentation
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Comprehensive API documentation with interactive testing and multi-language code examples
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column: Endpoints List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 sticky top-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <span className="bg-blue-100 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">📋</span>
                API Endpoints
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {endpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    onClick={() => selectEndpoint(endpoint)}
                    className={`p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${selectedEndpoint?.path === endpoint.path
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-full ${endpoint.method === 'GET' 
                          ? 'bg-green-500 text-white' 
                          : endpoint.method === 'POST' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-500 text-white'
                          }`}>
                          {endpoint.method}
                        </span>
                        <div className="flex space-x-1">
                          {endpoint.requiresAuth && (
                            <span className="px-1.5 sm:px-2 py-1 text-xs bg-yellow-400 text-yellow-900 rounded-full font-semibold">🔐 Auth</span>
                          )}
                          {endpoint.requiresApiKey && (
                            <span className="px-1.5 sm:px-2 py-1 text-xs bg-purple-400 text-purple-900 rounded-full font-semibold">🔑 Key</span>
                          )}
                        </div>
                      </div>
                      <code className="text-xs sm:text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded break-all">{endpoint.path}</code>
                      <p className="text-xs sm:text-sm text-gray-600">{endpoint.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Documentation & Testing */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {selectedEndpoint ? (
              <>
                {/* Code Examples */}
                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 sm:px-6 py-3 sm:py-4">
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center">
                      <span className="bg-blue-500 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">💻</span>
                      <span className="hidden sm:inline">Code Examples: {selectedEndpoint.method} {selectedEndpoint.path}</span>
                      <span className="sm:hidden text-sm">Code Examples</span>
                    </h3>
                  </div>

                  <div className="p-4 sm:p-6">
                    {/* Base URL Info */}
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <h4 className="font-bold text-blue-800 mb-2 flex items-center text-sm sm:text-base">
                        🌐 Base URL
                      </h4>
                      <div className="bg-white p-2 sm:p-3 rounded-lg border border-blue-300">
                        <code className="text-blue-900 font-mono text-xs sm:text-lg break-all">
                          https://rate-limiting.onrender.com
                        </code>
                      </div>
                    </div>

                    {/* Authentication Info */}
                    {(selectedEndpoint.requiresAuth || selectedEndpoint.requiresApiKey) && (
                      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-100 rounded-xl border border-yellow-300">
                        <h4 className="font-bold text-yellow-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                          🔐 Authentication Required
                        </h4>
                        <div className="space-y-2">
                          {selectedEndpoint.requiresAuth && (
                            <div className="flex flex-col sm:flex-row sm:items-center p-2 bg-white rounded-lg">
                              <span className="text-yellow-700 font-medium text-sm mb-1 sm:mb-0">Bearer Token:</span>
                              <code className="sm:ml-2 text-yellow-900 bg-yellow-100 px-2 py-1 rounded text-xs sm:text-sm break-all">Authorization: Bearer YOUR_TOKEN</code>
                            </div>
                          )}
                          {selectedEndpoint.requiresApiKey && (
                          <div className="flex flex-col sm:flex-row sm:items-center p-2 bg-white rounded-lg">
                            <span className="text-yellow-700 font-medium text-sm mb-1 sm:mb-0 shrink-0">API Key:</span>
                            <code className="sm:ml-2 text-yellow-900 bg-yellow-100 px-2 py-1 rounded text-xs sm:text-sm break-all">X-API-Key: {user?.api_key || 'YOUR_API_KEY'}</code>
                          </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Parameters Table */}
                    {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                      <div className="mb-4 sm:mb-6">
                        <h4 className="font-bold text-gray-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                          📝 Parameters
                        </h4>
                        <div className="overflow-x-auto rounded-xl border border-gray-300">
                          <table className="min-w-full bg-white text-sm">
                            <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                              <tr>
                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-700">Parameter</th>
                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-700">Type</th>
                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-700">Required</th>
                                <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-bold text-gray-700">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {selectedEndpoint.parameters.map((param, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 font-mono text-xs sm:text-sm font-semibold text-blue-600 break-all">{param.name}</td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 bg-gray-50 rounded">{param.type}</td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                                    {param.required ? 
                                      <span className="px-1.5 sm:px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Required</span> : 
                                      <span className="px-1.5 sm:px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Optional</span>
                                    }
                                  </td>
                                  <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-700">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Language Tabs */}
                    <div className="mb-4 sm:mb-6">
                      <h4 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Select Programming Language</h4>
                      <div className="flex flex-wrap gap-1 sm:gap-2 p-2 bg-gray-100 rounded-xl">
                        {languages.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setSelectedLanguage(lang)}
                            className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 ${
                              selectedLanguage === lang
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                                : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-sm hover:shadow-md'
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Code Example */}
                    <div className="mb-4 sm:mb-6">
                      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-800 to-black gap-3 sm:gap-0">
                          <div className="flex items-center space-x-3">
                            <div className="flex space-x-2">
                              <div className="w-2 sm:w-3 h-2 sm:h-3 bg-red-500 rounded-full"></div>
                              <div className="w-2 sm:w-3 h-2 sm:h-3 bg-yellow-500 rounded-full"></div>
                              <div className="w-2 sm:w-3 h-2 sm:h-3 bg-green-500 rounded-full"></div>
                            </div>
                            <span className="text-gray-300 text-xs sm:text-sm font-bold">{selectedLanguage} Example</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(
                              generateCodeExample(selectedEndpoint, selectedLanguage),
                              `${selectedLanguage}-${selectedEndpoint.path}`
                            )}
                            className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                          >
                            {copiedCode === `${selectedLanguage}-${selectedEndpoint.path}` ? (
                              <>
                                <span className="text-green-400">✓</span>
                                <span className="text-xs sm:text-sm font-medium">Copied!</span>
                              </>
                            ) : (
                              <>
                                <span>📋</span>
                                <span className="text-xs sm:text-sm font-medium">Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="bg-gray-900" style={{ minHeight: '250px' }}>
                          <Editor
                            height="250px"
                            language={getMonacoLanguage(selectedLanguage)}
                            theme="vs-dark"
                            value={generateCodeExample(selectedEndpoint, selectedLanguage)}
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: window.innerWidth < 640 ? 12 : 14,
                              lineNumbers: 'on',
                              roundedSelection: false,
                              scrollbar: {
                                vertical: 'auto',
                                horizontal: 'auto'
                              },
                              overviewRulerLanes: 0,
                              hideCursorInOverviewRuler: true,
                              overviewRulerBorder: false,
                              lineDecorationsWidth: 10,
                              lineNumbersMinChars: 3,
                              glyphMargin: false,
                              folding: true,
                              selectOnLineNumbers: true,
                              selectionHighlight: false,
                              wordWrap: 'on',
                              contextmenu: false,
                              mouseWheelZoom: false,
                              links: false,
                              colorDecorators: true,
                              accessibilitySupport: 'off',
                              autoIndent: 'full',
                              formatOnType: true,
                              formatOnPaste: true,
                              dragAndDrop: false,
                              occurrencesHighlight: false,
                              renderWhitespace: 'none',
                              renderControlCharacters: false,
                              renderIndentGuides: true,
                              renderLineHighlight: 'line',
                              codeLens: false,
                              matchBrackets: 'always',
                              find: {
                                seedSearchStringFromSelection: 'never',
                                autoFindInSelection: 'never'
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Response Example */}
                    {selectedEndpoint.responseExample && (
                      <div className="mb-4 sm:mb-6">
                        <h4 className="font-bold text-gray-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                          📤 Example Response
                        </h4>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-300 rounded-xl overflow-hidden">
                          <div className="px-3 sm:px-4 py-2 bg-green-200 border-b border-green-300">
                            <span className="text-green-800 font-bold text-sm sm:text-base">JSON Response</span>
                          </div>
                          <div className="bg-white">
                            <Editor
                              height="200px"
                              language="json"
                              theme="vs"
                              value={JSON.stringify(selectedEndpoint.responseExample, null, 2)}
                              options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: window.innerWidth < 640 ? 11 : 13,
                                lineNumbers: 'on',
                                roundedSelection: false,
                                scrollbar: {
                                  vertical: 'auto',
                                  horizontal: 'auto'
                                },
                                overviewRulerLanes: 0,
                                hideCursorInOverviewRuler: true,
                                overviewRulerBorder: false,
                                lineDecorationsWidth: 10,
                                lineNumbersMinChars: 3,
                                glyphMargin: false,
                                folding: true,
                                selectOnLineNumbers: true,
                                selectionHighlight: false,
                                wordWrap: 'on',
                                contextmenu: false,
                                mouseWheelZoom: false,
                                links: false,
                                colorDecorators: true,
                                accessibilitySupport: 'off',
                                autoIndent: 'full',
                                formatOnType: true,
                                formatOnPaste: true,
                                dragAndDrop: false,
                                occurrencesHighlight: false,
                                renderWhitespace: 'none',
                                renderControlCharacters: false,
                                renderIndentGuides: true,
                                renderLineHighlight: 'line',
                                codeLens: false,
                                matchBrackets: 'always'
                              }}
                            />
                          </div>
                        </div>

                        {/* Response Field Explanations */}
                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                          <h5 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">📋 Response Fields Explanation</h5>
                          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                            {selectedEndpoint.path === '/check-limit' && (
                              <>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">allowed:</span>
                                  <span className="text-gray-700">Boolean indicating if the request is within rate limit</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">remaining_quota:</span>
                                  <span className="text-gray-700">Number of requests remaining in the current window</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">retry_after:</span>
                                  <span className="text-gray-700">Seconds to wait before next request (0 if allowed)</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">message:</span>
                                  <span className="text-gray-700">Human-readable status message</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">endpoint:</span>
                                  <span className="text-gray-700">The endpoint being rate-limited</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">user_id:</span>
                                  <span className="text-gray-700">The user identifier for this request</span>
                                </div>
                              </>
                            )}
                            {selectedEndpoint.path === '/check-limit-ip' && (
                              <>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">allowed:</span>
                                  <span className="text-gray-700">Boolean indicating if the request is within rate limit</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">remaining_quota:</span>
                                  <span className="text-gray-700">Number of requests remaining in the current window</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">retry_after:</span>
                                  <span className="text-gray-700">Seconds to wait before next request (0 if allowed)</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">message:</span>
                                  <span className="text-gray-700">Human-readable status message</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">endpoint:</span>
                                  <span className="text-gray-700">The endpoint being rate-limited</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">client_ip:</span>
                                  <span className="text-gray-700">The client's IP address used for rate limiting</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">identifier:</span>
                                  <span className="text-gray-700">Unique identifier combining "ip_" with the client IP</span>
                                </div>
                              </>
                            )}
                            {selectedEndpoint.path === '/health' && (
                              <>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">status:</span>
                                  <span className="text-gray-700">Overall health status of the API service</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">database:</span>
                                  <span className="text-gray-700">Database connection status</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">version:</span>
                                  <span className="text-gray-700">Current version of the rate limiting API</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">service:</span>
                                  <span className="text-gray-700">Name of the service</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="font-mono text-blue-600 font-semibold min-w-0">timestamp:</span>
                                  <span className="text-gray-700">ISO 8601 timestamp of when the health check was performed</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Interface */}
                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-3 sm:px-4 py-2.5 sm:py-3">
                    <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                      <span className="bg-white bg-opacity-20 p-1 sm:p-1.5 rounded-lg mr-2">🧪</span>
                      Interactive Testing
                    </h3>
                  </div>

                  <div className="p-3 sm:p-4">
                    {selectedEndpoint.example && (
                      <div className="mb-3 sm:mb-4">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          📝 Request Body (JSON):
                        </label>
                        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden focus-within:border-purple-400 transition-colors duration-200">
                          <Editor
                            height="140px"
                            language="json"
                            theme="vs"
                            value={testData}
                            onChange={(value) => setTestData(value || '{}')}
                            options={{
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: window.innerWidth < 640 ? 12 : 14,
                              lineNumbers: 'on',
                              roundedSelection: false,
                              scrollbar: {
                                vertical: 'auto',
                                horizontal: 'auto'
                              },
                              overviewRulerLanes: 0,
                              hideCursorInOverviewRuler: true,
                              overviewRulerBorder: false,
                              lineDecorationsWidth: 10,
                              lineNumbersMinChars: 3,
                              glyphMargin: false,
                              folding: true,
                              selectOnLineNumbers: true,
                              selectionHighlight: true,
                              wordWrap: 'on',
                              contextmenu: true,
                              mouseWheelZoom: false,
                              links: false,
                              colorDecorators: true,
                              accessibilitySupport: 'off',
                              autoIndent: 'full',
                              formatOnType: true,
                              formatOnPaste: true,
                              dragAndDrop: false,
                              occurrencesHighlight: true,
                              renderWhitespace: 'none',
                              renderControlCharacters: false,
                              renderIndentGuides: true,
                              renderLineHighlight: 'line',
                              codeLens: false,
                              matchBrackets: 'always',
                              tabSize: 2,
                              insertSpaces: true,
                              detectIndentation: true,
                              trimAutoWhitespace: true,
                              largeFileOptimizations: true,
                              readOnly: false
                            }}
                          />
                          <div className="absolute top-1 sm:top-2 right-1 sm:right-2 text-xs text-gray-500 bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow">
                            JSON
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mb-3 sm:mb-4">
                      <button
                        onClick={() => testEndpoint(selectedEndpoint)}
                        disabled={loading || (selectedEndpoint.requiresAuth && !user?.access_token)}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-md"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 sm:h-5 w-4 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="hidden sm:inline">Testing API...</span>
                            <span className="sm:hidden">Testing...</span>
                          </>
                        ) : (
                          <>
                            <span className="mr-2">🚀</span>
                            <span className="hidden sm:inline">Test This Endpoint</span>
                            <span className="sm:hidden">Test Endpoint</span>
                          </>
                        )}
                      </button>

                      {selectedEndpoint.requiresAuth && !user?.access_token && (
                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs sm:text-sm text-red-700 font-medium flex items-center">
                            <span className="mr-2">⚠️</span>
                            This endpoint requires authentication. Please login first.
                          </p>
                        </div>
                      )}
                    </div>

                    {(testResult || loading) && (
                      <div className="border-2 rounded-lg overflow-hidden">
                        <div className={`px-4 py-3 ${
                          loading 
                            ? 'bg-blue-100 border-b border-blue-200' 
                            : testResult?.success 
                              ? 'bg-purple-100 border-b border-purple-200' 
                              : 'bg-red-100 border-b border-red-200'
                        }`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="font-semibold text-sm sm:text-base">
                              {loading ? 'Testing API...' : 'API Response'}
                            </h4>
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              {loading ? (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
                                      Processing...
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${testResult?.success ? 'bg-purple-500 text-white' : 'bg-red-500 text-white'}`}>
                                    {testResult?.success ? '✅ Success' : '❌ Error'} {testResult?.status}
                                  </span>
                                  <span className="text-xs text-gray-600 bg-white px-1.5 sm:px-2 py-1 rounded text-xs sm:text-sm">{testResult?.timestamp}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={`${
                          loading 
                            ? 'bg-blue-50' 
                            : testResult?.success 
                              ? 'bg-purple-50' 
                              : 'bg-red-50'
                        }`}>
                          {loading ? (
                            <div className="flex items-center justify-center py-20">
                              <div className="text-center">
                                <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <div className="space-y-2">
                                  <div className="text-blue-600 font-semibold">Testing API Endpoint</div>
                                  <div className="text-blue-500 text-sm">Please wait while we process your request...</div>
                                  <div className="flex justify-center space-x-1 mt-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Editor
                              height="200px"
                              language="json"
                              theme="vs"
                              value={JSON.stringify(testResult?.success ? testResult?.data : testResult?.error, null, 2)}
                              options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: window.innerWidth < 640 ? 11 : 13,
                                lineNumbers: 'on',
                                roundedSelection: false,
                                scrollbar: {
                                  vertical: 'auto',
                                  horizontal: 'auto'
                                },
                                overviewRulerLanes: 0,
                                hideCursorInOverviewRuler: true,
                                overviewRulerBorder: false,
                                lineDecorationsWidth: 10,
                                lineNumbersMinChars: 3,
                                glyphMargin: false,
                                folding: true,
                                selectOnLineNumbers: true,
                                selectionHighlight: false,
                                wordWrap: 'on',
                                contextmenu: false,
                                mouseWheelZoom: false,
                                links: false,
                                colorDecorators: true,
                                accessibilitySupport: 'off',
                                autoIndent: 'full',
                                formatOnType: true,
                                formatOnPaste: true,
                                dragAndDrop: false,
                                occurrencesHighlight: false,
                                renderWhitespace: 'none',
                                renderControlCharacters: false,
                                renderIndentGuides: true,
                                renderLineHighlight: 'line',
                                codeLens: false,
                                matchBrackets: 'always'
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 sm:py-20">
                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-12">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📋</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">Select an Endpoint to Get Started</h3>
                  <p className="text-gray-600 text-sm sm:text-lg px-2">
                    Choose an API endpoint from the left panel to view documentation and test it interactively
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIDocs;
