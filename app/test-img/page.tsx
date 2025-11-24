'use client';
import { useState } from 'react';
import AnyImage from '../components/AnyImage';

export default function Page() {
  const [url, setUrl] = useState('');
  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>Test imagen universal</h1>
      <input
        style={{ width: '100%', padding: 8 }}
        placeholder="Pega la URL de una imagen"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <div style={{ marginTop: 16 }}>
        {url ? <AnyImage url={url} alt="preview" /> : <p>Pega una URL para ver la vista previa.</p>}
      </div>
    </div>
  );
}
