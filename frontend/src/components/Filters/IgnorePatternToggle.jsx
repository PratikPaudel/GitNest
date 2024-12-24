import React from 'react';

const DEFAULT_PATTERNS = {
    'node_modules/': true,
    '.git/': true,
    'build/': true,
    'dist/': true,
    '.vscode/': true,
    '.idea/': true
};

const IgnorePatternToggle = ({ patterns = DEFAULT_PATTERNS, onPatternsChange }) => {
    const handleToggle = (pattern) => {
        const newPatterns = {
            ...patterns,
            [pattern]: !patterns[pattern]
        };
        onPatternsChange(newPatterns);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-600">
                Ignore Patterns
            </label>
            <div className="space-y-2">
                {Object.entries(patterns).map(([pattern, enabled]) => (
                    <div key={pattern} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{pattern}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={enabled}
                                onChange={() => handleToggle(pattern)}
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IgnorePatternToggle;