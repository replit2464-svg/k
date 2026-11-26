import React, { useEffect, useState } from 'react';
import {
  Activity,
  Users,
  Award,
  BarChart3,
  LogOut,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Edit3,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { Candidate, LOGO_ASSET_PATH } from '../data/pemiraData';
import {
  AdminUser,
  apiRequest,
  MonitoringResponse,
  ResultsResponse,
  VoterProfile,
} from '../lib/api';

type AdminPage = 'monitoring' | 'user' | 'kandidat' | 'hasil';

interface AdminWorkspaceProps {
  token: string;
  adminUser: AdminUser;
  onCandidatesUpdated: () => Promise<void>;
  onExitToPublic: () => void;
  onLogout: () => void;
}

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  token,
  adminUser,
  onCandidatesUpdated,
  onExitToPublic,
  onLogout,
}) => {
  const [page, setPage] = useState<AdminPage>('monitoring');
  const [loading, setLoading] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const [bannerSuccess, setBannerSuccess] = useState('');

  // Data states
  const [monitoring, setMonitoring] = useState<MonitoringResponse | null>(null);
  const [users, setUsers] = useState<VoterProfile[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<ResultsResponse | null>(null);

  // User filters
  const [userSearch, setUserSearch] = useState('');
  const [angkatanFilter, setAngkatanFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserNim, setNewUserNim] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserAngkatan, setNewUserAngkatan] = useState('2024');
  const [newUserGender, setNewUserGender] = useState('Laki-laki');
  const [newUserRole, setNewUserRole] = useState<'user' | 'validator'>('user');

  // Candidate modal form
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [showCandForm, setShowCandForm] = useState(false);
  const [candChamber, setCandChamber] = useState<'bph' | 'senator'>('bph');
  const [candNumber, setCandNumber] = useState('01');
  const [candName, setCandName] = useState('');
  const [candNim, setCandNim] = useState('');
  const [candCohort, setCandCohort] = useState('Teknik Kimia 2023');
  const [candOrigin, setCandOrigin] = useState('Bandar Lampung');
  const [candMotto, setCandMotto] = useState('');
  const [candVision, setCandVision] = useState('');
  const [candMissionsText, setCandMissionsText] = useState('');
  const [candProgramsText, setCandProgramsText] = useState('');
  const [candTrackText, setCandTrackText] = useState('');
  const [candPlate, setCandPlate] = useState<Candidate['plateVariant']>('distillation');
  const [candPhotoUrl, setCandPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const fetchMonitoring = async () => {
    const res = await apiRequest<MonitoringResponse>('/api/admin/monitoring', {}, token);
    setMonitoring(res);
  };

  const fetchUsers = async () => {
    const params = new URLSearchParams();
    if (userSearch.trim()) params.set('search', userSearch.trim());
    if (angkatanFilter !== 'all') params.set('angkatan', angkatanFilter);
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const res = await apiRequest<{ users: VoterProfile[]; total: number }>(
      `/api/admin/users?${params.toString()}`,
      {},
      token
    );
    setUsers(res.users);
  };

  const fetchCandidates = async () => {
    const res = await apiRequest<{ candidates: Candidate[] }>(
      '/api/admin/candidates',
      {},
      token
    );
    setCandidates(res.candidates);
  };

  const fetchResults = async () => {
    const res = await apiRequest<ResultsResponse>('/api/admin/results', {}, token);
    setResults(res);
  };

  const loadActivePage = async () => {
    setLoading(true);
    setBannerError('');
    try {
      if (page === 'monitoring') await fetchMonitoring();
      else if (page === 'user') await fetchUsers();
      else if (page === 'kandidat') {
        await Promise.all([fetchCandidates(), users.length === 0 ? fetchUsers() : Promise.resolve()]);
      } else if (page === 'hasil') await fetchResults();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadActivePage();
  }, [page]);

  useEffect(() => {
    if (page !== 'user') return;
    const t = window.setTimeout(() => {
      fetchUsers().catch(() => {});
    }, 220);
    return () => window.clearTimeout(t);
  }, [userSearch, angkatanFilter, roleFilter, statusFilter]);

  const handleToggleRole = async (voter: VoterProfile) => {
    const nextRole = voter.role === 'validator' ? 'user' : 'validator';
    setBannerError('');
    setBannerSuccess('');
    try {
      await apiRequest(
        `/api/admin/users/${voter.nim}/role`,
        {
          method: 'PATCH',
          body: JSON.stringify({ role: nextRole }),
        },
        token
      );
      setBannerSuccess(
        `${voter.fullName} (${voter.nim}) kini ditetapkan sebagai ${
          nextRole === 'validator' ? 'Validator' : 'Pemilih Biasa'
        }.`
      );
      await fetchUsers();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Gagal mengubah peran.');
    }
  };

  const handleToggleValidation = async (voter: VoterProfile) => {
    const nextStatus = voter.validationStatus === 'validated' ? 'pending' : 'validated';
    setBannerError('');
    setBannerSuccess('');
    try {
      await apiRequest(
        `/api/admin/users/${voter.nim}/validation`,
        {
          method: 'PATCH',
          body: JSON.stringify({ validationStatus: nextStatus }),
        },
        token
      );
      setBannerSuccess(`Status validasi ${voter.fullName} diperbarui.`);
      await fetchUsers();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Gagal mengubah status validasi.');
    }
  };

  const handleAddVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError('');
    setBannerSuccess('');
    try {
      await apiRequest(
        '/api/admin/users',
        {
          method: 'POST',
          body: JSON.stringify({
            nim: newUserNim.trim(),
            fullName: newUserName.trim(),
            angkatan: newUserAngkatan.trim(),
            gender: newUserGender,
            role: newUserRole,
          }),
        },
        token
      );
      setBannerSuccess(`Pemilih ${newUserName} (${newUserNim}) berhasil ditambahkan.`);
      setShowAddUser(false);
      setNewUserNim('');
      setNewUserName('');
      await fetchUsers();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Gagal menambah pemilih.');
    }
  };

  const openCreateCandidate = () => {
    setEditingCandidate(null);
    setCandChamber('bph');
    setCandNumber('03');
    setCandName('');
    setCandNim('');
    setCandCohort('Teknik Kimia 2023');
    setCandOrigin('Lampung');
    setCandMotto('');
    setCandVision('');
    setCandMissionsText('');
    setCandProgramsText('');
    setCandTrackText('');
    setCandPlate('distillation');
    setCandPhotoUrl(null);
    setPhotoError('');
    setShowCandForm(true);
  };

  const openEditCandidate = (c: Candidate) => {
    setEditingCandidate(c);
    setCandChamber(c.chamber);
    setCandNumber(c.number);
    setCandName(c.name);
    setCandNim(c.nim);
    setCandCohort(c.cohort);
    setCandOrigin(c.origin);
    setCandMotto(c.motto);
    setCandVision(c.vision);
    setCandMissionsText(c.missions.join('\n'));
    setCandProgramsText(
      c.programs.map((p) => `${p.title} | ${p.summary} | ${p.target}`).join('\n')
    );
    setCandTrackText(c.trackRecord.join('\n'));
    setCandPlate(c.plateVariant);
    setCandPhotoUrl(c.photoUrl ?? null);
    setPhotoError('');
    setShowCandForm(true);
  };

  const handleCandidatePhotoFile = async (file: File | undefined | null) => {
    if (!file) return;
    setPhotoError('');

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setPhotoError('Format file harus PNG, JPG/JPEG, atau WebP.');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setPhotoError('Ukuran file gambar dari perangkat maksimal 12 MB.');
      return;
    }

    setPhotoUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Gagal membaca file gambar dari perangkat.'));
        reader.onload = () => {
          const rawResult = String(reader.result || '');
          const img = new Image();
          img.onerror = () => reject(new Error('File gambar tidak dapat diproses.'));
          img.onload = () => {
            const maxDim = 900;
            let { width, height } = img;
            const needsResize = width > maxDim || height > maxDim || file.size > 400 * 1024;
            if (!needsResize) {
              resolve(rawResult);
              return;
            }
            if (width > maxDim || height > maxDim) {
              if (width >= height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(rawResult);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const targetMime = file.type === 'image/png' && file.size < 900 * 1024 ? 'image/png' : 'image/jpeg';
            const compressed = canvas.toDataURL(targetMime, 0.86);
            resolve(compressed);
          };
          img.src = rawResult;
        };
        reader.readAsDataURL(file);
      });
      setCandPhotoUrl(dataUrl);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Gagal memproses foto kandidat.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSelectDptForCandidate = (nimValue: string) => {
    setCandNim(nimValue);
    const match = users.find((u) => u.nim === nimValue);
    if (match) {
      setCandName(match.fullName);
      setCandCohort(`Teknik Kimia ${match.angkatan}`);
    }
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError('');
    setBannerSuccess('');

    const missions = candMissionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const programs = candProgramsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, summary, target] = line.split('|').map((s) => s.trim());
        return {
          title: title || 'Program Kerja',
          summary: summary || 'Inisiatif strategis himpunan.',
          target: target || 'Tercapai dalam 1 periode kepengurusan',
        };
      });

    const trackRecord = candTrackText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      chamber: candChamber,
      number: candNumber.trim(),
      name: candName.trim(),
      nim: candNim.trim(),
      cohort: candCohort.trim(),
      origin: candOrigin.trim(),
      motto: candMotto.trim(),
      vision: candVision.trim(),
      missions,
      programs,
      trackRecord,
      plateVariant: candPlate,
      photoUrl: candPhotoUrl,
    };

    try {
      if (editingCandidate) {
        await apiRequest(
          `/api/admin/candidates/${editingCandidate.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          },
          token
        );
        setBannerSuccess(`Kandidat ${candName} berhasil diperbarui.`);
      } else {
        await apiRequest(
          '/api/admin/candidates',
          {
            method: 'POST',
            body: JSON.stringify(payload),
          },
          token
        );
        setBannerSuccess(`Kandidat baru ${candName} berhasil ditetapkan.`);
      }

      setShowCandForm(false);
      await fetchCandidates();
      await onCandidatesUpdated();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Gagal menyimpan kandidat.');
    }
  };

  const handleDeleteCandidate = async (c: Candidate) => {
    setBannerError('');
    setBannerSuccess('');
    try {
      await apiRequest(`/api/admin/candidates/${c.id}`, { method: 'DELETE' }, token);
      setBannerSuccess(`Kandidat ${c.name} telah dihapus.`);
      await fetchCandidates();
      await onCandidatesUpdated();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Gagal menghapus kandidat.');
    }
  };

  const handleDownloadCsv = () => {
    if (!results) return;
    const rows = [
      ['Jabatan', 'No Urut', 'Nama Kandidat', 'NIM', 'Jumlah Suara', 'Persentase (%)'],
      ...results.bphResults.map((c) => [
        'Ketua BPH',
        c.number,
        c.name,
        c.nim,
        String(c.votes),
        String(c.percentage),
      ]),
      ...results.senatorResults.map((c) => [
        'Senator',
        c.number,
        c.name,
        c.nim,
        String(c.votes),
        String(c.percentage),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hasil-pemira-himatekia-itera-2026.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const navItems: Array<{ id: AdminPage; label: string; icon: React.ReactNode }> = [
    { id: 'monitoring', label: 'Monitoring', icon: <Activity className="w-4 h-4" /> },
    { id: 'user', label: 'User', icon: <Users className="w-4 h-4" /> },
    { id: 'kandidat', label: 'Kandidat', icon: <Award className="w-4 h-4" /> },
    { id: 'hasil', label: 'Hasil Pemira', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const pageTitles: Record<AdminPage, string> = {
    monitoring: 'Monitoring Pelaksanaan',
    user: 'Manajemen User & Validator',
    kandidat: 'Manajemen Kandidat BPH & Senator',
    hasil: 'Hasil Pemira HIMATEKIA 2026',
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0B0B0E] flex flex-col lg:flex-row">
      {/* Sidebar (Desktop 256px) */}
      <aside className="lg:w-64 shrink-0 bg-[#0B0B0E] text-[#FAF9F6] flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#272733]">
        <div>
          <div className="h-16 px-5 border-b border-white/15 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white shrink-0">
              <img
                src={LOGO_ASSET_PATH}
                alt="Logo HIMATEKIA ITERA"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold truncate">
                Admin KPR 2026
              </div>
              <div className="text-xs text-[#D59B0A] font-mono truncate">
                {adminUser.username}
              </div>
            </div>
          </div>

          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto" aria-label="Menu Admin">
            {navItems.map((item) => {
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPage(item.id);
                    setBannerError('');
                    setBannerSuccess('');
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#480E8A] text-white'
                      : 'text-[#FAF9F6]/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-white/15 space-y-2">
          <button
            type="button"
            onClick={onExitToPublic}
            className="w-full py-2 px-3 border border-white/20 text-xs font-medium text-white/85 hover:bg-white hover:text-[#0B0B0E] transition-colors cursor-pointer"
          >
            Lihat Beranda Publik
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-white/10 text-xs font-semibold text-white hover:bg-[#C61D1D] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Breadcrumb Bar */}
        <header className="h-16 px-5 sm:px-8 bg-white border-b border-[#E2DFD7] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
            <span className="text-[#0B0B0E]/50 hidden sm:inline">Admin KPR</span>
            <span className="text-[#0B0B0E]/40 hidden sm:inline">/</span>
            <h1 className="font-display font-bold text-[#0B0B0E] truncate">
              {pageTitles[page]}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void loadActivePage()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E2DFD7] bg-[#FAF9F6] text-xs font-semibold hover:border-[#0B0B0E] cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 bg-[#0B0B0E] text-white text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8 space-y-6 max-w-[1200px] w-full">
          {bannerError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 border border-[#C61D1D] bg-[#C61D1D]/5 text-sm text-[#C61D1D]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{bannerError}</span>
            </div>
          )}

          {bannerSuccess && (
            <div className="flex items-start gap-2.5 p-3.5 border border-[#16A34A] bg-[#16A34A]/5 text-sm text-[#15803D]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{bannerSuccess}</span>
            </div>
          )}

          {/* PAGE 1: MONITORING */}
          {page === 'monitoring' && monitoring && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#E2DFD7] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E2DFD7]">
                <div className="p-5">
                  <div className="text-xs text-[#0B0B0E]/60">Total Pemilih (DPT)</div>
                  <div className="mt-2 font-display text-3xl font-bold tabular-nums">
                    {monitoring.summary.totalDpt}
                  </div>
                  <div className="mt-1 text-xs text-[#0B0B0E]/55">
                    Data Teknik Kimia 2020–2025
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs text-[#0B0B0E]/60">Validator Ditugaskan</div>
                  <div className="mt-2 font-display text-3xl font-bold text-[#D59B0A] tabular-nums">
                    {monitoring.summary.totalValidators}
                  </div>
                  <div className="mt-1 text-xs text-[#0B0B0E]/55">
                    Petugas verifikasi barcode
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs text-[#0B0B0E]/60">Sudah Divalidasi</div>
                  <div className="mt-2 font-display text-3xl font-bold text-[#480E8A] tabular-nums">
                    {monitoring.summary.totalValidated}
                  </div>
                  <div className="mt-1 text-xs text-[#0B0B0E]/55 tabular-nums">
                    {monitoring.summary.pendingValidation} menunggu validasi
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs text-[#0B0B0E]/60">Suara Masuk Sah</div>
                  <div className="mt-2 font-display text-3xl font-bold text-[#0B0B0E] tabular-nums">
                    {monitoring.summary.totalVoted}
                  </div>
                  <div className="mt-1 text-xs text-[#0B0B0E]/55 tabular-nums">
                    Partisipasi{' '}
                    {monitoring.summary.totalDpt > 0
                      ? ((monitoring.summary.totalVoted / monitoring.summary.totalDpt) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </div>
                </div>
              </div>

              {/* Per-Angkatan Breakdown */}
              <div className="border border-[#E2DFD7] bg-white">
                <div className="px-6 py-4 border-b border-[#E2DFD7]">
                  <h2 className="font-display text-base font-bold">
                    Partisipasi Pemilih per Angkatan
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF9F6] border-b border-[#E2DFD7] text-[#0B0B0E]/65">
                      <tr>
                        <th className="py-3 px-5 font-semibold">Angkatan</th>
                        <th className="py-3 px-5 font-semibold text-right">Total DPT</th>
                        <th className="py-3 px-5 font-semibold text-right">Tervalidasi</th>
                        <th className="py-3 px-5 font-semibold text-right">Sudah Memilih</th>
                        <th className="py-3 px-5 font-semibold w-48">Progres Suara</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DFD7]">
                      {monitoring.cohorts.map((c) => {
                        const pct = c.total > 0 ? Math.round((c.voted / c.total) * 100) : 0;
                        return (
                          <tr key={c.angkatan} className="hover:bg-[#FAF9F6]">
                            <td className="py-3 px-5 font-mono font-semibold tabular-nums">
                              {c.angkatan}
                            </td>
                            <td className="py-3 px-5 text-right font-mono tabular-nums">
                              {c.total}
                            </td>
                            <td className="py-3 px-5 text-right font-mono tabular-nums text-[#480E8A] font-medium">
                              {c.validated}
                            </td>
                            <td className="py-3 px-5 text-right font-mono tabular-nums font-bold">
                              {c.voted}
                            </td>
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-[#F1EFE9] overflow-hidden">
                                  <div
                                    className="h-full bg-[#480E8A]"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="font-mono tabular-nums w-9 text-right">
                                  {pct}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Audit Logs */}
              <div className="border border-[#E2DFD7] bg-white">
                <div className="px-6 py-4 border-b border-[#E2DFD7]">
                  <h2 className="font-display text-base font-bold">
                    Catatan Aktivitas Sistem (Anonim)
                  </h2>
                </div>
                {monitoring.logs.length === 0 ? (
                  <div className="p-6 text-sm text-[#0B0B0E]/60">
                    Belum ada aktivitas tercatat.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2DFD7] max-h-80 overflow-y-auto text-xs">
                    {monitoring.logs.map((log) => (
                      <div
                        key={log.id}
                        className="px-6 py-3 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono font-semibold text-[#480E8A] shrink-0">
                            {log.action}
                          </span>
                          <span className="text-[#0B0B0E]/85 truncate">{log.details}</span>
                        </div>
                        <span className="font-mono text-[#0B0B0E]/50 tabular-nums shrink-0">
                          {new Date(log.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAGE 2: USER MANAGEMENT */}
          {page === 'user' && (
            <div className="space-y-5">
              <div className="border border-[#E2DFD7] bg-white p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-[#0B0B0E]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama, NIM, atau kode unik..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[#E2DFD7] bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#480E8A]"
                    />
                  </div>

                  <select
                    value={angkatanFilter}
                    onChange={(e) => setAngkatanFilter(e.target.value)}
                    aria-label="Filter Angkatan"
                    className="px-3 py-2 border border-[#E2DFD7] bg-white text-xs focus:outline-none focus:border-[#480E8A]"
                  >
                    <option value="all">Semua Angkatan</option>
                    <option value="2020">2020</option>
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    aria-label="Filter Peran"
                    className="px-3 py-2 border border-[#E2DFD7] bg-white text-xs focus:outline-none focus:border-[#480E8A]"
                  >
                    <option value="all">Semua Peran</option>
                    <option value="user">User (Pemilih)</option>
                    <option value="validator">Validator</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter Status"
                    className="px-3 py-2 border border-[#E2DFD7] bg-white text-xs focus:outline-none focus:border-[#480E8A]"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Belum Validasi</option>
                    <option value="validated">Tervalidasi (Belum Pilih)</option>
                    <option value="voted">Sudah Memilih</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddUser(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#480E8A] text-white text-xs font-semibold hover:bg-[#320863] cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pemilih DPT</span>
                </button>
              </div>

              <div className="border border-[#E2DFD7] bg-white">
                <div className="px-5 py-3 border-b border-[#E2DFD7] flex items-center justify-between text-xs text-[#0B0B0E]/65">
                  <span>
                    Menampilkan <strong className="text-[#0B0B0E] tabular-nums">{users.length}</strong> mahasiswa terdaftar
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#FAF9F6] border-b border-[#E2DFD7] text-[#0B0B0E]/65">
                      <tr>
                        <th className="py-3 px-4 font-semibold">NIM</th>
                        <th className="py-3 px-4 font-semibold">Nama Lengkap</th>
                        <th className="py-3 px-4 font-semibold">Angkatan</th>
                        <th className="py-3 px-4 font-semibold">Kode Unik</th>
                        <th className="py-3 px-4 font-semibold">Peran</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Pengaturan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DFD7]">
                      {users.map((u) => (
                        <tr key={u.nim} className="hover:bg-[#FAF9F6]">
                          <td className="py-2.5 px-4 font-mono tabular-nums font-medium">
                            {u.nim}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-[#0B0B0E]">
                            {u.fullName}
                          </td>
                          <td className="py-2.5 px-4 font-mono tabular-nums">
                            {u.angkatan}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[#0B0B0E]/70">
                            {u.uniqueCode}
                          </td>
                          <td className="py-2.5 px-4">
                            {u.role === 'validator' ? (
                              <span className="font-semibold text-[#D59B0A]">
                                Validator
                              </span>
                            ) : (
                              <span className="text-[#0B0B0E]/70">User</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {u.hasVoted ? (
                              <span className="font-semibold text-[#480E8A]">
                                Sudah Memilih
                              </span>
                            ) : u.validationStatus === 'validated' ? (
                              <span className="font-medium text-[#15803D]">
                                Tervalidasi
                              </span>
                            ) : (
                              <span className="text-[#0B0B0E]/55">Menunggu</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => void handleToggleRole(u)}
                              className={`px-2.5 py-1 border text-xs font-medium transition-colors cursor-pointer ${
                                u.role === 'validator'
                                  ? 'border-[#D59B0A] bg-[#D59B0A]/15 text-[#0B0B0E] hover:bg-[#D59B0A]/30'
                                  : 'border-[#E2DFD7] bg-white text-[#0B0B0E] hover:border-[#0B0B0E]'
                              }`}
                            >
                              {u.role === 'validator'
                                ? 'Cabut Validator'
                                : 'Jadikan Validator'}
                            </button>

                            {!u.hasVoted && (
                              <button
                                type="button"
                                onClick={() => void handleToggleValidation(u)}
                                className="px-2.5 py-1 border border-[#E2DFD7] bg-white text-xs text-[#0B0B0E]/75 hover:border-[#480E8A] hover:text-[#480E8A] cursor-pointer"
                              >
                                {u.validationStatus === 'validated'
                                  ? 'Reset Validasi'
                                  : 'Validasi'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 3: KANDIDAT MANAGEMENT */}
          {page === 'kandidat' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border border-[#E2DFD7] bg-white p-5">
                <div>
                  <h2 className="font-display text-lg font-bold">
                    Daftar Calon Ketua BPH & Calon Senator 2026
                  </h2>
                  <p className="text-xs text-[#0B0B0E]/65 mt-0.5">
                    Perubahan kandidat langsung tersinkronisasi ke halaman publik dan surat suara pemilih.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateCandidate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#480E8A] text-white text-xs font-semibold hover:bg-[#320863] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tetapkan Kandidat Baru</span>
                </button>
              </div>

              {(['bph', 'senator'] as const).map((chamber) => {
                const list = candidates.filter((c) => c.chamber === chamber);
                return (
                  <div key={chamber} className="border border-[#E2DFD7] bg-white">
                    <div className="px-6 py-4 border-b border-[#E2DFD7] bg-[#FAF9F6] flex items-center justify-between">
                      <h3 className="font-display font-bold text-base">
                        {chamber === 'bph'
                          ? 'Calon Ketua BPH HIMATEKIA-ITERA 2026'
                          : 'Calon Senator HIMATEKIA-ITERA 2026'}
                      </h3>
                      <span className="font-mono text-xs text-[#0B0B0E]/60 tabular-nums">
                        {list.length} Kandidat
                      </span>
                    </div>

                    {list.length === 0 ? (
                      <div className="p-6 text-sm text-[#0B0B0E]/60">
                        Belum ada kandidat terdaftar pada kategori ini.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#E2DFD7]">
                        {list.map((c) => (
                          <div
                            key={c.id}
                            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-4">
                              {c.photoUrl ? (
                                <img
                                  src={c.photoUrl}
                                  alt={`Foto ${c.name}`}
                                  className="w-16 h-20 object-cover object-top border border-[#E2DFD7] shrink-0 bg-[#FAF9F6]"
                                />
                              ) : (
                                <div className="w-16 h-20 border border-[#E2DFD7] bg-[#F1EFE9] shrink-0 flex flex-col items-center justify-center text-[#0B0B0E]/45">
                                  <ImageIcon className="w-5 h-5" />
                                  <span className="font-mono text-[10px] mt-1">
                                    No. {c.number}
                                  </span>
                                </div>
                              )}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs text-[#0B0B0E]/60">
                                  <span className="font-mono font-bold text-[#480E8A]">
                                    No. {c.number}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono">{c.nim}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{c.cohort}</span>
                                </div>
                                <div className="font-display text-lg font-bold text-[#0B0B0E]">
                                  {c.name}
                                </div>
                                <p className="text-xs text-[#0B0B0E]/70 max-w-2xl line-clamp-2">
                                  {c.vision}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditCandidate(c)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E2DFD7] bg-white text-xs font-medium hover:border-[#0B0B0E] cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Ubah</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteCandidate(c)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E2DFD7] bg-white text-xs font-medium text-[#C61D1D] hover:border-[#C61D1D] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGE 4: HASIL PEMIRA */}
          {page === 'hasil' && results && (
            <div className="space-y-8">
              <div className="border border-[#E2DFD7] bg-white p-6 flex flex-wrap items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-8">
                  <div>
                    <div className="text-xs text-[#0B0B0E]/60">Total Surat Suara Sah</div>
                    <div className="font-display text-3xl font-bold tabular-nums mt-1">
                      {results.totalBallots}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#0B0B0E]/60">Total DPT</div>
                    <div className="font-display text-3xl font-bold tabular-nums mt-1">
                      {results.totalDpt}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#0B0B0E]/60">Tingkat Partisipasi</div>
                    <div className="font-display text-3xl font-bold text-[#480E8A] tabular-nums mt-1">
                      {results.turnoutPercentage}%
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0B0B0E] text-white text-xs font-semibold hover:bg-[#480E8A] transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Rekap CSV</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Perolehan Suara Ketua BPH */}
                <div className="border border-[#E2DFD7] bg-white">
                  <div className="px-6 py-4 border-b border-[#E2DFD7] bg-[#FAF9F6]">
                    <h2 className="font-display text-base font-bold">
                      Perolehan Suara Calon Ketua BPH 2026
                    </h2>
                  </div>
                  <div className="p-6 space-y-5">
                    {results.bphResults.map((cand) => (
                      <div key={cand.id} className="space-y-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <div>
                            <span className="font-mono text-xs font-semibold text-[#480E8A] mr-2">
                              No. {cand.number}
                            </span>
                            <span className="font-display font-bold text-sm">
                              {cand.name}
                            </span>
                          </div>
                          <div className="font-mono text-sm font-bold tabular-nums shrink-0">
                            {cand.votes} suara ({cand.percentage}%)
                          </div>
                        </div>
                        <div className="h-3 bg-[#F1EFE9] overflow-hidden">
                          <div
                            className="h-full bg-[#480E8A] transition-all duration-300"
                            style={{ width: `${cand.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Perolehan Suara Senator */}
                <div className="border border-[#E2DFD7] bg-white">
                  <div className="px-6 py-4 border-b border-[#E2DFD7] bg-[#FAF9F6]">
                    <h2 className="font-display text-base font-bold">
                      Perolehan Suara Calon Senator 2026
                    </h2>
                  </div>
                  <div className="p-6 space-y-5">
                    {results.senatorResults.map((cand) => (
                      <div key={cand.id} className="space-y-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <div>
                            <span className="font-mono text-xs font-semibold text-[#D59B0A] mr-2">
                              No. {cand.number}
                            </span>
                            <span className="font-display font-bold text-sm">
                              {cand.name}
                            </span>
                          </div>
                          <div className="font-mono text-sm font-bold tabular-nums shrink-0">
                            {cand.votes} suara ({cand.percentage}%)
                          </div>
                        </div>
                        <div className="h-3 bg-[#F1EFE9] overflow-hidden">
                          <div
                            className="h-full bg-[#D59B0A] transition-all duration-300"
                            style={{ width: `${cand.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Tambah Pemilih DPT */}
      {showAddUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0E]/75"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAddUser(false)}
        >
          <div
            className="w-full max-w-md bg-[#FAF9F6] border border-[#0B0B0E] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E2DFD7] pb-3">
              <h3 className="font-display text-lg font-bold">Tambah Pemilih DPT</h3>
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="p-1.5 border border-[#E2DFD7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddVoter} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">NIM</label>
                <input
                  type="text"
                  required
                  value={newUserNim}
                  onChange={(e) => setNewUserNim(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 124280199"
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD7] font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD7]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Angkatan</label>
                  <input
                    type="text"
                    required
                    value={newUserAngkatan}
                    onChange={(e) => setNewUserAngkatan(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD7] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Jenis Kelamin</label>
                  <select
                    value={newUserGender}
                    onChange={(e) => setNewUserGender(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD7]"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Peran Awal</label>
                <select
                  value={newUserRole}
                  onChange={(e) =>
                    setNewUserRole(e.target.value === 'validator' ? 'validator' : 'user')
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD7]"
                >
                  <option value="user">User (Pemilih)</option>
                  <option value="validator">Validator</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 border border-[#E2DFD7] bg-white text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#480E8A] text-white text-xs font-semibold cursor-pointer"
                >
                  Simpan Pemilih
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Form Tambah / Ubah Kandidat */}
      {showCandForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0B0E]/75"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowCandForm(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FAF9F6] border border-[#0B0B0E] p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E2DFD7] pb-3">
              <h3 className="font-display text-lg font-bold">
                {editingCandidate ? 'Ubah Data Kandidat' : 'Tetapkan Kandidat Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCandForm(false)}
                className="p-1.5 border border-[#E2DFD7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} className="space-y-4 text-sm">
              {!editingCandidate && users.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#480E8A]">
                    Pilih Cepat dari Data Mahasiswa DPT (Opsional)
                  </label>
                  <select
                    onChange={(e) => handleSelectDptForCandidate(e.target.value)}
                    defaultValue=""
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD7] text-xs"
                  >
                    <option value="">-- Pilih mahasiswa dari DPT --</option>
                    {users.slice(0, 200).map((u) => (
                      <option key={u.nim} value={u.nim}>
                        {u.nim} — {u.fullName} ({u.angkatan})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Jabatan</label>
                  <select
                    value={candChamber}
                    onChange={(e) =>
                      setCandChamber(e.target.value === 'senator' ? 'senator' : 'bph')
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD7]"
                  >
                    <option value="bph">Ketua BPH</option>
                    <option value="senator">Senator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Nomor Urut</label>
                  <input
                    type="text"
                    required
                    value={candNumber}
                    onChange={(e) => setCandNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD7] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Gaya Visual</label>
                  <select
                    value={candPlate}
                    onChange={(e) =>
                      setCandPlate(e.target.value as Candidate['plateVariant'])
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD7]"
                  >
                    <option value="distillation">Menara Distilasi</option>
                    <option value="reactor">Reaktor & Daun</option>
                    <option value="lattice">Kisi Geometris</option>
                    <option value="equilibrium">Kesetimbangan</option>
                    <option value="catalyst">Katalis</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload from Device */}
              <div className="border border-[#E2DFD7] bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label
                      htmlFor="candidate-photo-upload"
                      className="block text-xs font-semibold text-[#0B0B0E]"
                    >
                      Foto Resmi Kandidat (Unggah dari Perangkat)
                    </label>
                    <p className="text-[11px] text-[#0B0B0E]/60 mt-0.5">
                      Format PNG, JPG/JPEG, atau WebP. Otomatis dioptimalkan agar tampil tajam di halaman utama & surat suara.
                    </p>
                  </div>
                  {candPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCandPhotoUrl(null);
                        setPhotoError('');
                      }}
                      className="text-xs text-[#C61D1D] font-medium hover:underline cursor-pointer shrink-0"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void handleCandidatePhotoFile(e.dataTransfer.files?.[0]);
                  }}
                  className="flex flex-col sm:flex-row items-center gap-4 border border-dashed border-[#0B0B0E]/25 bg-[#FAF9F6] p-3.5"
                >
                  {candPhotoUrl ? (
                    <img
                      src={candPhotoUrl}
                      alt="Pratinjau foto kandidat"
                      className="w-24 h-28 object-cover object-top border border-[#E2DFD7] bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-28 border border-[#E2DFD7] bg-white flex flex-col items-center justify-center text-[#0B0B0E]/40 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[10px] mt-1">Belum ada foto</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="text-xs text-[#0B0B0E]/75">
                      Pilih file gambar langsung dari laptop/HP Anda atau seret foto ke kotak ini.
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label
                        htmlFor="candidate-photo-upload"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B0B0E] text-white text-xs font-semibold hover:bg-[#480E8A] transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {photoUploading
                            ? 'Memproses Foto...'
                            : candPhotoUrl
                            ? 'Ganti Foto dari Perangkat'
                            : 'Pilih Foto dari Perangkat'}
                        </span>
                      </label>
                      <input
                        id="candidate-photo-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          void handleCandidatePhotoFile(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                        className="sr-only"
                      />
                    </div>
                    {photoError && (
                      <div className="text-xs text-[#C61D1D] font-medium">
                        {photoError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nama Kandidat</label>
                  <input
                    type="text"
                    required
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">NIM</label>
                  <input
                    type="text"
                    required
                    value={candNim}
                    onChange={(e) => setCandNim(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD7] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Angkatan / Prodi</label>
                  <input
                    type="text"
                    required
                    value={candCohort}
                    onChange={(e) => setCandCohort(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Asal Daerah</label>
                  <input
                    type="text"
                    required
                    value={candOrigin}
                    onChange={(e) => setCandOrigin(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2DFD7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Slogan / Motto</label>
                <input
                  type="text"
                  value={candMotto}
                  onChange={(e) => setCandMotto(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Visi</label>
                <textarea
                  rows={3}
                  required
                  value={candVision}
                  onChange={(e) => setCandVision(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Misi (1 poin per baris)
                </label>
                <textarea
                  rows={3}
                  value={candMissionsText}
                  onChange={(e) => setCandMissionsText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD7] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Program Kerja (format: Judul | Ringkasan | Target, 1 per baris)
                </label>
                <textarea
                  rows={3}
                  value={candProgramsText}
                  onChange={(e) => setCandProgramsText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD7] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Rekam Jejak (1 poin per baris)
                </label>
                <textarea
                  rows={2}
                  value={candTrackText}
                  onChange={(e) => setCandTrackText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2DFD7] text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2DFD7]">
                <button
                  type="button"
                  onClick={() => setShowCandForm(false)}
                  className="px-4 py-2 border border-[#E2DFD7] bg-white text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#480E8A] text-white text-xs font-semibold cursor-pointer"
                >
                  {editingCandidate ? 'Simpan Perubahan' : 'Tetapkan Kandidat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
