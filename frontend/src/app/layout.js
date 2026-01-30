import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Qurator",
  description: "Content curation platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Layout>
            {children}
          </Layout>
          <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
      </body>
    </html>
  );
}
