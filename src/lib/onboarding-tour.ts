import Shepherd from "shepherd.js";

const TOUR_KEY = "empire-tour-completed";

export function hasCompletedTour(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return true;
  }
}

export function markTourCompleted() {
  try { localStorage.setItem(TOUR_KEY, "1"); } catch {}
}

export function startTour() {
  // Avoid duplicate active tour
  if ((window as any).__empireTourActive) return;
  (window as any).__empireTourActive = true;

  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      scrollTo: { behavior: "smooth", block: "center" },
      classes: "empire-shepherd",
      arrow: true,
    },
  });

  const skipBtn = {
    text: "Lewati Panduan",
    action: () => tour.cancel(),
    classes: "shepherd-button-secondary",
  };
  const nextBtn = { text: "Lanjut", action: () => tour.next() };
  const backBtn = { text: "Kembali", action: () => tour.back(), classes: "shepherd-button-secondary" };
  const finishBtn = { text: "Selesai", action: () => tour.complete() };

  tour.addStep({
    id: "welcome-jadwal",
    title: "Selamat Datang, Bangsawan!",
    text: "Di sini kamu bisa melihat jadwal kuliah harian secara lengkap beserta detail ruangan dan dosen pengampu.",
    attachTo: { element: '[data-tour="jadwal"]', on: "bottom" },
    buttons: [skipBtn, nextBtn],
  });

  tour.addStep({
    id: "ganti-tema",
    title: "Ganti Tema Tampilan",
    text: "Bosan dengan tampilannya? Klik di sini untuk beralih antara Jeruk's Empire, Cyber Orange, atau Cinematic Dark sesuai kenyamanan mata kamu.",
    attachTo: { element: '[data-tour="theme"]', on: "bottom" },
    buttons: [backBtn, nextBtn],
  });

  tour.addStep({
    id: "navigasi",
    title: "Eksplor Fitur Lainnya",
    text: "Buka menu Materi, Tugas, Perbendaharaan, Forum, dan lainnya di sini. Pastikan selalu cek pembaruan informasi kelas!",
    attachTo: { element: '[data-tour="nav"]', on: "bottom" },
    buttons: [backBtn, finishBtn],
  });

  const cleanup = () => {
    (window as any).__empireTourActive = false;
  };
  tour.on("complete", () => { markTourCompleted(); cleanup(); });
  tour.on("cancel", () => { markTourCompleted(); cleanup(); });

  tour.start();
}
