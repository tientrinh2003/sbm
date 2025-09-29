import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="container py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
