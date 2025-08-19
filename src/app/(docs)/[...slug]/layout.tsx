import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { getModifiedSource } from '@/lib/source';
import { VersionSelectorClient } from '@/components/version-selector-client';
import { headers } from 'next/headers';

export default async function Layout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  const contextualSource = getModifiedSource(pathname);

  const layoutOptions = {
    ...baseOptions,
    nav: {
      ...baseOptions.nav,
      children: <VersionSelectorClient />,
    },
  };

  return (
    <DocsLayout tree={contextualSource.pageTree} {...layoutOptions}>
      {children}
    </DocsLayout>
  );
}
