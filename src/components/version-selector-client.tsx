'use client';

import { usePathname } from 'next/navigation';
import { VersionSelector } from './version-selector';
import { getVersionsForLibrary, getCurrentVersionFromPath } from '@/lib/versions';

export function VersionSelectorClient() {
  const pathname = usePathname();
  const currentVersionInfo = getCurrentVersionFromPath(pathname);
  const versions = currentVersionInfo ? getVersionsForLibrary(currentVersionInfo.library) : [];

  if (!currentVersionInfo || versions.length <= 1) {
    return null;
  }

  return (
    <VersionSelector 
      versions={versions} 
      currentVersion={currentVersionInfo.version}
    />
  );
}