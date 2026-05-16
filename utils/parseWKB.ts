export function parseWKBPoint(hex: string): { lat: number; lng: number } | null {
  if (!hex || typeof hex !== 'string' || hex.length < 50) return null;
  try {
    const isLE = hex.slice(0, 2) === '01';
    const typeVal = isLE
      ? parseInt(hex.slice(2, 10).match(/../g)!.reverse().join(''), 16)
      : parseInt(hex.slice(2, 10), 16);
    const hasSRID = (typeVal & 0x20000000) !== 0;
    const off = (1 + 4 + (hasSRID ? 4 : 0)) * 2;
    const lngHex = hex.slice(off, off + 16);
    const latHex = hex.slice(off + 16, off + 32);
    function toDouble(h: string): number {
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);
      for (let i = 0; i < 8; i++) view.setUint8(i, parseInt(h.slice(i * 2, i * 2 + 2), 16));
      return view.getFloat64(0, isLE);
    }
    return { lng: toDouble(lngHex), lat: toDouble(latHex) };
  } catch { return null; }
}
