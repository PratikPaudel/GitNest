import React, { useState } from 'react';
import { Download, Copy, Check, Info, Loader, FileText } from 'lucide-react';
import {getApiBaseUrl} from "../config.js";

const TextExport = ({ repoData, url }) => {
    const [copied, setCopied] = useState(false);
    const [exportData, setExportData] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [error, setError] = useState(null);
    const API_BASE_URL = getApiBaseUrl();

    const handleExport = async () => {
        setExportLoading(true);
        setError(null);
        setExportData(null); // Reset export data

        try {
            const response = await fetch(`${API_BASE_URL}/text-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            const responseText = await response.text();
            let data;

            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response:', responseText);
                throw new Error('Invalid response format from server');
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'An error occurred while processing the repository');
            }

            if (!data.metadata || !data.content) {
                throw new Error('Invalid response format: missing required fields');
            }

            setExportData(data);
        } catch (err) {
            console.error('Export error:', err);
            setError(err.message);
        } finally {
            setExportLoading(false);
        }
    };

    const handleCopy = () => {
        if (!exportData?.content) return;
        navigator.clipboard.writeText(exportData.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!exportData?.content || !repoData?.repo_info?.name) return;

        const blob = new Blob([exportData.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${repoData.repo_info.name}-export.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="p-4 space-y-4 bg-white">
            <div className="text-slate-600 mb-4">
                Repository Text Export
            </div>

            {!exportData && !exportLoading && (
                <div className="flex justify-center">
                    <button
                        onClick={handleExport}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <FileText size={18} />
                        <span>Generate Text Export</span>
                    </button>
                </div>
            )}

            {exportLoading && (
                <div className="flex justify-center p-8">
                    <Loader className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {exportData && exportData.metadata && (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex space-x-6">
                                <div>
                                    <span className="text-blue-600 font-medium">Files Processed:</span>
                                    <span className="ml-2">{exportData.metadata.total_files}</span>
                                </div>
                                <div>
                                    <span className="text-blue-600 font-medium">Files Skipped:</span>
                                    <span className="ml-2">{exportData.metadata.skipped_files}</span>
                                </div>
                                <div>
                                    <span className="text-blue-600 font-medium">Total Size:</span>
                                    <span className="ml-2">
                                        {(exportData.metadata.total_size / 1024).toFixed(2)} KB
                                    </span>
                                </div>
                            </div>
                            <div className="space-x-2">
                                <button
                                    onClick={handleCopy}
                                    className="inline-flex items-center px-3 py-1.5 bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={16} className="mr-1.5 text-green-500" />
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} className="mr-1.5" />
                                            <span>Copy All</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    <Download size={16} className="mr-1.5" />
                                    <span>Download</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <Info size={20} className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-sm text-yellow-700">
                                <p className="font-medium">Export Information:</p>
                                <ul className="list-disc ml-4 mt-1">
                                    <li>Files larger than 100KB are automatically excluded</li>
                                    <li>Binary files (images, executables, etc.) are skipped</li>
                                    <li>Certain directories (node_modules, .git, etc.) are excluded</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {exportData.content && (
                        <div className="bg-white rounded-lg shadow border border-slate-200">
                            <pre className="p-4 overflow-x-auto font-mono text-sm whitespace-pre-wrap">
                                {exportData.content}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TextExport;