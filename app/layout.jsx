import './globals.css';

export const metadata = {
  title: 'เฝ้าระวังน้ำไทย | แผนที่ระดับน้ำ ฝน ถนน และน้ำทะเล',
  description: 'แผนที่และข้อมูลสถานีตรวจวัดน้ำจากแหล่งสาธารณะ พร้อมเวลาและสถานะต้นทาง',
  keywords: 'ระดับน้ำ, น้ำท่วม, คลอง, สถานีสูบน้ำ, น้ำทะเลหนุน, CCTV, สสน, กรมชลประทาน, แผนที่น้ำ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌊</text></svg>" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
