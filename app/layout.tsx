import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import ClientBody from "@/components/ClientBody";

export const metadata: Metadata = {
  title: "VIBED - Minimalist Task Management",
  description: "Simple, beautiful task management that sparks joy",
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ClientBody className="antialiased">
          <ClerkProvider
            dynamic
            appearance={{
              variables: {
                colorPrimary: "#FF5A5F",
                colorBackground: "#FFFCF9",
                colorInputBackground: "#F8F4F0",
                colorInputText: "#0F0F14",
                colorText: "#0F0F14",
                colorTextSecondary: "#6B6B70",
                colorNeutral: "#E8E4DF",
                colorDanger: "#EF4444",
                colorSuccess: "#10D0BF",
                colorWarning: "#FBBF24",
                borderRadius: "0.75rem",
              },
              elements: {
                card: "glass",
                headerTitle: "text-foreground font-bold",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton: "border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all",
                formButtonPrimary: "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all",
                formFieldInput: "bg-input border border-border text-foreground rounded-xl focus:border-primary transition-colors",
                footerActionLink: "text-primary hover:text-primary/80 transition-colors",
              }
            }}
          >
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </ClerkProvider>
        </ClientBody>
      </body>
    </html>
  );
}
