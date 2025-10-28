export const metadata = {
  title: "Aztec Contributors",
  description: "Town Hall awards & people directory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
