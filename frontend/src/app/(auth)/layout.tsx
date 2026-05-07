export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B3A2D] to-[#2D6A4F]">
      {children}
    </div>
  );
}
