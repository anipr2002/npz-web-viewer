import JSZip from 'jszip';
import { parseNpy } from './npy-parser';

interface ArrayData {
  size: number[];
  ndim: number;
  data: any[];
}

type ParsedFiles = Record<string, Record<string, ArrayData>>;

const MAX_ROWS = 200;
const MAX_COLS = 200;
const MAX_FILE_SIZE_MB = 50;

function validateShape(shape: number[], fileName: string): void {
  if (shape.length >= 2 && (shape[0] > MAX_ROWS || shape[1] > MAX_COLS)) {
    throw new Error(
      `Array in "${fileName}" exceeds the ${MAX_ROWS}x${MAX_COLS} limit (got ${shape[0]}x${shape[1]})`
    );
  }
}

export async function parseNpzFile(
  file: File
): Promise<Record<string, ArrayData>> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const result: Record<string, ArrayData> = {};

  for (const [name, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir || !name.endsWith('.npy')) continue;

    const npyBuffer = await zipEntry.async('arraybuffer');
    const parsed = parseNpy(npyBuffer);
    const arrayName = name.replace(/\.npy$/, '');

    validateShape(parsed.shape, `${file.name}/${arrayName}`);

    result[arrayName] = {
      size: parsed.shape,
      ndim: parsed.ndim,
      data: parsed.data,
    };
  }

  return result;
}

export async function parseNpyFile(
  file: File
): Promise<Record<string, ArrayData>> {
  const arrayBuffer = await file.arrayBuffer();
  const parsed = parseNpy(arrayBuffer);

  validateShape(parsed.shape, file.name);

  return {
    array: {
      size: parsed.shape,
      ndim: parsed.ndim,
      data: parsed.data,
    },
  };
}

export async function parseFiles(files: File[]): Promise<ParsedFiles> {
  const result: ParsedFiles = {};

  for (const file of files) {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      throw new Error(`File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit (${fileSizeMB.toFixed(1)} MB)`);
    }

    const ext = file.name.toLowerCase().split('.').pop();

    if (ext === 'npz') {
      result[file.name] = await parseNpzFile(file);
    } else if (ext === 'npy') {
      result[file.name] = await parseNpyFile(file);
    } else {
      throw new Error(`Unsupported file type: ${file.name}`);
    }
  }

  return result;
}
