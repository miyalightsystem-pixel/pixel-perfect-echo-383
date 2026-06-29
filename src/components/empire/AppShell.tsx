import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Home,
  CalendarDays,
  ClipboardList,
  BookOpen,
  Menu,
  Coins,
  Crown,
  Image as ImageIcon,
  MessagesSquare,
  UserCircle2,
  Shield,
  LogOut,
  HelpCircle,
  QrCode,
  FolderOpen,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { motion, AnimatePresence } from "framer-motion";
import { DISCORD_INVITE_URL, TUGAS_DRIVE_URL } from "@/lib/external-links";
import { Crest } from "./Crest";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { startTour } from "@/lib/onboarding-tour";
import { useActiveMember, isAdmin } from "@/lib/active-member";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const primaryNav = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/almanak", label: "Almanak", icon: CalendarDays },
  { to: "/absen", label: "Absen", icon: QrCode },
  { to: "/balai-tugas", label: "Tugas", icon: ClipboardList },
  { to: "/bank-materi", label: "Materi", icon: BookOpen },
] as const;

const secondaryNav = [
  { to: "/perbendaharaan", label: "Perbendaharaan", icon: Coins },
  { to: "/para-bangsawan", label: "Para Bangsawan", icon: Crown },
  { to: "/balai-kenangan", label: "Balai Kenangan", icon: ImageIcon },
  { to: "/forum", label: "Forum", icon: MessagesSquare },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { member, email, signOut } = useActiveMember();
  const [moreOpen, setMoreOpen] = useState(false);
  const admin = isAdmin(member?.role);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Crest size={36} />
            <span className="font-display text-lg tracking-tight leading-none">
              <span className="text-empire">JERUK'S</span> EMPIRE
            </span>
          </Link>

          <nav data-tour="nav" className="ml-auto hidden md:flex items-center gap-1">
            {[...primaryNav, ...secondaryNav].map((item) => {
              const active = pathname === item.to;
              const tourAttr = item.to === "/almanak" ? { "data-tour": "jadwal" } : {};
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  {...tourAttr}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    active ? "bg-empire text-empire-foreground" : "hover:bg-accent/40",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {admin && (
              <Link
                to="/admin"
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                  pathname === "/admin"
                    ? "bg-plum text-white"
                    : "text-plum hover:bg-plum/10",
                )}
              >
                <Shield className="size-3.5" /> Admin
              </Link>
            )}
          </nav>

          <div className="ml-auto md:ml-2 flex items-center gap-2">
            <button
              aria-label="Buka panduan"
              onClick={() => startTour()}
              className="hidden sm:flex items-center justify-center rounded-full border border-border/70 bg-card size-9 hover:bg-accent/30 transition-colors"
            >
              <HelpCircle className="size-4" />
            </button>
            <DarkModeToggle />
            <ThemeSwitcher />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-2 py-1 text-sm hover:bg-accent/30">
                {member?.foto_url ? (
                  <img src={member.foto_url} alt="" className="size-7 rounded-full object-cover bg-cream" />
                ) : (
                  <UserCircle2 className="size-7 text-muted-foreground" />
                )}
                <span className="hidden sm:inline max-w-[110px] truncate">
                  {member?.panggilan || member?.nama?.split(" ")[0] || email?.split("@")[0] || "Bangsawan"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-medium truncate">{member?.nama ?? "Bangsawan"}</div>
                <div className="text-xs text-muted-foreground truncate font-normal">{email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {admin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="flex items-center gap-2">
                    <Shield className="size-4" /> Balai Admin
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="size-4 mr-2" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 md:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="hidden md:block border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © Kerajaan Jeruk · dipersembahkan untuk Bangsawan kelas TI
      </footer>

      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-6">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-empire" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                {item.label}
              </Link>
            );
          })}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground">
                <Menu className="size-5" />
                Lainnya
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="font-display text-empire">Balai Tambahan</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-2 pt-3">
                {secondaryNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 hover:border-empire/60"
                    >
                      <Icon className="size-5 text-empire" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                <a
                  href={TUGAS_DRIVE_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 hover:border-empire/60"
                >
                  <FolderOpen className="size-5 text-empire" />
                  <span className="text-sm font-medium">Drive Tugas</span>
                </a>
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 hover:border-[#5865F2]"
                >
                  <MessagesSquare className="size-5 text-[#5865F2]" />
                  <span className="text-sm font-medium">Discord Kelas</span>
                </a>
                {admin && (
                  <Link
                    to="/admin"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-plum/40 bg-plum/5 p-3 col-span-2"
                  >
                    <Shield className="size-5 text-plum" />
                    <span className="text-sm font-medium text-plum">Balai Admin</span>
                  </Link>
                )}
              </div>
              <div className="pt-4 mt-4 border-t border-border/60">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMoreOpen(false);
                    signOut();
                  }}
                >
                  <LogOut className="size-4 mr-2" /> Keluar dari Kerajaan
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}

function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "cinematic" || theme === "cyber";
  return (
    <button
      aria-label={isDark ? "Mode terang" : "Mode gelap"}
      title={isDark ? "Mode terang" : "Mode gelap"}
      onClick={() => setTheme(isDark ? "empire" : "cinematic")}
      className="flex items-center justify-center rounded-full border border-border/70 bg-card size-9 hover:bg-accent/30 transition-colors"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
