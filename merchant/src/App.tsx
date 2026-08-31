import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  History,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { ApiError, api, clearToken, getStoredToken, storeToken } from "./api";
import { formatAed, formatDateTime, secondsRemaining } from "./lib/format";
import type {
  ClaimCode,
  ClaimStatus,
  CreatedBill,
  Dashboard,
  MerchantBill,
  MerchantProfile,
} from "./types";

type View = "dashboard" | "bills";

const statusLabel: Record<ClaimStatus, string> = {
  UNCLAIMED: "Waiting",
  CLAIMED: "Claimed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

function StatusBadge({ status }: { status: ClaimStatus }) {
  return <span className={`status status--${status.toLowerCase()}`}>{statusLabel[status]}</span>;
}

function Login({ onAuthenticated }: { onAuthenticated: (token: string) => void }) {
  const [phone, setPhone] = useState("+971500000001");
  const [otp, setOtp] = useState("123456");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (step === "phone") {
        await api.requestOtp(phone);
        setStep("otp");
      } else {
        const response = await api.verifyOtp(phone, otp);
        storeToken(response.access_token);
        onAuthenticated(response.access_token);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="brand brand--light"><span>D</span>DinePanel</div>
        <div className="story-copy">
          <span className="eyebrow eyebrow--light"><Sparkles size={14} /> Merchant workspace</span>
          <h1>Every bill becomes a reason to return.</h1>
          <p>Create secure customer claim codes in seconds, then watch rewards land in real time.</p>
          <div className="story-points">
            <span><ShieldCheck size={20} /> Single-use secure claim codes</span>
            <span><Clock3 size={20} /> Live claim status</span>
            <span><CircleDollarSign size={20} /> Server-verified rewards</span>
          </div>
        </div>
        <p className="story-foot">Built for fast-moving Dubai dining rooms.</p>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="mobile-brand brand"><span>D</span>DinePanel</div>
          <span className="step-label">{step === "phone" ? "Welcome back" : "Check your phone"}</span>
          <h2>{step === "phone" ? "Sign in to your restaurant" : "Enter your verification code"}</h2>
          <p>
            {step === "phone"
              ? "Use the mobile number connected to your DinePanel merchant account."
              : `We sent a six-digit code to ${phone}.`}
          </p>
          {step === "phone" ? (
            <label className="field">
              <span>Mobile number</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoFocus />
            </label>
          ) : (
            <label className="field">
              <span>Verification code</span>
              <input
                className="otp-input"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoFocus
              />
            </label>
          )}
          {error && <div className="error-banner">{error}</div>}
          <button className="primary-button primary-button--wide" disabled={loading}>
            {loading ? <LoaderCircle className="spin" size={18} /> : step === "phone" ? "Continue" : "Open workspace"}
            {!loading && <ArrowRight size={18} />}
          </button>
          {step === "otp" && (
            <button type="button" className="text-button" onClick={() => setStep("phone")}>Use another number</button>
          )}
          <div className="demo-note"><span>Demo access</span> +971500000001 · OTP 123456</div>
        </form>
      </section>
    </main>
  );
}

function BillsTable({ bills, emptyCopy = "No bills yet.", onSelect }: { bills: MerchantBill[]; emptyCopy?: string; onSelect?: (bill: MerchantBill) => void }) {
  if (!bills.length) return <div className="empty-state"><ReceiptText size={28} /><p>{emptyCopy}</p></div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Bill</th><th>Created</th><th>Amount</th><th>Reward</th><th>Status</th></tr></thead>
        <tbody>
          {bills.map((bill) => (
            <tr className={onSelect ? "selectable-row" : undefined} key={bill.id} onClick={() => onSelect?.(bill)}>
              <td><strong>{bill.bill_number}</strong><small>{bill.restaurant.name}</small></td>
              <td>{formatDateTime(bill.created_at)}</td>
              <td>{formatAed(bill.bill_amount)}</td>
              <td className="reward-cell">{formatAed(bill.reward_amount)}</td>
              <td><StatusBadge status={bill.claim_status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BillDetailModal({ bill, onClose }: { bill: MerchantBill; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="modal-card bill-detail" role="dialog" aria-modal="true" aria-label={`Bill ${bill.bill_number}`}>
        <button className="icon-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        <span className="modal-icon"><ReceiptText size={22} /></span>
        <div className="bill-detail-heading"><div><span className="eyebrow">Merchant bill</span><h2>{bill.bill_number}</h2></div><StatusBadge status={bill.claim_status} /></div>
        <div className="detail-total"><small>Bill amount</small><strong>{formatAed(bill.bill_amount)}</strong><span>{bill.restaurant.name} · {bill.reward_percentage}% rewards</span></div>
        <div className="detail-grid">
          <div><small>Customer reward</small><strong>{formatAed(bill.reward_amount)}</strong></div>
          <div><small>Created</small><strong>{formatDateTime(bill.created_at)}</strong></div>
          <div><small>Claimed</small><strong>{bill.claimed_at ? formatDateTime(bill.claimed_at) : "—"}</strong></div>
          <div><small>Source</small><strong>{bill.source}</strong></div>
        </div>
        <button className="secondary-button secondary-button--wide" onClick={onClose}>Close details</button>
      </section>
    </div>
  );
}

function CreateBillModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (number: string, amount: string) => Promise<void>;
}) {
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onCreate(number, amount);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create bill");
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card" role="dialog" aria-modal="true" aria-label="Create customer bill">
        <button className="icon-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        <span className="modal-icon"><ReceiptText size={22} /></span>
        <span className="eyebrow">New customer bill</span>
        <h2>Create a reward claim</h2>
        <p>Enter the details exactly as they appear on the customer’s receipt.</p>
        <form onSubmit={submit}>
          <label className="field"><span>Bill number</span><input value={number} onChange={(event) => setNumber(event.target.value.toUpperCase())} placeholder="e.g. GC-1042" required /></label>
          <label className="field amount-field"><span>Bill amount</span><i>AED</i><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" required /></label>
          {error && <div className="error-banner">{error}</div>}
          <button className="primary-button primary-button--wide" disabled={loading || !number || !amount}>
            {loading ? <LoaderCircle className="spin" size={18} /> : <QrCode size={18} />} Generate secure QR
          </button>
        </form>
      </section>
    </div>
  );
}

function ClaimModal({
  token,
  bill,
  onClose,
  onRefresh,
}: {
  token: ClaimCode;
  bill: MerchantBill;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [remaining, setRemaining] = useState(() => secondsRemaining(token.expires_at));
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    setRemaining(secondsRemaining(token.expires_at));
    const interval = window.setInterval(() => setRemaining(secondsRemaining(token.expires_at)), 1000);
    return () => window.clearInterval(interval);
  }, [token.expires_at]);
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className="modal-backdrop">
      <section className="claim-card" role="dialog" aria-modal="true" aria-label="Customer claim QR">
        <button className="icon-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        {bill.claim_status === "CLAIMED" ? (
          <div className="claimed-state">
            <span className="success-orb"><Check size={34} /></span>
            <span className="eyebrow">Reward claimed</span>
            <h2>That’s all done.</h2>
            <p>{formatAed(bill.reward_amount)} was added to the customer’s DinePanel balance.</p>
            <button className="primary-button primary-button--wide" onClick={onClose}>Create another bill</button>
          </div>
        ) : (
          <>
            <span className="eyebrow">Ready to scan</span>
            <h2>Show this code to the customer</h2>
            <p>They’ll preview the reward in DinePanel before confirming.</p>
            <div className="qr-frame"><QRCodeSVG value={token.claim_url} size={226} level="Q" marginSize={1} /></div>
            <div className="claim-summary">
              <div><small>Bill</small><strong>{bill.bill_number}</strong></div>
              <div><small>Amount</small><strong>{formatAed(bill.bill_amount)}</strong></div>
              <div><small>Customer earns</small><strong className="mint-text">{formatAed(bill.reward_amount)}</strong></div>
            </div>
            <div className={`timer ${remaining === 0 ? "timer--expired" : ""}`}>
              <Clock3 size={16} />
              {remaining > 0 ? `Expires in ${minutes}:${seconds}` : "This code has expired"}
              <span className="live-dot" />
            </div>
            {remaining === 0 && (
              <button
                className="secondary-button secondary-button--wide"
                disabled={refreshing}
                onClick={async () => { setRefreshing(true); await onRefresh(); setRefreshing(false); }}
              >
                <RefreshCw className={refreshing ? "spin" : ""} size={17} /> Generate a fresh code
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [bills, setBills] = useState<MerchantBill[]>([]);
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [activeClaim, setActiveClaim] = useState<CreatedBill | null>(null);
  const [selectedBill, setSelectedBill] = useState<MerchantBill | null>(null);
  const restaurant = profile?.memberships[0]?.restaurant;

  const signOut = useCallback(() => {
    clearToken();
    setToken(null);
    setProfile(null);
    setDashboard(null);
    setBills([]);
  }, []);

  const handleError = useCallback((requestError: unknown) => {
    if (requestError instanceof ApiError && requestError.status === 401) {
      signOut();
      return;
    }
    setError(requestError instanceof Error ? requestError.message : "Unable to load your workspace");
  }, [signOut]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    api.profile(token)
      .then(setProfile)
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [token, handleError]);

  const loadWorkspace = useCallback(async () => {
    if (!token || !restaurant) return;
    setError("");
    try {
      const [dashboardData, billData] = await Promise.all([
        api.dashboard(token, restaurant.id),
        api.bills(token, restaurant.id, statusFilter === "ALL" ? undefined : statusFilter),
      ]);
      setDashboard(dashboardData);
      setBills(billData.items);
    } catch (requestError) {
      handleError(requestError);
    }
  }, [token, restaurant, statusFilter, handleError]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  useEffect(() => {
    if (!activeClaim || !token || activeClaim.bill.claim_status !== "UNCLAIMED") return;
    const interval = window.setInterval(async () => {
      try {
        const updatedBill = await api.bill(token, activeClaim.bill.id);
        setActiveClaim((current) => current ? { ...current, bill: updatedBill } : null);
        if (updatedBill.claim_status !== "UNCLAIMED") void loadWorkspace();
      } catch (requestError) {
        handleError(requestError);
      }
    }, 2000);
    return () => window.clearInterval(interval);
  }, [activeClaim, token, loadWorkspace, handleError]);

  const createBill = async (billNumber: string, billAmount: string) => {
    if (!token || !restaurant) return;
    const created = await api.createBill(token, restaurant.id, billNumber, billAmount);
    setShowCreate(false);
    setActiveClaim(created);
    await loadWorkspace();
  };

  const refreshActiveClaim = async () => {
    if (!token || !activeClaim) return;
    const claim = await api.refreshClaim(token, activeClaim.bill.id);
    setActiveClaim({ ...activeClaim, claim, bill: { ...activeClaim.bill, claim_status: "UNCLAIMED" } });
    await loadWorkspace();
  };

  const metrics = useMemo(() => [
    { label: "Bills today", value: dashboard?.today_bills ?? 0, note: `${dashboard?.today_claimed_bills ?? 0} claimed`, icon: ReceiptText },
    { label: "Sales tracked", value: formatAed(dashboard?.today_sales_tracked ?? "0"), note: "Merchant bills", icon: CircleDollarSign },
    { label: "Rewards issued", value: formatAed(dashboard?.today_rewards_issued ?? "0"), note: "Verified by DinePanel", icon: Sparkles },
    { label: "Waiting to claim", value: dashboard?.today_unclaimed_bills ?? 0, note: "Live claim codes", icon: Users },
  ], [dashboard]);

  if (!token) return <Login onAuthenticated={setToken} />;
  if (loading || !profile || !restaurant) {
    return <div className="app-loader"><div className="brand"><span>D</span>DinePanel</div><LoaderCircle className="spin" size={28} /></div>;
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="brand brand--light"><span>D</span>DinePanel</div>
        <div className="restaurant-switcher"><span className="restaurant-avatar">GC</span><div><small>Restaurant</small><strong>{restaurant.name}</strong></div><ChevronDown size={16} /></div>
        <nav>
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><LayoutDashboard size={19} />Overview</button>
          <button className={view === "bills" ? "active" : ""} onClick={() => setView("bills")}><History size={19} />Bill history</button>
        </nav>
        <div className="sidebar-foot">
          <div className="staff-card"><span>{profile.user.name?.split(" ").map((word) => word[0]).slice(0, 2).join("") || "GM"}</span><div><strong>{profile.user.name || "Merchant"}</strong><small>{profile.memberships[0].role.toLowerCase()}</small></div></div>
          <button onClick={signOut}><LogOut size={18} />Sign out</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="mobile-header"><div className="brand"><span>D</span>DinePanel</div><button onClick={signOut}><LogOut size={19} /></button></header>
        {error && <div className="page-error">{error}<button onClick={() => setError("")}><X size={16} /></button></div>}
        <div className="page-header">
          <div><span className="eyebrow">{restaurant.name} · Dubai</span><h1>{view === "dashboard" ? "Good day, team." : "Bill history"}</h1><p>{view === "dashboard" ? "Here’s what’s happening in your dining room today." : "A clear record of every merchant-created reward claim."}</p></div>
          <button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={18} />Create bill</button>
        </div>

        <div className="mobile-nav"><button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>Overview</button><button className={view === "bills" ? "active" : ""} onClick={() => setView("bills")}>Bill history</button></div>

        {view === "dashboard" ? (
          <>
            <section className="metric-grid">
              {metrics.map((metric) => <article className="metric-card" key={metric.label}><span><metric.icon size={20} /></span><small>{metric.label}</small><strong>{metric.value}</strong><p>{metric.note}</p></article>)}
            </section>
            <section className="content-card">
              <div className="card-heading"><div><span className="eyebrow">Latest activity</span><h2>Recent bills</h2></div><button className="text-button" onClick={() => setView("bills")}>View all <ArrowRight size={15} /></button></div>
              <BillsTable bills={dashboard?.recent_bills ?? []} emptyCopy="Create your first bill to see it here." onSelect={setSelectedBill} />
            </section>
            <section className="support-strip"><span><Store size={20} /></span><div><strong>Need a hand?</strong><p>Your claim codes are secure, single-use, and active for ten minutes.</p></div><button className="text-button">Merchant guide <ArrowRight size={15} /></button></section>
          </>
        ) : (
          <section className="content-card content-card--history">
            <div className="filter-row">
              {(["ALL", "UNCLAIMED", "CLAIMED", "EXPIRED", "CANCELLED"] as const).map((filter) => (
                <button key={filter} className={statusFilter === filter ? "active" : ""} onClick={() => setStatusFilter(filter)}>{filter === "ALL" ? "All bills" : statusLabel[filter]}</button>
              ))}
            </div>
            <BillsTable bills={bills} emptyCopy="No bills match this filter." onSelect={setSelectedBill} />
          </section>
        )}
      </main>

      {showCreate && <CreateBillModal onClose={() => setShowCreate(false)} onCreate={createBill} />}
      {activeClaim && <ClaimModal token={activeClaim.claim} bill={activeClaim.bill} onClose={() => setActiveClaim(null)} onRefresh={refreshActiveClaim} />}
      {selectedBill && <BillDetailModal bill={selectedBill} onClose={() => setSelectedBill(null)} />}
    </div>
  );
}
