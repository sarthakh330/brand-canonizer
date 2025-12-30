/**
 * CopyButton Component
 * One-click copy to clipboard with success feedback
 */

import { useState } from 'react';

export default function CopyButton({ text, label = "Copy Code" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
        copied
          ? 'bg-green-500 text-white'
          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
      }`}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  );
}
