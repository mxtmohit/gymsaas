import "./globals.css";

export const metadata = {
  title: "FlexFlow | Neo-Brutalist Gym Membership SaaS",
  description:
    "A bold, minimalist platform for gym owners to manage memberships, generate QR registration codes, verify UPI payments, and track platform metrics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col antialiased bg-[#f4f2ed] text-black">
        {children}
      </body>
    </html>
  );
}
