import React, { useState } from 'react';

const CreateAPIKeyModal = ({ isOpen, onClose, onCreateKey, user }) => {
    const [keyData, setKeyData] = useState({
        name: '',
        max_requests: 60,
        window_seconds: 60
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setKeyData(prev => ({
            ...prev,
            [name]: name === 'max_requests' || name === 'window_seconds' ? parseInt(value) || 0 : value
        }));
    };

    const getRequestsPerMinute = () => {
        if (keyData.window_seconds === 60) {
            return keyData.max_requests;
        }
        return Math.round((keyData.max_requests / keyData.window_seconds) * 60);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!keyData.name.trim()) {
            setError('API key name is required');
            return;
        }

        if (keyData.max_requests < 1 || keyData.max_requests > 10000) {
            setError('Max requests must be between 1 and 10,000');
            return;
        }

        if (keyData.window_seconds < 1 || keyData.window_seconds > 3600) {
            setError('Window seconds must be between 1 and 3,600 (1 hour)');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onCreateKey(keyData);
            // Reset form
            setKeyData({
                name: '',
                max_requests: 60,
                window_seconds: 60
            });
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create API key');
        } finally {
            setLoading(false);
        }
    };

    const presetConfigs = [
        { name: 'Light Usage', max_requests: 60, window_seconds: 60, desc: '60 req/min' },
        { name: 'Moderate Usage', max_requests: 300, window_seconds: 60, desc: '300 req/min' },
        { name: 'Heavy Usage', max_requests: 1000, window_seconds: 60, desc: '1000 req/min' },
        { name: 'Burst Allowed', max_requests: 100, window_seconds: 10, desc: '100 req/10s' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">🔑 Create New API Key</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* API Key Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Key Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={keyData.name}
                            onChange={handleInputChange}
                            placeholder="e.g., Production API, Testing Key"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Preset Configurations */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quick Presets
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {presetConfigs.map((preset, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setKeyData(prev => ({
                                        ...prev,
                                        max_requests: preset.max_requests,
                                        window_seconds: preset.window_seconds
                                    }))}
                                    className="p-2 text-xs border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300"
                                >
                                    <div className="font-medium">{preset.name}</div>
                                    <div className="text-gray-500">{preset.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Requests *
                            </label>
                            <input
                                type="number"
                                name="max_requests"
                                value={keyData.max_requests}
                                onChange={handleInputChange}
                                min="1"
                                max="10000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Window (seconds) *
                            </label>
                            <input
                                type="number"
                                name="window_seconds"
                                value={keyData.window_seconds}
                                onChange={handleInputChange}
                                min="1"
                                max="3600"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Rate Display */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-sm text-blue-800">
                            <strong>📊 Effective Rate:</strong> {getRequestsPerMinute()} requests per minute
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                            {keyData.max_requests} requests every {keyData.window_seconds} second{keyData.window_seconds !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <span className="inline-block animate-spin mr-1">⌛</span>
                                    Creating...
                                </>
                            ) : (
                                '🔑 Create API Key'
                            )}
                        </button>
                    </div>
                </form>

                {/* Help Text */}
                <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <strong>💡 Tips:</strong>
                    <ul className="mt-1 space-y-1">
                        <li>• Lower limits for public APIs, higher for internal use</li>
                        <li>• Window of 60s = traditional "per minute" limit</li>
                        <li>• Smaller windows allow burst traffic</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CreateAPIKeyModal;
