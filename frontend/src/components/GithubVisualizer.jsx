import React, { useState, useEffect } from 'react';
import { ChevronRight, FileText, Github, Loader, Copy, Check, Star, GitFork, Folder } from 'lucide-react';
import FilterControls from './filters/FilterControls';
import TextExport from './TextExport';
import { getApiBaseUrl } from "../config.js";

const GithubVisualizer = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [repoData, setRepoData] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
    const [copied, setCopied] = useState(false);
    const [backendStatus, setBackendStatus] = useState('checking');
    const [activeTab, setActiveTab] = useState('tree');
    const [selectedNodes, setSelectedNodes] = useState(new Set());
    const [filteredStructure, setFilteredStructure] = useState(null);
    const [activeFilters, setActiveFilters] = useState({
        extensions: [],
        ignorePatterns: {
            'node_modules/': true,
            '.git/': true,
            'build/': true,
            'dist/': true,
            '.vscode/': true,
            '.idea/': true
        }
    });
    const API_BASE_URL = getApiBaseUrl();

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

    // Apply filters whenever activeFilters or repoData changes
    useEffect(() => {
        if (!repoData) return;

        const applyFilters = (nodes) => {
            return nodes.filter(node => {
                // Check ignore patterns first
                const shouldIgnore = Object.entries(activeFilters.ignorePatterns)
                    .some(([pattern, enabled]) => enabled && node.path.includes(pattern));
                if (shouldIgnore) return false;

                // If it's a directory, process its children
                if (node.type === 'directory') {
                    const filteredChildren = applyFilters(node.children || []);
                    node.children = filteredChildren;
                    return filteredChildren.length > 0; // Keep directory if it has visible children
                }

                // For files, check extensions
                if (activeFilters.extensions.length > 0) {
                    const ext = node.name.split('.').pop();
                    return activeFilters.extensions.includes(ext);
                }

                return true;
            });
        };

        const filtered = applyFilters([...repoData.structure]);
        setFilteredStructure(filtered);
    }, [activeFilters, repoData]);

    const handleFiltersChange = (newFilters) => {
        setActiveFilters(newFilters);
    };

    const handleNodeSelect = (nodePath, isSelected) => {
        setSelectedNodes(prev => {
            const newSelection = new Set(prev);
            if (isSelected) {
                newSelection.add(nodePath);
            } else {
                newSelection.delete(nodePath);
            }
            return newSelection;
        });
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

    // Modified renderNode function with checkboxes and file sizes
    const renderNode = (node, path = '') => {
        const fullPath = `${path}/${node.name}`;
        const isExpanded = expandedNodes.has(fullPath);
        const level = (fullPath.match(/\//g) || []).length - 1;
        const paddingLeft = `${level * 1.5}rem`;
        const isSelected = selectedNodes.has(fullPath);

        return (
            <div key={fullPath} className="transition-all duration-200">
                <div
                    className="flex items-center py-1.5 hover:bg-slate-50 cursor-pointer rounded transition-colors duration-150"
                    style={{ paddingLeft }}
                >
                    {/* Checkbox */}
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleNodeSelect(fullPath, e.target.checked)}
                        className="mr-2 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />

                    {/* Expand/Collapse arrow for directories */}
                    <span
                        className="w-4 h-4 flex items-center justify-center"
                        onClick={() => node.type === 'directory' && toggleNode(fullPath)}
                    >
                        {node.type === 'directory' && (
                            <ChevronRight
                                size={16}
                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                            />
                        )}
                    </span>
                    
                    {node.type === 'directory' ? (
                        <Folder size={16} className="mr-2 text-blue-600" />
                    ) : (
                        <FileText size={16} className="mr-2 text-slate-500" />
                    )}

                    {/* Name and size */}
                    <span className="flex-1 select-none text-slate-700">{node.name}</span>
                    {node.type === 'file' && node.size && (
                        <span className="text-sm text-slate-500 mr-4">
                            {(node.size / 1024).toFixed(1)} KB
                        </span>
                    )}
                </div>

                {/* Render children for directories */}
                {node.type === 'directory' && node.children && (
                    <div
                        className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
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

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                throw new Error(error.detail || 'Failed to fetch repository structure');
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

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="text-center space-y-4 py-8">
                    <h1 className="text-4xl font-bold text-slate-900">GitHub Repository Visualizer</h1>
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
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Enter GitHub repository URL"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg flex items-center space-x-2 hover:bg-blue-700"
                            disabled={loading}
                        >
                            {loading ? <Loader className="animate-spin" size={18} /> : <Github />}
                            <span>Fetch</span>
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </form>

                {/* Repository Visualization */}
                {repoData && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Repo Header */}
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex items-center gap-4">
                                <Github size={40} />
                                <div className="text-sm text-slate-700">
                                    <h3 className="text-xl font-semibold">{repoData.name}</h3>
                                    <p>{repoData.description}</p>
                                    <div className="flex gap-3 mt-2">
                                        <div className="flex items-center">
                                            <Star size={16} className="mr-1" />
                                            <span>{repoData.stars}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <GitFork size={16} className="mr-1" />
                                            <span>{repoData.forks}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Switch */}
                        <div className="border-b border-slate-200">
                            <div className="flex gap-8 text-sm font-medium">
                                <button
                                    type="button"
                                    className={`py-4 px-6 ${activeTab === 'tree' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                                    onClick={() => setActiveTab('tree')}
                                >
                                    Tree View
                                </button>
                                <button
                                    type="button"
                                    className={`py-4 px-6 ${activeTab === 'text' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                                    onClick={() => setActiveTab('text')}
                                >
                                    Text Export
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            {activeTab === 'tree' && (
                                <>
                                    <FilterControls
                                        repoData={repoData}
                                        onFiltersChange={handleFiltersChange}
                                    />
                                    <div className="p-4 font-mono text-sm">
                                        {(filteredStructure || []).map(node => renderNode(node, ''))}
                                    </div>
                                </>
                            )}
                            {activeTab === 'text' && (
                                <TextExport repoData={repoData} url={url} />
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center mt-12 py-6">
                    <p className="text-sm text-slate-600">
                        Made with ❤️ by pratikpaudel. <br />
                        Star this project on{' '}
                        <a href="https://github.com/pratikpaudel/gitNest" target="_blank" rel="noopener noreferrer" className="text-blue-500">
                            GitHub
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GithubVisualizer;
