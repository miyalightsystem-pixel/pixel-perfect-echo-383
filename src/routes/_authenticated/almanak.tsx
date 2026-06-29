import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { jadwalListQuery, eventListQuery } from "@/lib/queries";
import { EmptyState } from "@/components/empire/EmptyState";
import { Crown, CalendarRange } from "lucide-react";

export const Route = createFileRoute("/_authenticated/almanak")({
  head: () => ({
    meta: [
      { title: "Almanak — JERUK'S EMPIRE" },
      { name: "description", content: "Jadwal kuliah mingguan dan kalender akademik kelas TI." },
      { property: "og:title", content: "Almanak — JERUK'S EMPIRE" },
      { property: "og:description", content: "Jadwal kuliah & kalender akademik." },
    ],
  }),
  component: Almanak,
});

const HARI = [
  { num: 1, label: "Senin" },
  { num: 2, label: "Selasa" },
  { num: 3, label: "Rabu" },
  { num: 4, label: "Kamis" },
  { num: 5, label: "Jumat" },
  { num: 6, label: "Sabtu" },
];

const JENIS_LABEL: Record<string, string> = {
  uts: "UTS",
  uas: "UAS",
  libur: "Libur",
  lainnya: "Lain",
};

const JENIS_STYLE: Record<string, string> = {
  uts: "bg-[color:var(--zest-yellow)]/30 text-rind",
  uas: "bg-empire text-empire-foreground",
  libur: "bg-[color:var(--peel-green)]/20 text-[color:var(--peel-green)]",
  lainnya: "bg-muted text-muted-foreground",
};

function Almanak() {
  const { data: jadwal } = useQuery(jadwalListQuery);
  const { data: events } = useQuery(eventListQuery);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-empire">Almanak</h1>
        <p className="text-sm text-muted-foreground">Catatan perjalanan kerajaan dalam waktu.</p>
      </header>

      <Tabs defaultValue="jadwal">
        <TabsList>
          <TabsTrigger value="jadwal">Jadwal Mingguan</TabsTrigger>
          <TabsTrigger value="kalender">Kalender Akademik</TabsTrigger>
        </TabsList>

        <TabsContent value="jadwal" className="mt-4">
          {jadwal && jadwal.length > 0 ? (
            <div className="space-y-4">
              {HARI.map((h) => {
                const list = jadwal.filter((j) => j.hari === h.num);
                if (list.length === 0) return null;
                return (
                  <div key={h.num} className="rounded-xl border bg-card overflow-hidden">
                    <div className="bg-empire/10 px-4 py-2 font-display text-lg text-empire flex items-center gap-2">
                      <CalendarRange className="size-4" /> {h.label}
                    </div>
                    <ul className="divide-y divide-border/60">
                      {list.map((j) => (
                        <li key={j.id} className="flex items-center gap-3 px-4 py-3">
                          <span className="font-mono text-sm text-empire w-28 shrink-0">
                            {j.jam_mulai}–{j.jam_selesai}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{j.matkul}</div>
                            {j.dosen && (
                              <div className="text-xs text-muted-foreground">Dosen: {j.dosen}</div>
                            )}
                          </div>
                          {j.ruangan && (
                            <span className="font-mono text-xs text-muted-foreground shrink-0">{j.ruangan}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Belum ada jadwal tercatat di almanak." />
          )}
        </TabsContent>

        <TabsContent value="kalender" className="mt-4">
          {events && events.length > 0 ? (
            <ul className="space-y-2">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          JENIS_STYLE[e.jenis] ?? ""
                        }`}
                      >
                        {JENIS_LABEL[e.jenis]}
                      </span>
                      <span className="font-medium">{e.nama}</span>
                      {e.jenis === "uas" && <Crown className="size-3.5 text-plum" />}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {format(parseISO(e.tanggal_mulai), "d MMM yyyy", { locale: idLocale })}
                      {e.tanggal_selesai &&
                        e.tanggal_selesai !== e.tanggal_mulai &&
                        ` – ${format(parseISO(e.tanggal_selesai), "d MMM yyyy", { locale: idLocale })}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Kalender akademik masih kosong." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
