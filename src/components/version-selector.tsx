'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface VersionOption {
  value: string;
  label: string;
}

interface VersionSelectorProps {
  versions: VersionOption[];
  currentVersion: string;
}

export function VersionSelector({ versions, currentVersion }: VersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVersionChange = (newVersion: string) => {
    if (newVersion === currentVersion) {
      setIsOpen(false);
      return;
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    
    if (pathSegments.length >= 2) {
      pathSegments[1] = newVersion;
      const newPath = '/' + pathSegments.join('/');
      router.push(newPath);
    }
    
    setIsOpen(false);
  };

  const currentVersionLabel = versions.find(v => v.value === currentVersion)?.label || currentVersion;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{currentVersionLabel}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-600">
          <div className="py-1" role="listbox">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
              Current version
            </div>
            <button
              onClick={() => handleVersionChange(currentVersion)}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              <span className="font-medium">{currentVersionLabel}</span>
            </button>
            
            {versions.filter(v => v.value !== currentVersion).length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
                  Other versions
                </div>
                {versions
                  .filter(v => v.value !== currentVersion)
                  .map((version) => (
                    <button
                      key={version.value}
                      onClick={() => handleVersionChange(version.value)}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <span>{version.label}</span>
                    </button>
                  ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}