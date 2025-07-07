interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  priority?: boolean;
  sizes?: string;
}

export default function ResponsiveImage({
  src,
  alt,
  className = "",
  width,
  height,
  loading = "lazy",
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: ResponsiveImageProps) {
  // Generate responsive sizes for common breakpoints
  const generateSrcSet = (baseSrc: string) => {
    // For now, we'll just use the original image
    // In a real app, you'd generate multiple sizes server-side
    return [
      `${baseSrc} 1x`,
      `${baseSrc} 2x`, // Retina display support
    ].join(", ");
  };

  const imageProps = {
    src,
    alt,
    className: `${className} ${priority ? "" : "lazy"}`,
    loading: priority ? "eager" : loading,
    decoding: "async" as const,
    ...(width && { width }),
    ...(height && { height }),
    srcSet: generateSrcSet(src),
    sizes,
  };

  return (
    <img
      {...imageProps}
      style={{
        maxWidth: "100%",
        height: "auto",
        aspectRatio: width && height ? `${width} / ${height}` : undefined,
      }}
      onError={(e) => {
        // Fallback for broken images
        const target = e.target as HTMLImageElement;
        target.src = "/logo.svg";
        target.alt = "Image non disponible";
      }}
    />
  );
}
