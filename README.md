# 💸 Patungan — Bill Splitter

Catat patungan grup → hitung **transfer paling sedikit** → share ke grup chat.
PWA 100% offline, gratis, tanpa akun, tanpa backend. Semua data tersimpan di
perangkat (localStorage).

Model **solo bendahara**: satu orang mencatat semua transaksi, lalu membagikan
ringkasan pelunasan. Lihat [docs/spec.md](docs/spec.md) untuk detail desain.

## Fitur

- Kelola anggota + transaksi (siapa bayar, dibagi ke siapa per-transaksi)
- **Kolom jumlah pintar** — ketik `200000-145000` (selisih e-toll) atau
  `50000+30000` (bensin) dan langsung dihitung
- **Saldo** otomatis + **settle-up minimal** (algoritma greedy)
- Salin / Share ringkasan (Web Share API)
- Riwayat sesi, installable ke home screen, jalan offline

## Stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide ·
vite-plugin-pwa · Vitest

## Perintah

```sh
npm install        # pasang dependency
npm run dev        # server pengembangan (http://localhost:5173)
npm run build      # build produksi -> dist/
npm run preview    # preview hasil build
npm test           # unit test (logika saldo, settle-up, kalkulator)
npm run lint       # eslint
```

## Deploy (gratis)

Build menghasilkan `dist/` statik. Hubungkan repo ke **Cloudflare Pages** atau
**GitHub Pages**:

- Build command: `npm run build`
- Output directory: `dist`

## Struktur

```
src/
  lib/         # logika murni: types, money (kalkulator), calc (saldo/settle), storage, summary
  hooks/       # useStore — state + persist ke localStorage
  components/  # UI (Header, MembersBar, AddTransaction, TransactionList, Balances, SettleUp, …)
    ui/        # primitive (Avatar, Button, Card, Sheet, TextInput)
```

Logika inti (`src/lib/calc.ts`, `src/lib/money.ts`) di-cover unit test —
termasuk contoh dari spec & kasus late-joiner.
