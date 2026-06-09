import { PublicHeader } from "@/components/PublicHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main id="main" className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-8">
        {children}
      </main>
    </>
  );
}
