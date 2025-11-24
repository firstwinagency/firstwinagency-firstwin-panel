'use client';

type Props = { url: string; alt?: string; width?: number; height?: number };

export default function AnyImage({ url, alt = '', width, height }: Props) {
  const proxied = `/api/img?url=${encodeURIComponent(url)}`;
  return <img src={proxied} alt={alt} width={width} height={height} crossOrigin="anonymous" />;
}
