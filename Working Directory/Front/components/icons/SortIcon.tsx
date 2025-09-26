import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export const SortIcon: React.FC<{ direction: 'asc' | 'desc' | null }> = ({ direction }) => {
    const color = direction ? 'text-gray-800' : 'text-gray-400';
    const props = { className: `w-3 h-3 ${color} transition-colors`, "aria-hidden": "true" };
    
    if (direction === 'asc') {
        return <ArrowUp {...props} />;
    }
    if (direction === 'desc') {
        return <ArrowDown {...props} />;
    }
    return <ArrowUpDown {...props} />;
};