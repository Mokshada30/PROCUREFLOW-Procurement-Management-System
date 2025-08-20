import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
/*
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg z-50
                 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-100
                 hover:bg-gray-300 dark:hover:bg-gray-700"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0112 18c-2.685 0-5.223-.741-7.468-2.002C3.178 13.567 2.122 10.74 2.122 7.5c0-1.761.558-3.41 1.503-4.757.426-.593 1.157-.961 1.936-.961h13.076c.779 0 1.51.368 1.936.961.945 1.347 1.503 2.996 1.503 4.757 0 3.24-1.056 6.067-3.001 8.502zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 21v-2.25m-6.364-.386l1.591-1.591M3 12H5.25m-.386-6.364l1.591 1.591M12 12a9 9 0 110 18 9 9 0 010-18z" />
        </svg>
      )}
    </button>
  );
}
*/
