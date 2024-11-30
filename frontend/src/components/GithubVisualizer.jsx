import React, { useState, useEffect } from 'react';
import { ChevronRight, Folder, FileText, Github, Loader, Copy, Check, Star, GitFork } from 'lucide-react';

const GithubVisualizer = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [repoData, setRepoData] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
    const [copied, setCopied] = useState(false);
    const [backendStatus, setBackendStatus] = useState('checking');
    const API_BASE_URL = 'https://gitnest-185c.onrender.com/api';

    // Function to check backend health
    const checkBackendHealth = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            if (response.ok) {
                setBackendStatus('ready');
            } else {
                setBackendStatus('unavailable');
                setTimeout(checkBackendHealth, 5000); // Retry every 5 seconds
            }
        } catch (error) {
            setBackendStatus('starting');
            setTimeout(checkBackendHealth, 5000); // Retry every 5 seconds
        }
    };

    // Check backend health on component mount
    useEffect(() => {
        checkBackendHealth();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if backend is ready
        if (backendStatus !== 'ready') {
            setError('Backend is still starting up. Please wait a moment and try again.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let normalizedUrl = url.trim().replace(/\/+$/, '');
            const branchMatch = normalizedUrl.match(/\/tree\/([^/]+)/);

            if (!branchMatch) {
                normalizedUrl = `${normalizedUrl}/tree/main`;
            }

            const response = await fetch(`${API_BASE_URL}/structure`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify({ url: normalizedUrl }),
            });

            if (!response.ok) {
                const error = await response.json();
                new Error(error.detail || 'Failed to fetch repository structure');
            }

            const data = await response.json();
            setRepoData(data);
        } catch (err) {
            console.error('Error fetching repository:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleNode = (nodePath) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodePath)) {
            newExpanded.delete(nodePath);
        } else {
            newExpanded.add(nodePath);
        }
        setExpandedNodes(newExpanded);
    };

    const generateTextStructure = (nodes, level = 0) => {
        return nodes.map(node => {
            const indent = '  '.repeat(level);
            let result = `${indent}${node.name}${node.type === 'directory' ? '/' : ''}\n`;

            if (node.type === 'directory' && node.children) {
                result += generateTextStructure(node.children, level + 1);
            }

            return result;
        }).join('');
    };

    const handleCopyStructure = () => {
        if (!repoData) return;

        const textStructure = generateTextStructure(repoData.structure);
        navigator.clipboard.writeText(textStructure);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderNode = (node, path = '') => {
        const fullPath = `${path}/${node.name}`;
        const isExpanded = expandedNodes.has(fullPath);
        const level = (fullPath.match(/\//g) || []).length - 1;
        const paddingLeft = `${level * 1.5}rem`;

        return (
            <div key={fullPath} className="transition-all duration-200">
                <div
                    className={`flex items-center py-1.5 hover:bg-slate-50 cursor-pointer rounded transition-colors duration-150 ${
                        node.type === 'directory' ? 'font-medium' : ''
                    }`}
                    style={{ paddingLeft }}
                    onClick={() => node.type === 'directory' && toggleNode(fullPath)}
                >
                    <span className="w-4 h-4 flex items-center justify-center transition-transform duration-200">
                        {node.type === 'directory' && (
                            <ChevronRight
                                size={16}
                                className={`transform transition-transform duration-200 ${
                                    isExpanded ? 'rotate-90' : ''
                                }`}
                            />
                        )}
                    </span>
                    {node.type === 'directory' ? (
                        <Folder size={16} className="mr-2 text-blue-600" />
                    ) : (
                        <FileText size={16} className="mr-2 text-slate-500" />
                    )}
                    <span className="select-none text-slate-700">{node.name}</span>
                </div>

                {node.type === 'directory' && node.children && (
                    <div
                        className={`overflow-hidden transition-all duration-200 ${
                            isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                    >
                        {node.children.map(child => renderNode(child, fullPath))}
                    </div>
                )}
            </div>
        );
    };

    // Backend status banner component
    const BackendStatusBanner = () => {
        if (backendStatus === 'ready') return null;

        const statusMessages = {
            checking: 'Checking backend status...',
            starting: 'Backend is starting up (this may take about a minute)...',
            unavailable: 'Backend service is currently unavailable. Retrying...'
        };

        const statusColors = {
            checking: 'bg-blue-50 text-blue-700 border-blue-200',
            starting: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            unavailable: 'bg-red-50 text-red-700 border-red-200'
        };

        return (
            <div className={`p-4 ${statusColors[backendStatus]} border rounded-lg mb-4 flex items-center justify-center space-x-2`}>
                <Loader className="animate-spin" size={18} />
                <span>{statusMessages[backendStatus]}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="text-center space-y-4 py-8">
                    <h1 className="text-4xl font-bold text-slate-900">
                        GitHub Repository Visualizer
                    </h1>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                        Explore and visualize GitHub repository structures with an interactive tree view
                    </p>
                </div>

                {/* Backend Status Banner */}
                <BackendStatusBanner />

                {/* Search Form */}
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                    <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="flex-1">
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="https://github.com/username/repository"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={backendStatus !== 'ready'}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || backendStatus !== 'ready'}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin" size={18} />
                                    <span>Loading...</span>
                                </>
                            ) : (
                                <>
                                    <Github size={18} />
                                    <span>Visualize</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Error Message */}
                {error && (
                    <div className="max-w-3xl mx-auto">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                            <div className="text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                            </div>
                            <span className="text-red-700">{error}</span>
                        </div>
                    </div>
                )}

                {/* Repository Visualization */}
                {repoData && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Repository Header */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Github size={24} className="text-slate-700" />
                                        <h2 className="text-xl font-semibold text-slate-900">
                                            {repoData.repo_info.name}
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-600">
                                        <div className="flex items-center gap-1">
                                            <Star size={16} className="text-yellow-500" />
                                            <span>{repoData.repo_info.stars.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <GitFork size={16} className="text-blue-500" />
                                            <span>{repoData.repo_info.forks.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="flex items-center px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    onClick={handleCopyStructure}
                                >
                                    {copied ? (
                                        <>
                                            <Check size={16} className="mr-1.5" />
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} className="mr-1.5" />
                                            <span>Copy Structure</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            {repoData.repo_info.description && (
                                <p className="mt-2 text-slate-600">
                                    {repoData.repo_info.description}
                                </p>
                            )}
                        </div>

                        {/* Repository Structure */}
                        <div className="p-4 font-mono text-sm">
                            {repoData.structure.map(node => renderNode(node, ''))}
                        </div>
                    </div>
                )}
            </div>
            <div className="text-center py-8 text-slate-600">
                <div className="flex items-center justify-center gap-1 mb-2">
                    <span>Made with</span>
                    <svg
                        className="w-5 h-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span>by</span>
                    <a
                        href="https://github.com/pratikpaudel"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        pratikpaudel
                    </a>
                </div>
                <div>
                    <a
                        href="https://github.com/pratikpaudel/gitnest"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
                    >
                        Find this useful? <Star size={14} className="text-yellow-500" /> Star us on GitHub
                    </a>
                </div>
            </div>
        </div>
    );
};

export default GithubVisualizer;
