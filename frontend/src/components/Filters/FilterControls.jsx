import React, { useState } from 'react';
import ExtensionFilter from './ExtensionFilter';
import IgnorePatternToggle from './IgnorePatternToggle';

const FilterControls = ({ repoData, onFiltersChange }) => {
    const [selectedExtensions, setSelectedExtensions] = useState([]);
    const [ignorePatterns, setIgnorePatterns] = useState({
        'node_modules/': true,
        '.git/': true,
        'build/': true,
        'dist/': true,
        '.vscode/': true,
        '.idea/': true
    });

    const handleExtensionsChange = (extensions) => {
        setSelectedExtensions(extensions);
        onFiltersChange({
            extensions,
            ignorePatterns
        });
    };

    const handlePatternsChange = (patterns) => {
        setIgnorePatterns(patterns);
        onFiltersChange({
            extensions: selectedExtensions,
            ignorePatterns: patterns
        });
    };

    const handleClearAll = () => {
        setSelectedExtensions([]);
        setIgnorePatterns({
            'node_modules/': true,
            '.git/': true,
            'build/': true,
            'dist/': true,
            '.vscode/': true,
            '.idea/': true
        });
        onFiltersChange({
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
    };

    return (
        <div className="p-4 border-b border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">Filter Files</h3>
                <button
                    onClick={handleClearAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                >
                    Clear All
                </button>
            </div>

            <ExtensionFilter
                repoData={repoData}
                onExtensionsChange={handleExtensionsChange}
            />

            <IgnorePatternToggle
                patterns={ignorePatterns}
                onPatternsChange={handlePatternsChange}
            />
        </div>
    );
};

export default FilterControls;