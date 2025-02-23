import type { Metadata } from "next";
import "./globals.css";
import { Afacad } from "next/font/google";

const afacad = Afacad({
    subsets: ["latin"],
    variable: "--font-afacad",
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "IOT Apps",
    description: "Everything is connected",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${afacad.variable} antialiased`}>{children}</body>
        </html>
    );
}
