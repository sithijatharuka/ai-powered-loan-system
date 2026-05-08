export default function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}