import { useEffect, useState } from 'react';

export function ClassCodeQr({ text, size = 168, alt = 'Kod QR kelas — tunjukkan kepada guru untuk diimbas' }: { text: string; size?: number; alt?: string }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setUrl(''); setFailed(false);
    // qrcode is code-split: loaded only when a class code is actually shown.
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: size, color: { dark: '#173c38', light: '#ffffff' } }))
      .then(value => { if (active) setUrl(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [text, size]);
  if (failed) return null;
  if (!url) return <span className="class-qr class-qr-loading" style={{ width: size, height: size }} aria-hidden="true"/>;
  return <img className="class-qr" src={url} width={size} height={size} alt={alt}/>;
}
