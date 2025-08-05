import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_KEY = process.env.REACT_APP_API_KEY || 'rl_sjTMNROLZd1YaMHvq1QL6k7374Lj0ow8xRCT19XcWss';

function App() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [rateLimitTest, setRateLimitTest] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check API health
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => console.error('Health check failed:', err));
  }, []);

  // Test rate limiting
  const testRateLimit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/check-limit-ip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: API_KEY,
          endpoint: '/test-dashboard'
        })
      });
      const data = await response.json();
      setRateLimitTest(data);
    } catch (error) {
      console.error('Rate limit test failed:', error);
      setRateLimitTest({ error: 'Test failed' });
    }
    setLoading(false);
  };

  // Get system stats
  const getStats = async () => {
    try {
      const response = await fetch(`${API_URL}/system-stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Stats failed:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Rate Limiting Dashboard</h1>
        <p>Monitor and test your IP-based rate limiting service</p>
      </header>

      <main className="container">
        {/* API Health Status */}
        <section className="card">
          <h2>📊 API Health Status</h2>
          {health ? (
            <div className={`status ${health.status}`}>
              <p><strong>Status:</strong> {health.status}</p>
              <p><strong>Database:</strong> {health.database}</p>
              <p><strong>Service:</strong> {health.service}</p>
              <p><strong>Version:</strong> {health.version}</p>
              <small>Last checked: {health.timestamp}</small>
            </div>
          ) : (
            <p>Loading health status...</p>
          )}
        </section>

        {/* Rate Limit Testing */}
        <section className="card">
          <h2>🧪 Rate Limit Testing</h2>
          <button onClick={testRateLimit} disabled={loading}>
            {loading ? 'Testing...' : 'Test Rate Limit'}
          </button>
          
          {rateLimitTest && (
            <div className="test-result">
              <h3>Test Result:</h3>
              <pre>{JSON.stringify(rateLimitTest, null, 2)}</pre>
            </div>
          )}
        </section>

        {/* System Statistics */}
        <section className="card">
          <h2>📈 System Statistics</h2>
          <button onClick={getStats}>Refresh Stats</button>
          
          {stats && (
            <div className="stats">
              <div className="stat-item">
                <span>Total API Keys:</span>
                <span>{stats.total_api_keys}</span>
              </div>
              <div className="stat-item">
                <span>Active API Keys:</span>
                <span>{stats.active_api_keys}</span>
              </div>
              <div className="stat-item">
                <span>Total Requests (24h):</span>
                <span>{stats.total_requests_24h}</span>
              </div>
              <div className="stat-item">
                <span>Active Rate Limits:</span>
                <span>{stats.active_rate_limits}</span>
              </div>
            </div>
          )}
        </section>

        {/* API Information */}
        <section className="card">
          <h2>🔗 API Information</h2>
          <div className="api-info">
            <p><strong>Base URL:</strong> <code>{API_URL}</code></p>
            <p><strong>Health Check:</strong> <a href={`${API_URL}/health`} target="_blank" rel="noopener noreferrer">{API_URL}/health</a></p>
            <p><strong>API Docs:</strong> <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer">{API_URL}/docs</a></p>
            <p><strong>Demo API Key:</strong> <code>{API_KEY.substring(0, 20)}...</code></p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
