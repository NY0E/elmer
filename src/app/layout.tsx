import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elmer — Practical Ham Radio Tutor",
  description: "A Socratic tutor for newly licensed amateur radio operators. You passed the exam. Now learn to actually operate.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
