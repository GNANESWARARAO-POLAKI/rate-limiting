import React, { useState } from 'react';
import axios from 'axios';

const DebugLogin = () => {
    const [email, setEmail] = useState('demo@example.com');
    const [password, setPassword] = useState('demo123');
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const testLogin = async () => {
        setResult('');
        setError('');

        try {
            console.log('Testing login with:', { email, password });

            // Test the form data approach
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await axios.post('http://localhost:8000/login', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Login response:', response.data);
            setResult(JSON.stringify(response.data, null, 2));

        } catch (err) {
            console.error('Login error:', err);
            console.error('Error response:', err.response?.data);

            let errorMessage = 'Unknown error';
            if (err.response?.data) {
                errorMessage = JSON.stringify(err.response.data, null, 2);
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        }
    };

    const testRegister = async () => {
        setResult('');
        setError('');

        try {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpass123'
            };

            console.log('Testing registration with:', userData);

            const response = await axios.post('http://localhost:8000/register', userData);

            console.log('Registration response:', response.data);
            setResult(JSON.stringify(response.data, null, 2));

        } catch (err) {
            console.error('Registration error:', err);
            console.error('Error response:', err.response?.data);

            let errorMessage = 'Unknown error';
            if (err.response?.data) {
                errorMessage = JSON.stringify(err.response.data, null, 2);
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">🔧 Debug Login</h1>

            <div className="space-y-4 mb-6">
                <div>
                    <label className="block mb-2">Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block mb-2">Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div className="space-x-4">
                    <button
                        onClick={testLogin}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        🔐 Test Login
                    </button>

                    <button
                        onClick={testRegister}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        📝 Test Register
                    </button>
                </div>
            </div>

            {result && (
                <div className="mb-4">
                    <h3 className="font-bold text-green-600 mb-2">✅ Success:</h3>
                    <pre className="bg-green-50 p-4 rounded border text-sm overflow-auto">
                        {result}
                    </pre>
                </div>
            )}

            {error && (
                <div className="mb-4">
                    <h3 className="font-bold text-red-600 mb-2">❌ Error:</h3>
                    <pre className="bg-red-50 p-4 rounded border text-sm overflow-auto">
                        {error}
                    </pre>
                </div>
            )}

            <div className="mt-8 p-4 bg-gray-50 rounded">
                <h3 className="font-bold mb-2">🔍 Debug Info:</h3>
                <p><strong>Backend URL:</strong> http://localhost:8000</p>
                <p><strong>Demo Credentials:</strong> demo@example.com / demo123</p>
                <p><strong>Console:</strong> Check browser console for detailed logs</p>
            </div>
        </div>
    );
};

export default DebugLogin;
