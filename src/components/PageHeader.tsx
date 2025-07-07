interface PageHeaderProps {
  title: string;
  subtitle?: string;
  centerText?: boolean;
}

export default function PageHeader(
  { title, subtitle, centerText = true }: PageHeaderProps,
) {
  return (
    <header class={`mb-8 ${centerText ? "text-center" : ""}`}>
      <h1 class="text-3xl md:text-4xl font-bold text-green-800 mb-2">
        {title}
      </h1>
      {subtitle && (
        <p class="text-green-600 text-lg">
          {subtitle}
        </p>
      )}
    </header>
  );
}
