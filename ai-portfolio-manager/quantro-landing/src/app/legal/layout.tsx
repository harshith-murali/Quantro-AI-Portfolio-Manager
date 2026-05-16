import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#060606]">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
