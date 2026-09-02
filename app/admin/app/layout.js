import "./globals.css";

export const metadata = {
  title: "TastyGo Admin",
  description: "Restaurant, menu, order and coupon management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
