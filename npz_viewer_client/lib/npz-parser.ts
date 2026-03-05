import JSZip from 'jszip';
import { parseNpy } from './npy-parser';

interface ArrayData {
  size: number[];
  ndim: number;
  dtype: string;
  data: any[];
}

type ParsedFiles = Record<string, Record<string, ArrayData>>;

export interface ParseLimits {
  maxRows: number;
  maxCols: number;
  maxFileSizeMB: number;
}

export const FREE_LIMITS: ParseLimits = {
  maxRows: 50,
  maxCols: 50,
  maxFileSizeMB: 50,
};

export const PREMIUM_LIMITS: ParseLimits = {
  maxRows: 1000,
  maxCols: 1000,
  maxFileSizeMB: 200,
};

/** Threshold (total cells) above which we show a performance warning */
export const LARGE_DATASET_THRESHOLD = 100_000;

function validateShape(shape: number[], fileName: string, limits: ParseLimits): void {
  if (shape.length >= 2 && (shape[0] > limits.maxRows || shape[1] > limits.maxCols)) {
    throw new Error(
      `Array in "${fileName}" exceeds the ${limits.maxRows}x${limits.maxCols} limit (got ${shape[0]}x${shape[1]})`
    );
  }
}

export async function parseNpzFile(
  file: File,
  limits: ParseLimits = FREE_LIMITS
): Promise<Record<string, ArrayData>> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const result: Record<string, ArrayData> = {};

  for (const [name, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir || !name.endsWith('.npy')) continue;

    const npyBuffer = await zipEntry.async('arraybuffer');
    const parsed = parseNpy(npyBuffer);
    const arrayName = name.replace(/\.npy$/, '');

    validateShape(parsed.shape, `${file.name}/${arrayName}`, limits);

    result[arrayName] = {
      size: parsed.shape,
      ndim: parsed.ndim,
      dtype: parsed.dtype,
      data: parsed.data,
    };
  }

  return result;
}

export async function parseNpyFile(
  file: File,
  limits: ParseLimits = FREE_LIMITS
): Promise<Record<string, ArrayData>> {
  const arrayBuffer = await file.arrayBuffer();
  const parsed = parseNpy(arrayBuffer);

  validateShape(parsed.shape, file.name, limits);

  return {
    array: {
      size: parsed.shape,
      ndim: parsed.ndim,
      dtype: parsed.dtype,
      data: parsed.data,
    },
  };
}

export async function parseFiles(
  files: File[],
  limits: ParseLimits = FREE_LIMITS
): Promise<ParsedFiles> {
  const result: ParsedFiles = {};

  for (const file of files) {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > limits.maxFileSizeMB) {
      throw new Error(`File "${file.name}" exceeds the ${limits.maxFileSizeMB}MB limit (${fileSizeMB.toFixed(1)} MB)`);
    }

    const ext = file.name.toLowerCase().split('.').pop();

    if (ext === 'npz') {
      result[file.name] = await parseNpzFile(file, limits);
    } else if (ext === 'npy') {
      result[file.name] = await parseNpyFile(file, limits);
    } else {
      throw new Error(`Unsupported file type: ${file.name}`);
    }
  }

  return result;
}
