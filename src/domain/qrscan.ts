import jsQR from 'jsqr';

// Single decode pipeline shared by the camera scanner and unit tests.
export function decodeQrFromImageData(data: Uint8ClampedArray, width: number, height: number): string | null {
  try {
    const result = jsQR(data, width, height, { inversionAttempts: 'dontInvert' });
    return result ? result.data : null;
  } catch { return null; }
}
