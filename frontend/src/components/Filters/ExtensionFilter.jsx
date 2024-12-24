import React, { useState, useEffect } from 'react';

const ExtensionFilter = ({ repoData, onExtensionsChange }) => {
    const [availableExtensions, setAvailableExtensions] = useState([]);
    const [selectedExtensions, setSelectedExtensions] = useState([]);

    // Extract unique extensions from repo data when component mounts
    useEffect(() => {
        if (repoData?.structure) {
            const extensions = new Set();
            const extractExtensions = (nodes) => {
                nodes.forEach(node => {
                    if (node.type === 'file') {
                        const extension = node.name.split('.').pop();
                        if (extension && extension !== node.name) {
                            extensions.add(extension);
                        }
                    }
                    if (node.children) {
                        extractExtensions(node.children);
                    }
                });
            };

            extractExtensions(repoData.structure);
            setAvailableExtensions(Array.from(extensions).sort());
        }
    }, [repoData]);

    // Handle selection changes
    const handleSelectionChange = (e) => {
        const newSelection = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedExtensions(newSelection);
        onExtensionsChange(newSelection);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-600">
                Extensions
            </label>
            <select
                multiple
                className="w-full h-24 rounded-md border border-slate-200 text-sm"
                value={selectedExtensions}
                onChange={handleSelectionChange}
            >
                {availableExtensions.map(ext => (
                    <option key={ext} value={ext}>.{ext}</option>
                ))}
            </select>
        </div>
    );
};

export default ExtensionFilter;