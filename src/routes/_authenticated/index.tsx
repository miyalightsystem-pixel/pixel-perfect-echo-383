import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, isToday, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { motion } from "framer-motion";
import { Pin, ArrowRight, Calendar, Coins, ClipboardList, QrCode, MessagesSquare, FolderOpen } from "lucide-react";
import { DISCORD_INVITE_URL, TUGAS_DRIVE_URL } from "@/lib/external-links";
import {
  titahListQuery,
  eventListQuery,
  tugasListQuery,
  kasPembayaranListQuery,
  kasPeriodeListQuery,
  pengeluaranListQuery,
  jadwalListQuery,
} from "@/lib/queries";
import { formatRupiah } from "@/lib/utils";
import { SegmenDivider } from "@/components/empire/SegmenDivider";
import { EmptyState } from "@/components/empire/EmptyState";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Beranda — JERUK'S EMPIRE" },
      { name: "description", content: "Ringkasan hari ini: titah, jadwal, deadline tugas, dan kas kelas TI." },
      { property: "og:title", content: "Beranda — JERUK'S EMPIRE" },
      { property: "og:description", content: "Ringkasan hari ini untuk para Bangsawan." },
    ],
  }),
  component: Beranda,
});

const HARI_LABEL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function Beranda() {
  const { data: titah } = useQuery(titahListQuery);
  const { data: events } = useQuery(eventListQuery);
  const { data: tugas } = useQuery(tugasListQuery);
  const { data: pembayaran } = useQuery(kasPembayaranListQuery);
  const { data: periode } = useQuery(kasPeriodeListQuery);
  const { data: pengeluaran } = useQuery(pengeluaranListQuery);
  const { data: jadwal } = useQuery(jadwalListQuery);

  const pinned = titah?.find((t) => t.pinned) ?? titah?.[0];

  const upcomingUAS = events
    ?.filter((e) => e.jenis === "uas" && new Date(e.tanggal_mulai) >= startOfToday())
    .sort((a, b) => a.tanggal_mulai.localeCompare(b.tanggal_mulai))[0];
  const countdownDays = upcomingUAS
    ? differenceInCalendarDays(parseISO(upcomingUAS.tanggal_mulai), new Date())
    : null;

  const upcomingDeadlines = tugas
    ?.filter((t) => t.status !== "selesai" && new Date(t.deadline) >= new Date(Date.now() - 86400000))
    .slice(0, 3);

  // Total kas: sum pembayaran lunas - sum pengeluaran
  const totalLunas = (pembayaran ?? []).reduce((s, p) => s + (p.status === "lunas" ? p.jumlah : 0), 0);
  const totalPengeluaran = (pengeluaran ?? []).reduce((s, p) => s + p.jumlah, 0);
  const saldoKas = totalLunas - totalPengeluaran;

  const todayDow = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const jadwalHariIni = jadwal?.filter((j) => j.hari === todayDow);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Quick actions */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/absen"
          className="group rounded-xl border border-empire/40 bg-gradient-to-br from-empire/10 to-transparent p-4 hover:border-empire transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-empire">
            <QrCode className="size-5 transition-transform group-hover:scale-110" />
            <span className="font-display text-base">Absen Cepat</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Bagi link QR absen sesi hari ini.</p>
        </Link>
        <a
          href={TUGAS_DRIVE_URL}
          target="_blank"
          rel="noreferrer"
          className="group rounded-xl border border-border/60 bg-card p-4 hover:border-empire transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-empire">
            <FolderOpen className="size-5 transition-transform group-hover:scale-110" />
            <span className="font-display text-base">Drive Tugas</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Folder pengumpulan tugas kelas.</p>
        </a>
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noreferrer"
          className="group rounded-xl border border-border/60 bg-card p-4 hover:border-[#5865F2] transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-2 text-[#5865F2]">
            <MessagesSquare className="size-5 transition-transform group-hover:scale-110" />
            <span className="font-display text-base">Discord Kelas</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Gabung server obrolan kelas.</p>
        </a>
      </section>

      {/* Hero / Titah */}
      <section>
        {pinned ? (
          <article className="rounded-2xl border-l-4 border-empire bg-card p-5 shadow-sm">
            <div className="flex items-start gap-2">
              <Pin className="size-4 text-empire mt-1" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-empire font-semibold">Titah Mingguan</p>
                <h1 className="font-display text-2xl md:text-3xl mt-1 leading-tight">{pinned.judul}</h1>
                <p className="mt-2 text-foreground/85">{pinned.isi}</p>
                <p className="mt-3 text-xs text-muted-foreground font-mono">
                  diposting {format(parseISO(pinned.tanggal), "d MMM yyyy", { locale: idLocale })}
                </p>
              </div>
            </div>
          </article>
        ) : (
          <EmptyState title="Belum ada titah baru minggu ini" hint="Yang Mulia atau Sekretaris dapat menyebar titah pertama." />
        )}
      </section>

      <SegmenDivider />

      {/* Grid summary */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Countdown */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-empire">
            <Calendar className="size-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Countdown UAS</h2>
          </div>
          {upcomingUAS && countdownDays !== null ? (
            <>
              <p className="mt-2 font-mono text-4xl text-foreground">
                {countdownDays < 0 ? "—" : countdownDays}
                <span className="text-base text-muted-foreground"> hari</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {upcomingUAS.nama} · {format(parseISO(upcomingUAS.tanggal_mulai), "d MMM", { locale: idLocale })}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Belum ada UAS terjadwal.</p>
          )}
        </div>

        {/* Kas */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-empire">
            <Coins className="size-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Perbendaharaan</h2>
          </div>
          <p className="mt-2 font-mono text-3xl">{formatRupiah(saldoKas)}</p>
          <p className="text-sm text-muted-foreground">
            {periode?.[0]?.label ?? "Belum ada periode"}
          </p>
          <Link
            to="/perbendaharaan"
            className="mt-2 inline-flex items-center gap-1 text-sm text-empire hover:underline"
          >
            Lihat Perbendaharaan <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Deadlines */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-empire">
            <ClipboardList className="size-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Deadline Terdekat</h2>
          </div>
          {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-sm">
              {upcomingDeadlines.map((t) => {
                const d = parseISO(t.deadline);
                const days = differenceInCalendarDays(d, new Date());
                return (
                  <li key={t.id} className="flex justify-between gap-2">
                    <span className="truncate">{t.judul}</span>
                    <span className="font-mono text-xs text-muted-foreground shrink-0">
                      {days <= 0 ? "hari ini" : `${days}h`}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Tak ada deadline mendekat.</p>
          )}
          <Link
            to="/balai-tugas"
            className="mt-3 inline-flex items-center gap-1 text-sm text-empire hover:underline"
          >
            Buka Balai Tugas <ArrowRight className="size-3" />
          </Link>
        </div>
      </section>

      {/* Jadwal hari ini */}
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="font-display text-xl text-empire">
          Jadwal Hari Ini — {HARI_LABEL[new Date().getDay()]}
        </h2>
        {jadwalHariIni && jadwalHariIni.length > 0 ? (
          <ul className="mt-3 divide-y divide-border/60">
            {jadwalHariIni.map((j) => (
              <li key={j.id} className="flex items-center gap-3 py-2.5">
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
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Hari ini bebas dari titah perkuliahan. Istirahatkan jiwa Bangsawan Anda.
          </p>
        )}
      </section>
    </motion.div>
  );
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

