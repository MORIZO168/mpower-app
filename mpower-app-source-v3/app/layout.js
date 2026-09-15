import "./globals.css";
import AppFrame from "@/components/AppFrame";

export const metadata = {
  title: "M Power — ระบบบริหารงานติดตั้งโซลาร์",
  description: "ระบบบริหารงานติดตั้งโซลาร์ครบวงจร ของ M Power",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
