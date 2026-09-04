import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import SplashScreen from "@/components/SplashScreen";
import { AuthProvider } from "../app/Auth.context";

export const metadata: Metadata = {
  title: "TastyGo | Food Delivery",
  description: "Order food from your favorite restaurants near you.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 text-gray-900">
        <AuthProvider>
          <CartProvider>
            <SplashScreen />

            <main className="min-h-screen pb-20">
              {children}
            </main>

            <Navbar />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}