import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "YUGMA AI", description: "Where two journeys meet — private AI-assisted compatibility and interpretive readings."
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
