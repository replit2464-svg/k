export type CandidateChamber = 'bph' | 'senator';

export interface WorkProgram {
  title: string;
  summary: string;
  target: string;
}

export interface Candidate {
  id: string;
  number: string;
  chamber: CandidateChamber;
  chamberLabel: string;
  name: string;
  nim: string;
  cohort: string;
  origin: string;
  motto: string;
  vision: string;
  missions: string[];
  programs: WorkProgram[];
  trackRecord: string[];
  plateVariant: 'distillation' | 'reactor' | 'lattice' | 'equilibrium' | 'catalyst';
  photoUrl?: string | null;
}

export interface TimelinePhase {
  step: string;
  title: string;
  dateRange: string;
  location: string;
  description: string;
  deliverables: string[];
}

export interface MechanismRule {
  id: string;
  question: string;
  answer: string;
}

export const LOGO_ASSET_PATH =
  '/assets/aistudio/66337210_899457840415406_4810408545986019328_n_a49f5ead.jpg';

export const BPH_CANDIDATES: Candidate[] = [
  {
    id: 'bph-01',
    number: '01',
    chamber: 'bph',
    chamberLabel: 'Calon Ketua BPH HIMATEKIA-ITERA 2026',
    name: 'Muhammad Farhan Al-Rasyid',
    nim: '123280018',
    cohort: 'Teknik Kimia 2023',
    origin: 'Bandar Lampung',
    motto: 'Rekayasa Sinergi, Katalisator Karya Nyata.',
    vision:
      'Mewujudkan HIMATEKIA-ITERA sebagai ruang bertumbuh yang adaptif, progresif secara riset keteknikkimiaan, dan berakar kuat pada solidaritas kekeluargaan antarangkatan.',
    missions: [
      'Mengakselerasi inkubasi riset mahasiswa Teknik Kimia melalui pendampingan terstruktur menuju kompetisi proses dan desain pabrik tingkat nasional.',
      'Membangun tata kelola organisasi BPH yang transparan berbasis evaluasi triwulanan terbuka untuk seluruh anggota biasa.',
      'Memperluas kemitraan industri proses di koridor Sumatera dan Jawa guna membuka jalur kunjungan pabrik serta persiapan pascakampus.',
      'Menghadirkan sistem kaderisasi berjenjang yang menyeimbangkan kesiapan akademik, etika profesi insinyur, dan kepekaan sosial.',
    ],
    programs: [
      {
        title: 'ChemEng Catalyst Hub',
        summary:
          'Pusat riset kolaboratif dan mentoring simulasi proses (Aspen Plus & HYSYS) bagi tim lomba desain pabrik serta PKM.',
        target: 'Minimal 12 tim kompetitif terakomodasi per semester',
      },
      {
        title: 'BPH Open Ledger',
        summary:
          'Laporan realisasi program kerja dan keuangan himpunan yang dapat diakses seluruh massa Teknik Kimia secara berkala.',
        target: 'Publikasi rutin setiap akhir kuartal kepengurusan',
      },
      {
        title: 'Sumatera Process Linkage',
        summary:
          'Forum dialog alumni industri petrokimia, oleokimia, dan energi terbarukan dengan mahasiswa tingkat persiapan hingga akhir.',
        target: '3 rangkaian kuliah tamu & 2 kunjungan pabrik terfasilitasi',
      },
    ],
    trackRecord: [
      'Kepala Departemen Riset & Keilmuan BPH HIMATEKIA-ITERA 2025',
      'Asisten Laboratorium Operasi Teknik Kimia ITERA 2024–2025',
      'Finalis National Chemical Engineering Process Design Competition 2025',
    ],
    plateVariant: 'distillation',
  },
  {
    id: 'bph-02',
    number: '02',
    chamber: 'bph',
    chamberLabel: 'Calon Ketua BPH HIMATEKIA-ITERA 2026',
    name: 'Nadia Putri Kusumawardani',
    nim: '123280047',
    cohort: 'Teknik Kimia 2023',
    origin: 'Palembang',
    motto: 'Berdaya Bersama, Bertumbuh Berkelanjutan.',
    vision:
      'Menjadikan HIMATEKIA-ITERA sebagai himpunan yang inklusif, berdampak langsung pada kesejahteraan mahasiswa Teknik Kimia, serta unggul dalam inovasi teknik kimia berkelanjutan.',
    missions: [
      'Mengoptimalkan advokasi akademik dan kesejahteraan mahasiswa agar tidak ada warga Teknik Kimia yang tertinggal dalam proses studi.',
      'Mendorong pengabdian masyarakat berbasis teknologi tepat guna pengolahan limbah dan energi biomassa di sekitar Lampung Selatan.',
      'Menata ulang alur komunikasi antar-divisi BPH dengan pendekatan berbasis proyek yang terukur dan tidak membebani mahasiswa.',
      'Memperkuat jejaring eksternal dengan BKKMTKI dan himpunan teknik kimia se-Indonesia.',
    ],
    programs: [
      {
        title: 'Ruang Advokasi & Tutorial Sebaya',
        summary:
          'Layanan pendampingan mata kuliah inti (Neraca Massa, Termodinamika, Peristiwa Perpindahan) serta kanal keluhan akademik terpadu.',
        target: 'Sesi responsif mingguan sebelum UTS dan UAS',
      },
      {
        title: 'Desa Binaan Bio-Proses ITERA',
        summary:
          'Implementasi reaktor biogas dan pengolahan limbah agroindustri lokal bersama kelompok tani binaan di sekitar kampus.',
        target: '1 unit instalasi percontohan aktif bersama warga',
      },
      {
        title: 'HIMATEKIA Career & Internship Desk',
        summary:
          'Kurasi informasi kerja praktik, beasiswa riset, serta klinik CV dan wawancara teknis khusus mahasiswa Teknik Kimia.',
        target: 'Pendampingan intensif mahasiswa semester 5 ke atas',
      },
    ],
    trackRecord: [
      'Sekretaris Umum Panitia Chemical Engineering Fair ITERA 2025',
      'Staf Ahli Pengembangan Sumber Daya Mahasiswa BPH HIMATEKIA 2025',
      'Delegasi Musyawarah Wilayah BKKMTKI Daerah II 2024',
    ],
    plateVariant: 'reactor',
  },
];

export const SENATOR_CANDIDATES: Candidate[] = [
  {
    id: 'sen-01',
    number: '01',
    chamber: 'senator',
    chamberLabel: 'Calon Senator HIMATEKIA-ITERA 2026',
    name: 'Bagas Prakoso Wijaya',
    nim: '122280034',
    cohort: 'Teknik Kimia 2022',
    origin: 'Metro, Lampung',
    motto: 'Mengawal Aspirasi, Menjaga Marwah Konstitusi.',
    vision:
      'Menghadirkan representasi legislatif Teknik Kimia yang kritis, komunikatif, dan konsisten mengawal kebijakan KM-ITERA agar selaras dengan kebutuhan massa HIMATEKIA.',
    missions: [
      'Menyelenggarakan serap aspirasi rutin sebelum dan sesudah sidang paripurna Senat Mahasiswa KM-ITERA.',
      'Mengawal fungsi pengawasan terhadap pelaksanaan GBHK dan anggaran BPH HIMATEKIA-ITERA secara objektif dan konstruktif.',
      'Mempublikasikan risalah sikap serta hasil sidang KM-ITERA dalam bahasa yang ringkas dan mudah dipahami mahasiswa Teknik Kimia.',
    ],
    programs: [
      {
        title: 'Mimbar Dengar Teknik Kimia',
        summary:
          'Forum bulanan terbuka antara Senator, BPH, dan perwakilan tiap angkatan untuk memetakan isu kampus dan himpunan.',
        target: '100% angkatan aktif terwakili dalam dengar pendapat',
      },
      {
        title: 'Buletin Legislasi & Pengawasan',
        summary:
          'Ringkasan poin-poin keputusan Senat KM-ITERA serta catatan evaluasi program kerja BPH yang terbit secara berkala.',
        target: 'Terbit maksimal 7 hari setelah sidang paripurna',
      },
    ],
    trackRecord: [
      'Anggota Badan Pengawas Pemilihan Raya HIMATEKIA 2025',
      'Ketua Angkatan Teknik Kimia ITERA 2022',
      'Delegasi Kajian Strategis Kebijakan Kampus KM-ITERA 2024',
    ],
    plateVariant: 'lattice',
  },
  {
    id: 'sen-02',
    number: '02',
    chamber: 'senator',
    chamberLabel: 'Calon Senator HIMATEKIA-ITERA 2026',
    name: 'Clarissa Aurelia Situmorang',
    nim: '123280062',
    cohort: 'Teknik Kimia 2023',
    origin: 'Medan',
    motto: 'Legislasi Jernih, Suara Teknik Kimia Terwakili.',
    vision:
      'Menjadi jembatan dua arah yang akuntabel antara dinamika kebijakan di Senat KM-ITERA dan realitas mahasiswa Teknik Kimia ITERA.',
    missions: [
      'Memastikan setiap rancangan peraturan kemahasiswaan dikaji bersama massa Teknik Kimia sebelum tahap pengesahan.',
      'Membangun mekanisme pengawasan anggaran dan kepatuhan AD/ART himpunan berbasis indikator kinerja yang jelas.',
      'Meningkatkan literasi konstitusi kemahasiswaan di kalangan kader muda Teknik Kimia.',
    ],
    programs: [
      {
        title: 'Klinik Konstitusi & AD/ART',
        summary:
          'Lokakarya ringkas mengenai fungsi legislatif, mekanisme pengawasan, dan hak suara anggota biasa HIMATEKIA.',
        target: 'Terintegrasi dalam pembekalan kaderisasi himpunan',
      },
      {
        title: 'Jajak Pendapat Isu Strategis',
        summary:
          'Instrumen survei terstruktur untuk menghimpun mandat suara massa Teknik Kimia sebelum pengambilan keputusan di tingkat institut.',
        target: 'Minimal 3 kali jajak pendapat isu krusial KM-ITERA',
      },
    ],
    trackRecord: [
      'Koordinator Divisi Kajian & Aksi Strategis HIMATEKIA 2025',
      'Sekretaris Komisi Konstitusi Musyawarah Besar HIMATEKIA 2025',
      'Juara 2 Debat Ilmiah Mahasiswa Tingkat Institut 2024',
    ],
    plateVariant: 'equilibrium',
  },
  {
    id: 'sen-03',
    number: '03',
    chamber: 'senator',
    chamberLabel: 'Calon Senator HIMATEKIA-ITERA 2026',
    name: 'Rafi Akbar Maulana',
    nim: '123280091',
    cohort: 'Teknik Kimia 2023',
    origin: 'Bekasi',
    motto: 'Tegas dalam Pengawasan, Terbuka dalam Dialog.',
    vision:
      'Membangun peran Senator HIMATEKIA-ITERA yang proaktif mengadvokasi isu fasilitas laboratorium, kebijakan akademik institut, serta akuntabilitas eksekutif himpunan.',
    missions: [
      'Menginisiasi kajian berbasis data terkait kebutuhan sarana praktikum dan ruang himpunan bersama perwakilan program studi.',
      'Menjaga independensi fungsi legislatif agar evaluasi terhadap BPH berjalan adil, berbasis bukti, dan solutif.',
      'Membuka kanal pengaduan langsung terkait kebijakan KM-ITERA yang berdampak pada aktivitas mahasiswa Teknik Kimia.',
    ],
    programs: [
      {
        title: 'Audit Partisipatif Fasilitas & UKT',
        summary:
          'Kompilasi data kebutuhan fasilitas penunjang Teknik Kimia sebagai bahan advokasi resmi di forum Senat KM-ITERA.',
        target: 'Satu dokumen kajian per semester',
      },
      {
        title: 'Laporan Pertanggungjawaban Tengah Periode',
        summary:
          'Sesi dengar evaluasi terbuka antara Senator dan jajaran BPH HIMATEKIA di pertengahan masa bakti.',
        target: 'Terbuka untuk seluruh anggota biasa HIMATEKIA',
      },
    ],
    trackRecord: [
      'Ketua Pelaksana Seminar Nasional Teknik Kimia ITERA 2025',
      'Anggota Komisi Advokasi HIMATEKIA-ITERA 2024–2025',
      'Perwakilan Mahasiswa pada Forum Evaluasi Kurikulum Prodi 2025',
    ],
    plateVariant: 'catalyst',
  },
];

export const ALL_CANDIDATES: Candidate[] = [...BPH_CANDIDATES, ...SENATOR_CANDIDATES];

export const TIMELINE_PHASES: TimelinePhase[] = [
  {
    step: '01',
    title: 'Penjaringan & Verifikasi Berkas Bakal Calon',
    dateRange: '12 – 21 November 2026',
    location: 'Sekretariat HIMATEKIA & Portal KPR',
    description:
      'Komisi Pemilihan Raya (KPR) membuka pendaftaran resmi bagi mahasiswa aktif Teknik Kimia ITERA yang memenuhi syarat administratif, IPK minimal, dan rekam jejak kaderisasi.',
    deliverables: [
      'Verifikasi faktual berkas bakal calon Ketua BPH dan Senator',
      'Pemeriksaan surat dukungan anggota biasa HIMATEKIA-ITERA',
      'Penetapan Daftar Calon Tetap dan pengundian nomor urut resmi',
    ],
  },
  {
    step: '02',
    title: 'Masa Kampanye & Uji Kelayakan Terbuka',
    dateRange: '24 November – 4 Desember 2026',
    location: 'Pelataran Gedung E & Aula GKU ITERA',
    description:
      'Kandidat memaparkan gagasan program kerja, menjawab pertanyaan kritis panelis dosen/alumni, serta berdialog langsung dengan massa Teknik Kimia dari seluruh angkatan.',
    deliverables: [
      'Pemaparan Grand Design Kepengurusan Calon Ketua BPH 2026',
      'Uji gagasan legislasi dan konstitusi bagi Calon Senator 2026',
      'Debat terbuka kandidat lintas angkatan dan publikasi matriks visi-misi',
    ],
  },
  {
    step: '03',
    title: 'Masa Tenang & Pembersihan Atribut',
    dateRange: '5 – 6 Desember 2026',
    location: 'Lingkungan Kampus ITERA & Kanal Digital',
    description:
      'Seluruh aktivitas kampanye dihentikan selama 48 jam guna memberi ruang refleksi objektif bagi seluruh pemilih sebelum memasuki bilik suara.',
    deliverables: [
      'Penertiban alat peraga kampanye fisik dan konten promosi digital',
      'Finalisasi Daftar Pemilih Tetap (DPT) mahasiswa Teknik Kimia aktif',
      'Uji kesiapan sistem pemungutan suara dan pengawasan saksi',
    ],
  },
  {
    step: '04',
    title: 'Pemungutan Suara & Pleno Penghitungan',
    dateRange: '7 – 9 Desember 2026',
    location: 'Bilik Suara Digital & Ruang Sidang Teknik Kimia',
    description:
      'Anggota biasa HIMATEKIA-ITERA menggunakan hak pilih untuk memilih satu Calon Ketua BPH dan satu Calon Senator berdasarkan asas LUBER JURDIL.',
    deliverables: [
      'Verifikasi identitas pemilih berbasis NIM resmi Teknik Kimia ITERA',
      'Penghitungan suara terbuka bersama saksi pasangan calon dan Bawasra',
      'Penetapan Ketua BPH dan Senator HIMATEKIA-ITERA 2026 terpilih',
    ],
  },
];

export const MECHANISM_RULES: MechanismRule[] = [
  {
    id: 'syarat-pemilih',
    question: 'Siapa saja yang berhak memberikan suara pada PEMIRA HIMATEKIA-ITERA 2026?',
    answer:
      'Seluruh mahasiswa aktif Program Studi Teknik Kimia Institut Teknologi Sumatera yang terdaftar sebagai anggota biasa HIMATEKIA-ITERA pada Daftar Pemilih Tetap (DPT) periode 2026 memiliki satu hak suara untuk masing-masing surat suara Ketua BPH dan Senator.',
  },
  {
    id: 'surat-suara',
    question: 'Apa perbedaan mandat antara Ketua BPH dan Senator HIMATEKIA-ITERA?',
    answer:
      'Ketua Badan Pengurus Harian (BPH) memegang mandat eksekutif untuk memimpin jalannya organisasi, program kerja, kaderisasi, serta pengembangan keprofesian di internal HIMATEKIA-ITERA. Sementara itu, Senator memegang mandat legislatif dan pengawasan serta mewakili suara massa Teknik Kimia di Senat Mahasiswa KM-ITERA.',
  },
  {
    id: 'asas-luber',
    question: 'Bagaimana prinsip kerahasiaan dan integritas suara dijaga selama pemilihan?',
    answer:
      'PEMIRA 2026 menerapkan asas Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil (LUBER JURDIL). Identitas NIM hanya digunakan pada tahap verifikasi hak pilih dan tidak ditautkan pada isi pilihan surat suara saat proses penghitungan pleno.',
  },
  {
    id: 'pratinjau-ui',
    question: 'Apakah fitur Bilik Suara pada laman ini langsung mencatat suara resmi?',
    answer:
      'Tampilan saat ini merupakan prototipe antarmuka resmi berbasis ReactJS untuk mendemonstrasikan alur pemilihan, telaah visi-misi, serta simulasi verifikasi surat suara sebelum dihubungkan dengan basis data pemilihan terpusat KPR HIMATEKIA-ITERA.',
  },
];
