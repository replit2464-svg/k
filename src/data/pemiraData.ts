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
    name: 'HAFIIDZURROHMAN GUNTORO',
    nim: '-',
    cohort: 'Teknik Kimia',
    origin: 'ITERA',
    motto: 'Tampung Aspirasi, Wujudkan Karya Kreatif.',
    vision:
      'Menjadikan HIMATEKIA-ITERA sebagai wadah tampung aspirasi dan pengembangan ide kreatif serta inovatif mahasiswa dan mendorong terciptanya lingkungan organisasi yang harmonis, kolaboratif, dan unggul dalam bidang akademik, dengan berlandaskan nilai-nilai kekeluargaan dan integritas serta berorientasi pada pengamalan Tridarma Perguruan Tinggi.',
    missions: [
      'Mewujudkan lingkungan organisasi yang harmonis dan suportif dengan menjunjung tinggi nilai-nilai kekeluargaan dan integritas serta menjadi wadah tampung aspirasi dan pengembangan ide kreatif dan inovatif mahasiswa.',
      'Mengoptimalkan pengembangan akademik dan keilmuan mahasiswa melalui kegiatan edukatif, inovatif, serta pengembangan keprofesian.',
      'Meningkatkan peran HIMATEKIA melalui kolaborasi strategis dan kontribusi aktif dalam lingkungan kampus maupun masyarakat.',
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
    photoUrl: '/assets/aistudio/1_CALON KETUA BPH_HAFIIDZURROHMAN.png',
  },
  {
    id: 'bph-02',
    number: '02',
    chamber: 'bph',
    chamberLabel: 'Calon Ketua BPH HIMATEKIA-ITERA 2026',
    name: 'SIMSON SANGAPAN SIANIPAR',
    nim: '-',
    cohort: 'Teknik Kimia',
    origin: 'ITERA',
    motto: 'Unggul, Progresif, Adaptif, dan Berdaya Saing.',
    vision:
      'Mewujudkan HIMATEKIA-ITERA sebagai himpunan yang unggul, progresif, adaptif, dan berdaya saing di tingkat internal maupun eksternal ITERA melalui kepengurusan yang berintegritas, jernih dalam berpikir, bijaksana dalam bertindak, serta berorientasi pada dampak nyata dan keberlanjutan organisasi.',
    missions: [
      'Mengembangkan potensi dan kompetensi mahasiswa Teknik Kimia untuk menciptakan sumber daya mahasiswa yang unggul dan berdaya saing.',
      'Membangun budaya organisasi yang kolaboratif, inklusif, dan partisipatif melalui komunikasi terbuka serta penyaluran aspirasi mahasiswa.',
      'Mendorong inovasi dan program kerja yang solutif, relevan, serta memberikan dampak nyata bagi mahasiswa dan lingkungan sekitar.',
      'Memperluas jejaring dan kolaborasi strategis dengan organisasi maupun pihak eksternal untuk meningkatkan eksistensi HIMATEKIA-ITERA.',
      'Mewujudkan tata kelola organisasi yang profesional, bertanggung jawab, dan berkelanjutan melalui perencanaan serta evaluasi yang terarah.',
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
    photoUrl: '/assets/aistudio/2_CALON KETUA BPH_SIMSON.PNG',
  },
];

export const SENATOR_CANDIDATES: Candidate[] = [
  {
    id: 'sen-01',
    number: '01',
    chamber: 'senator',
    chamberLabel: 'Calon Senator HIMATEKIA-ITERA 2026',
    name: 'ARVIN DAMARIO AGUNG PUTRA',
    nim: '-',
    cohort: 'Teknik Kimia',
    origin: 'ITERA',
    motto: 'Representatif, Kritis, dan Responsif.',
    vision:
      'Mewujudkan Senator HIMATEKIA-ITERA sebagai lembaga representatif yang kritis, inovatif, berintegritas, dan responsif dalam memperjuangkan aspirasi serta mengawal arah gerak organisasi melalui komunikasi yang terbuka, partisipatif, dan kolaboratif, dengan menjunjung tinggi kesetaraan setiap suara, penghargaan terhadap perbedaan, serta keberpihakan terhadap kepentingan bersama demi kemajuan HIMATEKIA-ITERA.',
    missions: [
      'Membangun sistem representatif dan penyaluran aspirasi yang terbuka dan responsif dengan menyediakan ruang komunikasi yang mudah dijangkau oleh seluruh massa HIMATEKIA-ITERA, serta memastikan setiap aspirasi, kritik, dan gagasan mendapatkan kajian, penyampaian, dan kejelasan tindak lanjut.',
      'Mengembangkan budaya berpikir kritis, partisipatif, dan kolaboratif melalui forum diskusi, pertukaran gagasan, serta penguatan kemampuan anggota dalam berargumentasi, berkomunikasi, dan menyampaikan pendapat secara objektif dan bertanggung jawab.',
      'Memperkuat fungsi kajian dan responsivitas senator melalui evaluasi kebijakan secara objektif, transparansi kinerja, serta respons aktif terhadap berbagai isu di bidang sosial, akademik, dan eksternal yang berpotensi memengaruhi HIMATEKIA-ITERA, guna memastikan organisasi tetap adaptif dan berpihak pada kepentingan Bersama.',
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
    photoUrl: '/assets/aistudio/1_CALON SENATOR_ARVIN.png',
  },
  {
    id: 'sen-02',
    number: '02',
    chamber: 'senator',
    chamberLabel: 'Calon Senator HIMATEKIA-ITERA 2026',
    name: 'ALIA RAHMI AZ ZAHRA',
    nim: '-',
    cohort: 'Teknik Kimia',
    origin: 'ITERA',
    motto: 'Aspiratif, Kritis, dan Berintegritas.',
    vision:
      'Menjadi Senator HIMATEKIA-ITERA yang aspiratif, kritis, dan berintegritas dalam membawa serta mengawal suara massa, memperkuat sinergi kelembagaan, dan menghadirkan kontribusi nyata bagi kemajuan HIMATEKIA-ITERA.',
    missions: [
      'Memperkuat peran senator dalam menyerap dan mengawal aspirasi massa agar kepentingan mahasiswa dapat terwakili dalam proses kelembagaan HIMATEKIA-ITERA.',
      'Mendorong tumbuhnya budaya diskusi dan kesadaran kritis mahasiswa dalam memahami serta merespons isu kemahasiswaan sebagai dasar membangun gerakan yang terarah dan bertanggung jawab.',
      'Menumbuhkan kesadaran dan kepedulian mahasiswa terhadap persoalan bersama serta partisipasi aktif dalam menciptakan perubahan yang konstruktif bagi HIMATEKIA-ITERA.',
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
    photoUrl: '/assets/aistudio/2_CALON SENATOR_ALIA.png',
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
