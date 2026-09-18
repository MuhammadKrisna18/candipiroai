import React from "react";
import { UserSession } from "@/lib/types";
import { QuotaData } from "@/hooks/use-quota";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Sparkles, LogOut, LogIn, User, Zap, PanelLeftClose, PanelRightClose } from "lucide-react";
import { ChatHistory } from "./chat-history";
import { ChatSession } from "@/lib/types";

interface ChatHeaderProps {
  user: UserSession;
  quota: QuotaData | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  isDesktopSidebarOpen: boolean;
  setIsDesktopSidebarOpen: (v: boolean) => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  setCurrentSessionId: (id: string) => void;
  handleNewChat: () => void;
  handleDeleteSession: (id: string) => void;
  handleTogglePin: (id: string) => void;
  setEditedName: (name: string) => void;
  setIsEditingName: (v: boolean) => void;
  handleLogout: () => void;
  handleLogin: () => void;
}

export function ChatHeader({
  user,
  quota,
  isSidebarOpen,
  setIsSidebarOpen,
  isDesktopSidebarOpen,
  setIsDesktopSidebarOpen,
  sessions,
  currentSessionId,
  setCurrentSessionId,
  handleNewChat,
  handleDeleteSession,
  handleTogglePin,
  setEditedName,
  setIsEditingName,
  handleLogout,
  handleLogin
}: ChatHeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 glass-nav sticky top-0 z-10 transition-all">
      <div className="flex items-center gap-3">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <ChatHistory
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSelectSession={(id) => {
                setCurrentSessionId(id);
                setIsSidebarOpen(false);
              }}
              onNewChat={() => {
                handleNewChat();
                setIsSidebarOpen(false);
              }}
              onDeleteSession={handleDeleteSession}
              onTogglePin={handleTogglePin}
            />
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="hidden md:flex text-muted-foreground hover:text-foreground"
          onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          title={isDesktopSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          {isDesktopSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelRightClose className="w-5 h-5" />}
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-primary/20 border border-primary/20">
            <img src="/logo.jpg" alt="Candipuro AI Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-headline font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Candipuro AI
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {quota && (
          <div 
            className="hidden sm:flex flex-col cursor-help group mr-2"
            title={`Sisa Kuota: ${(quota.max - quota.used).toLocaleString('id-ID')} / ${quota.max.toLocaleString('id-ID')} Tokens\nReset pada: ${new Date(quota.resetTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
          >
            <div className="flex items-center justify-between mb-1.5 px-0.5 w-32">
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />
                <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">Energi</span>
              </div>
              <span className="text-[11px] font-bold text-primary">{Math.round(quota.percentage)}%</span>
            </div>
            <div className="h-1.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full ${quota.percentage < 20 ? 'bg-destructive' : 'bg-gradient-to-r from-yellow-400 to-amber-500'}`}
                style={{ width: `${quota.percentage}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {user.isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p
                  className="text-xs font-semibold cursor-pointer hover:underline"
                  onClick={() => {
                    setEditedName(user.user?.name || "");
                    setIsEditingName(true);
                  }}
                  title="Klik untuk mengubah nama"
                >
                  {user.user?.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {user.user?.email}
                </p>
              </div>
              <Avatar className="w-8 h-8 border">
                <AvatarImage src={user.user?.avatar} />
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Keluar"
              >
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleLogin} className="flex gap-2">
              <LogIn className="w-4 h-4" />
              Masuk
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
