export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
