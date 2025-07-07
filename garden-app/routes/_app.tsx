import { type PageProps } from "$fresh/server.ts";
export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <title>La Tournée des Jardins</title>
        <meta
          name="description"
          content="Découvrez les plus beaux jardins entre amis avec La Tournée des Jardins"
        />
        <meta name="theme-color" content="#15803d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tournée Jardins" />

        {/* Preload critical resources */}
        <link rel="preload" href="/styles.css" as="style" />
        <link rel="preconnect" href="https://api.openweathermap.org" />

        {/* Mobile optimization */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Favicon and icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />

        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="overflow-x-hidden">
        <Component />
      </body>
    </html>
  );
}
