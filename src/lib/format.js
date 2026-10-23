import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const money = (v) => {
  const n = Number(v) || 0;
  return `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const signed = (v) => {
  const n = Number(v) || 0;
  return `${n > 0 ? '+' : ''}${money(n)}`;
};

export const pf = (v) => (v === Infinity ? '∞' : Number(v || 0).toFixed(2));

// Saves a text file: shares it from the phone, downloads it in a browser.
export async function saveText(filename, text, mime = 'text/plain') {
  if (Capacitor.isNativePlatform()) {
    const res = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: filename, url: res.uri, dialogTitle: 'Save or send file' });
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
