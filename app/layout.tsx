import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { createClient } from '@/utils/supabase/server'
import ChatWidget from '@/components/chat/ChatWidget'

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "NexusDesk | Intelligent Support Management",
  description: "Enterprise-grade customer support and ticket management system",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()

  // Get default chat channel
  const { data: chatChannel } = await supabase
    .from('channels')
    .select('id')
    .eq('type', 'chat')
    .eq('is_active', true)
    .limit(1)
    .single()

  return (
    <html lang="en" className={geist.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen">
            {children}
            {chatChannel && <ChatWidget channelId={chatChannel.id} />}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
