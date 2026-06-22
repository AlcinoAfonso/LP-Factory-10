import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { type AdminDocCatalogItem, getAdminDocById } from '@/lib/admin/docsCatalog';

export type ReadRepoDocResult =
  | {
      status: 'ok';
      doc: AdminDocCatalogItem;
      content: string;
    }
  | {
      status: 'denied';
      requestedId: string;
      message: string;
    }
  | {
      status: 'error';
      doc: AdminDocCatalogItem;
      message: string;
    };

export async function readRepoDoc(docId: string | undefined): Promise<ReadRepoDocResult> {
  const doc = getAdminDocById(docId);

  if (!doc) {
    return {
      status: 'denied',
      requestedId: docId ?? '',
      message: 'Documento nao autorizado para leitura nesta area.',
    };
  }

  const docsRoot = path.join(process.cwd(), 'docs');
  const filePath = path.join(process.cwd(), doc.path);
  const relativePath = path.relative(docsRoot, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return {
      status: 'denied',
      requestedId: docId ?? '',
      message: 'Documento nao autorizado para leitura nesta area.',
    };
  }

  try {
    const content = await readFile(filePath, 'utf8');

    return {
      status: 'ok',
      doc,
      content,
    };
  } catch {
    return {
      status: 'error',
      doc,
      message: 'Nao foi possivel ler este documento agora. Tente outro item da lista.',
    };
  }
}
