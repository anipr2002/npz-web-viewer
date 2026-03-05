/**
 * NPY binary format parser.
 * Spec: https://numpy.org/doc/stable/reference/generated/numpy.lib.format.html
 */

const MAGIC = [0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59]; // \x93NUMPY

interface NpyResult {
  shape: number[];
  ndim: number;
  dtype: string;
  data: any[];
}

type TypedArrayConstructor =
  | Float32ArrayConstructor
  | Float64ArrayConstructor
  | Int8ArrayConstructor
  | Int16ArrayConstructor
  | Int32ArrayConstructor
  | Uint8ArrayConstructor
  | Uint16ArrayConstructor
  | Uint32ArrayConstructor;

interface DtypeInfo {
  constructor: TypedArrayConstructor;
  bytes: number;
}

interface BigDtypeInfo {
  bigConstructor: BigInt64ArrayConstructor | BigUint64ArrayConstructor;
  bytes: 8;
}

const DTYPE_MAP: Record<string, DtypeInfo> = {
  '|b1': { constructor: Uint8Array, bytes: 1 },
  '|u1': { constructor: Uint8Array, bytes: 1 },
  '|i1': { constructor: Int8Array, bytes: 1 },
  '<u2': { constructor: Uint16Array, bytes: 2 },
  '>u2': { constructor: Uint16Array, bytes: 2 },
  '<i2': { constructor: Int16Array, bytes: 2 },
  '>i2': { constructor: Int16Array, bytes: 2 },
  '<u4': { constructor: Uint32Array, bytes: 4 },
  '>u4': { constructor: Uint32Array, bytes: 4 },
  '<i4': { constructor: Int32Array, bytes: 4 },
  '>i4': { constructor: Int32Array, bytes: 4 },
  '<f4': { constructor: Float32Array, bytes: 4 },
  '>f4': { constructor: Float32Array, bytes: 4 },
  '<f8': { constructor: Float64Array, bytes: 8 },
  '>f8': { constructor: Float64Array, bytes: 8 },
};

const BIG_DTYPE_MAP: Record<string, BigDtypeInfo> = {
  '<i8': { bigConstructor: BigInt64Array, bytes: 8 },
  '>i8': { bigConstructor: BigInt64Array, bytes: 8 },
  '<u8': { bigConstructor: BigUint64Array, bytes: 8 },
  '>u8': { bigConstructor: BigUint64Array, bytes: 8 },
};

function parseHeader(buffer: ArrayBuffer): {
  descr: string;
  fortranOrder: boolean;
  shape: number[];
  dataOffset: number;
} {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Verify magic bytes
  for (let i = 0; i < MAGIC.length; i++) {
    if (bytes[i] !== MAGIC[i]) {
      throw new Error('Not a valid NPY file');
    }
  }

  const majorVersion = bytes[6];
  let headerLength: number;
  let dataOffset: number;

  if (majorVersion === 1) {
    headerLength = view.getUint16(8, true); // little-endian
    dataOffset = 10 + headerLength;
  } else if (majorVersion === 2) {
    headerLength = view.getUint32(8, true);
    dataOffset = 12 + headerLength;
  } else {
    throw new Error(`Unsupported NPY version: ${majorVersion}`);
  }

  const headerStr = new TextDecoder().decode(
    bytes.slice(majorVersion === 1 ? 10 : 12, dataOffset)
  );

  // Parse Python dict header with regex
  const descrMatch = headerStr.match(/'descr'\s*:\s*'([^']+)'/);
  const fortranMatch = headerStr.match(/'fortran_order'\s*:\s*(True|False)/);
  const shapeMatch = headerStr.match(/'shape'\s*:\s*\(([^)]*)\)/);

  if (!descrMatch || !shapeMatch) {
    throw new Error('Failed to parse NPY header');
  }

  const descr = descrMatch[1];
  const fortranOrder = fortranMatch ? fortranMatch[1] === 'True' : false;
  const shapeStr = shapeMatch[1].trim();
  const shape = shapeStr
    ? shapeStr
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map(Number)
    : [];

  return { descr, fortranOrder, shape, dataOffset };
}

function swapBytes(buf: ArrayBuffer, bytesPerElement: number): void {
  const uint8 = new Uint8Array(buf);
  for (let i = 0; i < uint8.length; i += bytesPerElement) {
    for (let j = 0; j < bytesPerElement / 2; j++) {
      const tmp = uint8[i + j];
      uint8[i + j] = uint8[i + bytesPerElement - 1 - j];
      uint8[i + bytesPerElement - 1 - j] = tmp;
    }
  }
}

function reshape(flat: number[], shape: number[]): any {
  if (shape.length === 0) return flat[0];
  if (shape.length === 1) return flat;

  const result: any[] = [];
  const stride = flat.length / shape[0];
  for (let i = 0; i < shape[0]; i++) {
    result.push(reshape(flat.slice(i * stride, (i + 1) * stride), shape.slice(1)));
  }
  return result;
}

export function parseNpy(buffer: ArrayBuffer): NpyResult {
  const { descr, fortranOrder, shape, dataOffset } = parseHeader(buffer);

  if (fortranOrder) {
    throw new Error('Fortran-order arrays are not supported');
  }

  const totalElements = shape.length === 0 ? 1 : shape.reduce((a, b) => a * b, 1);
  const isBigEndian = descr.startsWith('>');

  // Handle 64-bit integer dtypes via BigInt typed arrays
  const bigDtypeInfo = BIG_DTYPE_MAP[descr];
  if (bigDtypeInfo) {
    const dataBytes = buffer.slice(dataOffset, dataOffset + totalElements * 8);
    if (isBigEndian) swapBytes(dataBytes, 8);
    const typedArray = new bigDtypeInfo.bigConstructor(dataBytes);
    // Convert BigInt to Number (precision loss only beyond ±2^53, acceptable for ML data)
    const flat = Array.from(typedArray, (v) => Number(v));
    return { shape, ndim: shape.length, dtype: descr, data: reshape(flat, shape) };
  }

  // Handle boolean dtype
  const lookupKey = descr === '|b1' ? '|b1' : descr;
  const dtypeInfo = DTYPE_MAP[lookupKey];
  if (!dtypeInfo) {
    throw new Error(`Unsupported dtype: ${descr}`);
  }

  const dataBytes = buffer.slice(dataOffset, dataOffset + totalElements * dtypeInfo.bytes);

  if (isBigEndian && dtypeInfo.bytes > 1) {
    swapBytes(dataBytes, dtypeInfo.bytes);
  }

  const typedArray = new dtypeInfo.constructor(dataBytes);
  const flat = Array.from(typedArray);

  return {
    shape,
    ndim: shape.length,
    dtype: descr,
    data: reshape(flat, shape),
  };
}
