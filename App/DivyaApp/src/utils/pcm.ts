import { Buffer } from 'buffer';

const clampInt16 = (value: number) =>
  Math.max(-32768, Math.min(32767, value));

export const scalePcm16Base64 = (base64: string, gain: number) => {
  if (!base64 || gain === 1) return base64;
  const buf = Buffer.from(base64, 'base64');
  for (let i = 0; i + 1 < buf.length; i += 2) {
    const sample = buf.readInt16LE(i);
    const scaled = clampInt16(Math.round(sample * gain));
    buf.writeInt16LE(scaled, i);
  }
  return buf.toString('base64');
};
