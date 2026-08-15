import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "کافه‌چی — پلتفرم دیجیتال کافه‌ها",
    template: "%s | کافه‌چی",
  },
  description:
    "کافه‌چی؛ اکوسیستم هوشمند منوی دیجیتال، سیستم KDS باریستا و مارکت‌پلیس کشف کافه‌های تخصصی",
  keywords: ["کافه", "منوی دیجیتال", "KDS", "قهوه تخصصی", "رزرو کافه"],
  openGraph: {
    title: "کافه‌چی",
    description: "پلتفرم هوشمند مدیریت کافه و کشف قهوه تخصصی",
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;200;300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
