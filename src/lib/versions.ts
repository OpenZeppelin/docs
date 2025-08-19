export interface LibraryVersion {
  value: string;
  label: string;
}

export const libraryVersions: Record<string, LibraryVersion[]> = {
  contracts: [
    { value: 'v5.x', label: '5.x' },
    { value: 'v4.x', label: '4.x' }
  ],
  'contracts-upgradeable': [
    { value: 'v5.x', label: '5.x' }
  ],
  'cairo-contracts': [
    { value: 'v2.x', label: '2.x' }
  ],
  'community-contracts': [
    { value: 'v1.x', label: '1.x' }
  ],
  'compact-contracts': [
    { value: 'v0.x', label: '0.x' }
  ],
  'confidential-contracts': [
    { value: 'v0.x', label: '0.x' }
  ],
  'contracts-stylus': [
    { value: 'v0.x', label: '0.x' }
  ],
  'stellar-contracts': [
    { value: 'v0.x', label: '0.x' }
  ],
  'substrate-runtimes': [
    { value: 'v3.x', label: '3.x' }
  ],
  'uniswap-hooks': [
    { value: 'v1.x', label: '1.x' }
  ],
  'upgrade-plugins': [],
  'nile': [
    { value: 'v0.x', label: '0.x' }
  ],
  'tools': []
};

export function getVersionsForLibrary(libraryName: string): LibraryVersion[] {
  return libraryVersions[libraryName] || [];
}

export function getCurrentVersionFromPath(pathname: string): { library: string; version: string } | null {
  const pathSegments = pathname.split('/').filter(Boolean);
  
  if (pathSegments.length >= 2) {
    const library = pathSegments[0];
    const version = pathSegments[1];
    
    if (libraryVersions[library]?.some(v => v.value === version)) {
      return { library, version };
    }
  }
  
  return null;
}