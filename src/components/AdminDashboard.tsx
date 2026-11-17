'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type {
  AdminDailyPoint,
  AdminRecentEvent,
  AdminTopTarget,
  AdminUserRow,
} from '@/app/api/admin/route';

type AdminAuthMode = 'authorized' | 'unauthenticated' | 'forbidden' | 'no_database';
type RangeOption = '24h' | '7d' | '30d' | 'all';

interface AdminPayload {
  ok: boolean;
  error?: string;
  range: RangeOption;
  kpis: {
    totalAccounts: number;
    verifiedAccounts: number;
    pendingAccounts: number;
    newLast7d: number;
    workspacesCount: number;
    totalTransactions: number;
    totalBankAccounts: number;
    totalGoals: number;
    eventsInRange: number;
    eventsLast24h: number;
    uniqueSessions: number;
    otpTotal7d: number;
    otpVerified7d: number;
  };
  dailySeries: AdminDailyPoint[];
  topTargets: AdminTopTarget[];
  topTabs: { tab: string; count: number }[];
  users: AdminUserRow[];
  recentEvents: AdminRecentEvent[];
}

interface AdminDashboardProps {
  mode: AdminAuthMode;
  adminEmail: string;
  adminName?: string;
  currentEmail?: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  click: 'Clique',
  tab_switch: 'Aba',
  modal_open: 'Modal',
  page_view: 'Acesso',
  auth_success: 'Login OK',
};

function fmtDateTimeBR(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AdminDailyChart({ series }: { series: AdminDailyPoint[] }) {
  const maxClicks = Math.max(1, ...series.map((p) => p.clicks));
  const maxSignups = Math.max(1, ...series.map((p) => p.signups));
  const width = 640;
  const height = 210;
  const padLeft = 28;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const stepX = series.length > 0 ? plotW / series.length : plotW;
  const barW = Math.max(10, Math.min(24, stepX * 0.56));

  return (
    <figure className="admin-chart-figure">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="admin-chart-svg"
        role="img"
        aria-labelledby="admin-daily-chart-caption"
      >
        {[0, 0.5, 1].map((ratio) => {
          const y = padTop + plotH * (1 - ratio);
          return (
            <line
              key={ratio}
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              stroke="var(--chart-grid)"
              strokeDasharray="3 4"
            />
          );
        })}

        {series.map((pt, idx) => {
          const cx = padLeft + idx * stepX + stepX / 2;
          const barH = Math.round((pt.clicks / maxClicks) * plotH);
          const barY = padTop + plotH - barH;
          const signupH = pt.signups > 0 ? Math.max(6, Math.round((pt.signups / maxSignups) * (plotH * 0.45))) : 0;
          return (
            <g key={pt.date}>
              <title>{`${pt.label}: ${pt.clicks} cliques/ações · ${pt.signups} cadastro(s)`}</title>
              <rect
                x={cx - barW / 2}
                y={barY}
                width={barW}
                height={Math.max(2, barH)}
                rx={6}
                fill={pt.clicks > 0 ? '#0d6efd' : 'rgba(15, 35, 65, 0.08)'}
                fillOpacity={pt.clicks > 0 ? 0.85 : 1}
              />
              {signupH > 0 && (
                <rect
                  x={cx - barW / 4}
                  y={padTop + plotH - signupH}
                  width={barW / 2}
                  height={signupH}
                  rx={4}
                  fill="#059669"
                />
              )}
              {(idx % 2 === 0 || idx === series.length - 1) && (
                <text
                  x={cx}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--text-muted)"
                >
                  {pt.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption id="admin-daily-chart-caption" className="admin-chart-caption">
        <span>
          <i className="admin-legend-dot is-blue" aria-hidden="true" /> Cliques & interações por dia
        </span>
        <span>
          <i className="admin-legend-dot is-green" aria-hidden="true" /> Novos cadastros
        </span>
      </figcaption>
    </figure>
  );
}

export function AdminDashboard({
  mode,
  adminEmail,
  adminName,
  currentEmail,
}: AdminDashboardProps) {
  const [range, setRange] = useState<RangeOption>('7d');
  const [data, setData] = useState<AdminPayload | null>(null);
  const [loading, setLoading] = useState(mode === 'authorized');
  const [errorMsg, setErrorMsg] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [cleanupNotice, setCleanupNotice] = useState('');

  const loadMetrics = useCallback(async (targetRange: RangeOption) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin?range=${encodeURIComponent(targetRange)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErrorMsg(json.error || 'Não foi possível carregar os dados do painel admin.');
      } else {
        setData(json as AdminPayload);
      }
    } catch {
      setErrorMsg('Falha de conexão ao consultar os dados administrativos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'authorized') {
      loadMetrics(range);
    }
  }, [mode, range, loadMetrics]);

  const handleLogoutToSwitch = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    }).catch(() => {});
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('farol_auth_session_v1');
      window.location.href = '/';
    }
  };

  const handleCleanOldEvents = async () => {
    setCleanupNotice('');
    try {
      const res = await fetch('/api/admin', { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.ok) {
        setCleanupNotice(`Removidos ${json.deletedCount} evento(s) com mais de 30 dias.`);
        loadMetrics(range);
      }
    } catch {
      setCleanupNotice('Não foi possível limpar eventos antigos agora.');
    }
  };

  const filteredUsers = useMemo(() => {
    const list = data?.users || [];
    const q = userSearch.trim().toLowerCase();
    return list.filter((u) => {
      if (statusFilter === 'verified' && !u.verified) return false;
      if (statusFilter === 'pending' && u.verified) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [data?.users, userSearch, statusFilter]);

  if (mode !== 'authorized') {
    return (
      <div className="admin-gate-wrap">
        <div className="admin-gate-card">
          <div className="modal-icon-badge" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="admin-gate-title">Painel Administrativo Privado</h1>
          {mode === 'unauthenticated' && (
            <p className="admin-gate-desc">
              Esta área mostra contas cadastradas e métricas de cliques do Farol Finanças. Entre com a conta
              administradora autorizada e valide o código OTP para continuar.
            </p>
          )}
          {mode === 'forbidden' && (
            <p className="admin-gate-desc">
              A conta conectada atualmente (<strong>{currentEmail || 'desconhecida'}</strong>) não tem permissão de administrador
              para acessar este painel privado.
            </p>
          )}
          {mode === 'no_database' && (
            <p className="admin-gate-desc">
              A variável <code>DATABASE_URL</code> não está configurada neste ambiente local para consultar o PostgreSQL.
            </p>
          )}

          <div className="admin-gate-actions">
            <Link href="/" className="btn-primary" style={{ textDecoration: 'none' }}>
              Ir para o Farol
            </Link>
            {mode === 'forbidden' && (
              <button type="button" className="btn-secondary" onClick={handleLogoutToSwitch}>
                Trocar de conta
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const maxTargetCount = Math.max(1, ...(data?.topTargets || []).map((t) => t.count));
  const otpPct = kpis && kpis.otpTotal7d > 0 ? Math.round((kpis.otpVerified7d / kpis.otpTotal7d) * 100) : 100;

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand-group">
          <div className="brand-logo" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div className="admin-title-row">
              <h1 className="page-title" style={{ fontSize: '21px' }}>Painel Admin · Farol Finanças</h1>
              <span className="admin-badge-verified">{adminName || adminEmail}</span>
            </div>
            <p className="page-subtitle">
              Contas cadastradas no PostgreSQL, ativações 2FA e acompanhamento de cliques em tempo real
            </p>
          </div>
        </div>

        <div className="admin-topbar-actions">
          <div className="admin-range-group" role="group" aria-label="Período das métricas de cliques">
            {([
              ['24h', '24h'],
              ['7d', '7 dias'],
              ['30d', '30 dias'],
              ['all', 'Tudo'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`admin-range-btn ${range === val ? 'active' : ''}`}
                aria-pressed={range === val}
                onClick={() => setRange(val)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadMetrics(range)}
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
          <Link href="/" className="btn-primary" style={{ textDecoration: 'none' }}>
            Voltar ao Painel
          </Link>
        </div>
      </header>

      {errorMsg && (
        <div className="admin-alert-error" role="alert">
          {errorMsg}
        </div>
      )}

      <main className="admin-main">
        {/* 4 KPI Cards */}
        <section className="admin-kpi-grid" aria-label="Indicadores principais">
          <article className="card admin-kpi-card">
            <span className="admin-kpi-eyebrow">
              <i className="modal-eyebrow-dot" aria-hidden="true" /> CONTAS CADASTRADAS
            </span>
            <div className="admin-kpi-val">{kpis ? kpis.totalAccounts : '—'}</div>
            <p className="admin-kpi-sub">
              {kpis
                ? `${kpis.verifiedAccounts} verificadas · ${kpis.pendingAccounts} pendentes · +${kpis.newLast7d} em 7 dias`
                : 'Carregando base de usuários...'}
            </p>
          </article>

          <article className="card admin-kpi-card">
            <span className="admin-kpi-eyebrow">
              <i className="modal-eyebrow-dot" aria-hidden="true" /> CLIQUES & EVENTOS ({range === 'all' ? 'TOTAL' : range.toUpperCase()})
            </span>
            <div className="admin-kpi-val">{kpis ? kpis.eventsInRange : '—'}</div>
            <p className="admin-kpi-sub">
              {kpis
                ? `${kpis.eventsLast24h} nas últimas 24h · ${kpis.uniqueSessions} sessões únicas`
                : 'Aguardando telemetria...'}
            </p>
          </article>

          <article className="card admin-kpi-card">
            <span className="admin-kpi-eyebrow">
              <i className="modal-eyebrow-dot" aria-hidden="true" /> DADOS FINANCEIROS SALVOS
            </span>
            <div className="admin-kpi-val">{kpis ? kpis.totalTransactions : '—'}</div>
            <p className="admin-kpi-sub">
              {kpis
                ? `lançamentos em ${kpis.workspacesCount} contas · ${kpis.totalGoals} metas criadas`
                : 'Consultando workspaces...'}
            </p>
          </article>

          <article className="card admin-kpi-card">
            <span className="admin-kpi-eyebrow">
              <i className="modal-eyebrow-dot" aria-hidden="true" /> SEGURANÇA OTP (7 DIAS)
            </span>
            <div className="admin-kpi-val">{kpis ? `${otpPct}%` : '—'}</div>
            <p className="admin-kpi-sub">
              {kpis
                ? `${kpis.otpVerified7d} de ${kpis.otpTotal7d} códigos validados por e-mail`
                : 'Analisando códigos 2FA...'}
            </p>
          </article>
        </section>

        {/* Charts & Top Clicks */}
        <section className="admin-charts-grid" aria-label="Evolução e ranking de cliques">
          <article className="card">
            <div className="card-header-row" style={{ marginBottom: '12px' }}>
              <div>
                <h2 className="card-title">Atividade nos últimos 14 dias</h2>
                <p className="vs-prev">Volume diário de cliques/ações comparados a novos cadastros</p>
              </div>
            </div>
            {data?.dailySeries ? (
              <AdminDailyChart series={data.dailySeries} />
            ) : (
              <div className="admin-empty-box">Carregando gráfico...</div>
            )}
          </article>

          <article className="card">
            <div className="card-header-row" style={{ marginBottom: '12px' }}>
              <div>
                <h2 className="card-title">Cliques & botões mais usados</h2>
                <p className="vs-prev">Ranking de interações capturadas em lotes via fetchLater</p>
              </div>
            </div>

            {data?.topTabs && data.topTabs.length > 0 && (
              <div className="admin-tabs-pills" aria-label="Abas mais visitadas">
                {data.topTabs.slice(0, 6).map((t) => (
                  <span key={t.tab} className="admin-tab-chip">
                    <strong>{t.tab}</strong>
                    <span>{t.count}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="admin-bar-list">
              {(data?.topTargets || []).length === 0 ? (
                <div className="admin-empty-box">
                  Ainda não há cliques registrados neste período. Assim que você ou usuários navegarem no Farol, os cliques aparecerão aqui.
                </div>
              ) : (
                data?.topTargets.slice(0, 8).map((item) => {
                  const pct = Math.max(6, Math.round((item.count / maxTargetCount) * 100));
                  return (
                    <div key={`${item.eventType}-${item.target}`} className="admin-bar-row">
                      <div className="admin-bar-head">
                        <div className="admin-bar-label">
                          <span className="admin-ev-tag">{EVENT_TYPE_LABELS[item.eventType] || item.eventType}</span>
                          <strong>{item.label || item.target}</strong>
                          <code>{item.target}</code>
                        </div>
                        <span className="admin-bar-nums">
                          <strong>{item.count}</strong> · {item.uniqueSessions} sess.
                        </span>
                      </div>
                      <div className="admin-bar-track">
                        <div className="admin-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>
        </section>

        {/* Contas Cadastradas Table */}
        <section className="card" aria-labelledby="admin-users-caption">
          <div className="admin-section-header">
            <div>
              <h2 className="card-title" id="admin-users-caption">
                Contas Cadastradas ({filteredUsers.length})
              </h2>
              <p className="vs-prev">Relação completa da tabela UserAccount associada aos lançamentos e atividade</p>
            </div>

            <search className="admin-search-controls">
              <div className="admin-search-field">
                <label className="visually-hidden" htmlFor="admin-user-search">
                  Buscar por nome ou e-mail
                </label>
                <input
                  id="admin-user-search"
                  type="search"
                  className="form-input"
                  placeholder="Filtrar por nome ou e-mail..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <div className="admin-search-field">
                <label className="visually-hidden" htmlFor="admin-user-filter">
                  Filtrar por status da conta
                </label>
                <select
                  id="admin-user-filter"
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'verified' | 'pending')}
                >
                  <option value="all">Todas ({data?.users?.length || 0})</option>
                  <option value="verified">Verificadas ({kpis?.verifiedAccounts || 0})</option>
                  <option value="pending">Pendentes OTP ({kpis?.pendingAccounts || 0})</option>
                </select>
              </div>
            </search>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby="admin-users-caption"
            className="admin-table-wrap admin-users-table-wrap"
          >
            <table className="admin-table admin-users-table">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Status OTP</th>
                  <th scope="col">Lançamentos</th>
                  <th scope="col">Metas</th>
                  <th scope="col">Cliques</th>
                  <th scope="col">Cadastro</th>
                  <th scope="col">Último acesso</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      Nenhuma conta encontrada para o filtro aplicado.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <th scope="row">{u.name}</th>
                      <td>{u.email}</td>
                      <td>
                        <span className={`admin-status-pill ${u.verified ? 'is-ok' : 'is-pending'}`}>
                          {u.verified ? 'Verificada' : 'Pendente OTP'}
                        </span>
                      </td>
                      <td>{u.transactionsCount}</td>
                      <td>{u.goalsCount}</td>
                      <td>{u.eventsCount}</td>
                      <td>{fmtDateTimeBR(u.createdAt)}</td>
                      <td>{fmtDateTimeBR(u.lastEventAt || u.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Clicks Log Table */}
        <section className="card" aria-labelledby="admin-events-caption">
          <div className="admin-section-header">
            <div>
              <h2 className="card-title" id="admin-events-caption">
                Cliques & Interações Recentes ({data?.recentEvents?.length || 0})
              </h2>
              <p className="vs-prev">Últimas 80 ações gravadas na tabela AnalyticsEvent</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {cleanupNotice && <span className="field-hint">{cleanupNotice}</span>}
              <button type="button" className="btn-secondary" onClick={handleCleanOldEvents}>
                Limpar logs &gt; 30 dias
              </button>
            </div>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby="admin-events-caption"
            className="admin-table-wrap admin-events-table-wrap"
          >
            <table className="admin-table admin-events-table">
              <thead>
                <tr>
                  <th scope="col">Evento</th>
                  <th scope="col">Elemento / Alvo</th>
                  <th scope="col">Aba</th>
                  <th scope="col">Conta / Sessão</th>
                  <th scope="col">Quando</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentEvents || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      Sem eventos recentes registrados neste intervalo.
                    </td>
                  </tr>
                ) : (
                  data?.recentEvents.map((ev) => (
                    <tr key={ev.id}>
                      <th scope="row">
                        <span className="admin-ev-tag">{EVENT_TYPE_LABELS[ev.eventType] || ev.eventType}</span>
                      </th>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong>{ev.label || ev.target}</strong>
                          <code className="admin-code-muted">{ev.target}</code>
                        </div>
                      </td>
                      <td>{ev.tab || ev.path}</td>
                      <td>{ev.userEmail || `Visitante (${ev.sessionId.slice(0, 8)})`}</td>
                      <td>{fmtDateTimeBR(ev.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
