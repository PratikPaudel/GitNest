import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Github, Loader, Copy, Check } from 'lucide-react';

const GithubVisualizer = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [repoData, setRepoData] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8000/api/structure', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to fetch repository structure');
            }

            const data = await response.json();
            setRepoData(data);
        } catch (err) {
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
            <div key={fullPath}>
                <div
                    className="flex items-center py-1 hover:bg-gray-100 cursor-pointer rounded"
                    style={{ paddingLeft }}
                    onClick={() => node.type === 'directory' && toggleNode(fullPath)}
                >
                    {node.type === 'directory' ? (
                        <>
              <span className="w-4">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
                            <Folder size={16} className="mr-2 text-blue-500" />
                        </>
                    ) : (
                        <>
                            <span className="w-4" />
                            <FileText size={16} className="mr-2 text-gray-500" />
                        </>
                    )}
                    <span className="select-none">{node.name}</span>
                </div>

                {node.type === 'directory' && isExpanded && node.children && (
                    <div className="directory-children">
                        {node.children.map(child => renderNode(child, fullPath))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">GitHub Repository Visualizer</h1>
                <p className="text-gray-600">Enter a GitHub repository URL to visualize its structure</p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="https://github.com/username/repository"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="animate-spin" size={16} />
                                <span>Loading...</span>
                            </>
                        ) : (
                            <>
                                <Github size={16} />
                                <span>Visualize</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {error && (
                <div className="max-w-2xl mx-auto p-4 bg-red-50 text-red-600 rounded-lg">
                    {error}
                </div>
            )}

            {repoData && (
                <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                    <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Github size={16} className="text-gray-700" />
                            <span className="font-medium">{repoData.repo_info.name}</span>
                            <span className="text-sm text-gray-500">
                ({repoData.repo_info.stars} ⭐ • {repoData.repo_info.forks} 🍴)
              </span>
                        </div>
                        <button
                            className="flex items-center px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            onClick={handleCopyStructure}
                        >
                            {copied ? (
                                <>
                                    <Check size={14} className="mr-1" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={14} className="mr-1" />
                                    <span>Copy Structure</span>
                                </>
                            )}
                        </button>
                    </div>
                    <div className="p-4">
                        <div className="text-sm font-mono">
                            {repoData.structure.map(node => renderNode(node, ''))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GithubVisualizer;