import JSZip from 'jszip';
import { Workspace, Document } from '../types';

export async function exportWorkspaceAsZip(workspace: Workspace, documents: Document[]): Promise<void> {
  const zip = new JSZip();

  // Root README for the export package
  const readmeContent = [
    `# ${workspace.name}`,
    `>${workspace.description || 'Exported from SyncCode Real-Time Developer Collaboration Platform'}`,
    '',
    `Export Date: ${new Date().toLocaleString()}`,
    `Total Files: ${documents.length}`,
    '',
    '## File Manifest',
    ...documents.map((d) => `- [${d.type === 'code' ? 'CODE' : 'NOTE'}] ${d.name}`),
    '',
    '---',
    'Generated with SyncCode — Build together. In real time.',
  ].join('\n');

  zip.file('README.md', readmeContent);

  const srcFolder = zip.folder('src');
  const docsFolder = zip.folder('docs');

  documents.forEach((doc) => {
    if (doc.type === 'note') {
      docsFolder?.file(doc.name, doc.content || '');
    } else {
      srcFolder?.file(doc.name, doc.content || '');
    }
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const safeName = (workspace.name || 'synccode-workspace')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');

  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}-export.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
