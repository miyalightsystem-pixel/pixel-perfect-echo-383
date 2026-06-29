import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import "../lib/fonts";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ActiveMemberProvider } from "../lib/active-member";
import { ThemeProvider } from "../lib/theme-context";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-empire">404</h1>
        <h2 className="mt-4 font-display text-xl">Titah ini tak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang Anda cari mungkin telah pindah ke balairung lain.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl">Halaman ini gagal dimuat</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ada gangguan di kerajaan. Coba muat ulang atau kembali ke beranda.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Coba lagi
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "JERUK'S EMPIRE — Kerajaan Kelas TI" },
      {
        name: "description",
        content:
          "Balairung digital kelas TI: jadwal, tugas, perbendaharaan, dan titah mingguan untuk para Bangsawan.",
      },
      { name: "author", content: "Jeruk's Empire" },
      { property: "og:title", content: "JERUK'S EMPIRE — Kerajaan Kelas TI" },
      { property: "og:description", content: "Pixel Perfect Screenshot captures and displays precise visual representations of application interfaces." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "JERUK'S EMPIRE — Kerajaan Kelas TI" },
      { name: "description", content: "Pixel Perfect Screenshot captures and displays precise visual representations of application interfaces." },
      { name: "twitter:description", content: "Pixel Perfect Screenshot captures and displays precise visual representations of application interfaces." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a4d39df0-6114-4e6f-a3bb-140f680d8d12/id-preview-62b9cb2a--4baa2115-2846-40bd-b9b2-cc80d3e4fa5d.lovable.app-1781802062376.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a4d39df0-6114-4e6f-a3bb-140f680d8d12/id-preview-62b9cb2a--4baa2115-2846-40bd-b9b2-cc80d3e4fa5d.lovable.app-1781802062376.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ActiveMemberProvider>
          <Outlet />
          <Toaster richColors position="top-center" />
        </ActiveMemberProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
