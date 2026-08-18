import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "M Power — ระบบบริหารงานติดตั้งโซลาร์",
  description: "ระบบบริหารงานติดตั้งโซลาร์ครบวงจร ของ M Power",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 md:ml-60 min-w-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
