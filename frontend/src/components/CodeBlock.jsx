/**
 * CodeBlock Component
 * Displays code with syntax highlighting and copy button
 */

import CopyButton from './CopyButton';

export default function CodeBlock({ code, language = 'html', title }) {
  return (
    <div className="mt-4">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {title}
          </h5>
          <CopyButton text={code} />
        </div>
      )}
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}
