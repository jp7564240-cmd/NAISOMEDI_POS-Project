'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { defaultNavItems, type NavItem } from '../lib/defaultNavItems';
import { InvoiceReceiptDesigner } from '@/features/invoice-designer/components/InvoiceReceiptDesigner';
import { getConfiguredPassword, setConfiguredPassword } from '@/features/auth/lib/password.storage';
import { hasActiveSession, readTotpRecord, sessionUserKey } from '@/features/auth/lib/totp.storage';
import { verifyTotpCode } from '@/features/auth/lib/totp.client';
import { getProducts, getSales, formatPrice, getCategories, addProduct, deleteProduct, addSale, deleteCategory, deleteSale, type SaleRecord } from '@/lib/store';

export function PosShell() {
  const [items, setItems] = useState(defaultNavItems);
  const [active, setActive] = useState('home');
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!hasActiveSession()) {
      window.location.replace('/login');
      return;
    }
    const timer = window.setTimeout(async () => {
      if (!navigator.onLine) return;
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(1500) });
        if (response.ok) {
          const data = await response.json() as { version?: string };
          if (data.version && data.version !== '0.1.0') setUpdateAvailable(true);
        }
      } catch {}
    }, 2000);
    return () => window.clearTimeout(timer);
  }, []);

  const remove = (id: string) => setItems((current) => current.filter((item) => item.id !== id));
  const add = () => {
    const value = label.trim();
    if (!value) return;
    const id = value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setItems((current) => [...current, { id, label: value, icon: '•', route: id }]);
    setLabel('');
    setAdding(false);
  };

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="mark">✦</span><span>NaiSoMedi<small>ATELIER PHARMACIE</small></span></div>
      <nav className="nav">{items.map((item: NavItem) => <button className={active === item.route ? 'active' : ''} key={item.id} onClick={() => setActive(item.route)}><span>{item.icon} &nbsp; {item.label}</span>{!item.isSystem && <span className="delete" onClick={(event) => { event.stopPropagation(); remove(item.id); }}>×</span>}</button>)}</nav>
      <button className="secondary" onClick={() => setAdding(!adding)}>+ Add workspace</button>
      {adding && <div className="field"><input aria-label="Workspace name" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Workspace label" /><button className="primary" onClick={add}>Save</button></div>}
      <footer>Offline · encrypted local store<br />KES · VAT 16%</footer>
    </aside>
    <main className="main">
      <header className="top"><div><h1>Atelier Pharmacie</h1><p>Offline desktop point of sale</p></div><span className="chip">● Secure local session</span>{updateAvailable && <button className="chip" onClick={() => window.location.reload()}>Update ready · reload</button>}</header>
      {active === 'home' ? <Home /> : active === 'dashboard' ? <DashboardPage /> : active === 'settings' ? <SettingsPanel /> : active === 'designer' ? <InvoiceReceiptDesigner /> : active === 'pos' ? <PosTerminalPage /> : active === 'inventory' ? <InventoryPage /> : active === 'categories' ? <CategoriesPage /> : active === 'reports' ? <ReportsPage /> : <Placeholder name={items.find((item) => item.route === active)?.label ?? 'Workspace'} />}
    </main>
  </div>;
}

function Home() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: '#0f0f1a' }}>
      <iframe
        src="/legacy/HOME.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="NaiSoMedi Pharmacy OS"
      />
    </div>
  );
}

function SettingsPanel() {
  const record = readTotpRecord();
  const userKey = sessionUserKey() ?? 'admin';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cardOpen, setCardOpen] = useState(true);

  useEffect(() => {
    if (unlocked && record && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, record.otpauthUrl, { width: 176, margin: 2, color: { dark: '#1a0033', light: '#fff' } }).catch(() => setError('QR code could not be rendered.'));
    }
  }, [unlocked, record]);

  const unlock = (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== getConfiguredPassword(userKey)) { setError('Current password is invalid.'); return; }
    if (code && record && !verifyTotpCode(record.secret, code)) { setError('Authenticator code is invalid.'); return; }
    setError('');
    setUnlocked(true);
  };
  const changePassword = (event: React.FormEvent) => {
    event.preventDefault();
    if (nextPassword.length < 8 || nextPassword !== confirmPassword) { setError('Use at least 8 characters and make both passwords match.'); return; }
    setConfiguredPassword(userKey, nextPassword);
    setNextPassword('');
    setConfirmPassword('');
    setError('');
    setMessage('Password updated successfully.');
  };

  return <section className="screen"><span className="eyebrow">Security settings</span><h2>Settings</h2><p>Manage your TOTP two-factor authenticator and password.</p><div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div className={`pw-card ${cardOpen ? 'open' : ''}`} style={{
      background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.02))',
      border: '1px solid rgba(255,255,255,.12)', borderRadius: 24, padding: 28,
      backdropFilter: 'blur(16px)', transition: '0.3s'
    }}>
      <div className="pw-card-header" onClick={() => setCardOpen(!cardOpen)} style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center',
          background: 'linear-gradient(135deg, rgba(147,51,234,.25), rgba(236,72,153,.25))',
          border: '1px solid rgba(255,255,255,.1)', fontSize: 22 }}>🔑</div>
        <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(90deg,#fff,#d8b4fe)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Password & Security</div>
        <span style={{ marginLeft: 'auto', transition: '0.3s', transform: cardOpen ? 'rotate(180deg)' : 'none', fontSize: 18, color: 'rgba(255,255,255,.4)' }}>▼</span>
      </div>
      {cardOpen && <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.08)' }}>
        {!record ? <div><p>No authenticator registered.</p><button className="primary" onClick={() => window.location.replace('/auth/enroll')}>Register authenticator</button></div> :
          !unlocked ? <form onSubmit={unlock} style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
            <p style={{fontSize: 13, color: 'rgba(255,255,255,.6)'}}>Enter your password to reveal your QR code, manual secret, and change your password.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={{ display: 'grid', gap: 6, color: 'rgba(255,255,255,.72)', fontSize: 12 }}>Current password
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" style={{ padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'white' }} />
              </label>
              <label style={{ display: 'grid', gap: 6, color: 'rgba(255,255,255,.72)', fontSize: 12 }}>Authenticator code (optional)
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="\\d{0,6}" maxLength={6} autoComplete="one-time-code" style={{ padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'white' }} />
              </label>
            </div>
            {error && <p style={{ color: '#fca5a5', fontSize: 13, background: 'rgba(239,68,68,.15)', padding: '10px 14px', borderRadius: 10 }}>{error}</p>}
            <button className="primary" type="submit" style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg, #9333EA, #EC4899)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Unlock Settings</button>
          </form> : <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Authenticator Credentials</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'center', marginBottom: 20 }}>
              <div style={{ background: '#fff', padding: 12, borderRadius: 16, display: 'grid', placeItems: 'center', boxShadow: '0 0 30px rgba(147,51,234,.3)' }}>
                <canvas ref={canvasRef} width="176" height="176" style={{ width: 176, height: 176, display: 'block' }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Manual secret key</p>
                <code style={{ fontSize: 16, fontWeight: 800, letterSpacing: 2, color: '#d8b4fe', background: 'rgba(0,0,0,.4)', padding: '10px 16px', borderRadius: 10, display: 'inline-block', userSelect: 'all' }}>{record.secret}</code>
                <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, marginTop: 10 }}>Scan with Google Authenticator or Microsoft Authenticator.</p>
              </div>
            </div>
            <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.08)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Change Password</h3>
              <form onSubmit={changePassword} style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <label style={{ display: 'grid', gap: 6, color: 'rgba(255,255,255,.72)', fontSize: 12 }}>New password
                    <input type="password" minLength={8} value={nextPassword} onChange={(e) => setNextPassword(e.target.value)} required autoComplete="new-password" style={{ padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'white' }} />
                  </label>
                  <label style={{ display: 'grid', gap: 6, color: 'rgba(255,255,255,.72)', fontSize: 12 }}>Confirm new password
                    <input type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" style={{ padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'white' }} />
                  </label>
                </div>
                {message && <p style={{ color: '#86efac', fontSize: 13 }}>{message}</p>}
                <button className="primary" type="submit" style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg, #9333EA, #EC4899)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Save new password</button>
              </form>
            </div>
            <button className="primary" onClick={() => { setUnlocked(false); setPassword(''); setCode(''); setMessage(''); }} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.8)', cursor: 'pointer', marginTop: 20 }}>🔒 Lock Credentials</button>
          </div>}
      </div>}
    </div>
  </div><style jsx>{`.pw-card.open .pw-card-arrow { transform: rotate(180deg) }`}</style></section>;
}

function DashboardPage() {
  const products = getProducts();
  const sales = getSales();
  const totalRev = sales.reduce((s, r) => s + r.total, 0);
  const lowStock = products.filter(p => p.stock < 30);
  return <section className="screen" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div className="hero" style={{ marginBottom: 28, flexShrink: 0 }}>
      <span className="eyebrow">Workspace Hub</span>
      <h2 style={{ fontSize: 42, lineHeight: 1.06, maxWidth: 650, margin: '13px 0' }}>Dashboard <em style={{ fontStyle: 'normal', background: 'linear-gradient(90deg,#9333EA,#EC4899)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Pro</em></h2>
      <p>Quick-access tools and real-time overview.</p>
    </div>
    
    <div style={{ flex: 1, overflowY: 'auto', paddingRight: 10, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
        <div className="dash-card" style={{
          background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '24px 20px', textAlign: 'center',
          backdropFilter: 'blur(12px)', transition: '0.3s', cursor: 'default'
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', fontSize: 28, margin: '0 auto 12px', background: 'linear-gradient(135deg, rgba(147,51,234,.25), rgba(236,72,153,.25))' }}>📊</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#d8b4fe' }}>{formatPrice(totalRev)}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Total Revenue</div>
        </div>
        <div className="dash-card" style={{
          background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '24px 20px', textAlign: 'center',
          backdropFilter: 'blur(12px)', transition: '0.3s', cursor: 'default'
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', fontSize: 28, margin: '0 auto 12px', background: 'linear-gradient(135deg, rgba(34,197,94,.25), rgba(34,197,94,.15))' }}>📦</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#86efac' }}>{products.length}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Products</div>
        </div>
        <div className="dash-card" style={{
          background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '24px 20px', textAlign: 'center',
          backdropFilter: 'blur(12px)', transition: '0.3s', cursor: 'default'
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', fontSize: 28, margin: '0 auto 12px', background: 'linear-gradient(135deg, rgba(239,68,68,.25), rgba(239,68,68,.15))' }}>⚠️</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fca5a5' }}>{lowStock.length}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Low Stock Alerts</div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 24, padding: '24px' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{fontSize: 22}}>💬</span> Messaging & Communication Apps
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
          <a className="dash-card" href="mailto:" target="_blank" rel="noopener" onClick={(e) => { e.currentTarget.href = 'https://outlook.live.com'; setTimeout(() => e.currentTarget.href = 'mailto:', 100); }} style={{
            background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '16px 12px', textAlign: 'center',
            transition: '0.3s', cursor: 'pointer', textDecoration: 'none', color: 'white'
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 22, margin: '0 auto 8px', background: 'linear-gradient(135deg,#0078d4,#50a9e8)' }}>📧</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Outlook</div>
          </a>
          <a className="dash-card" href="whatsapp://send?text=" target="_blank" rel="noopener" onClick={(e) => { e.currentTarget.href = 'https://web.whatsapp.com'; setTimeout(() => e.currentTarget.href = 'whatsapp://send?text=', 100); }} style={{
            background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '16px 12px', textAlign: 'center',
            transition: '0.3s', cursor: 'pointer', textDecoration: 'none', color: 'white'
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 22, margin: '0 auto 8px', background: 'linear-gradient(135deg,#25D366,#128C7e)' }}>💬</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>WhatsApp</div>
          </a>
          <a className="dash-card" href="https://mail.google.com" target="_blank" rel="noopener" style={{
            background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '16px 12px', textAlign: 'center',
            transition: '0.3s', cursor: 'pointer', textDecoration: 'none', color: 'white'
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 22, margin: '0 auto 8px', background: 'linear-gradient(135deg,#EA4335,#FBBC05)' }}>📬</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Gmail</div>
          </a>
          <a className="dash-card" href="msteams://" target="_blank" rel="noopener" onClick={(e) => { e.currentTarget.href = 'https://teams.microsoft.com'; setTimeout(() => e.currentTarget.href = 'msteams://', 100); }} style={{
            background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '16px 12px', textAlign: 'center',
            transition: '0.3s', cursor: 'pointer', textDecoration: 'none', color: 'white'
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 22, margin: '0 auto 8px', background: 'linear-gradient(135deg,#6264A7,#8B8CC7)' }}>👥</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Teams</div>
          </a>
          <a className="dash-card" href="zoommtg://zoom.us/" target="_blank" rel="noopener" onClick={(e) => { e.currentTarget.href = 'https://zoom.us'; setTimeout(() => e.currentTarget.href = 'zoommtg://zoom.us/', 100); }} style={{
            background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '16px 12px', textAlign: 'center',
            transition: '0.3s', cursor: 'pointer', textDecoration: 'none', color: 'white'
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 22, margin: '0 auto 8px', background: 'linear-gradient(135deg,#2D8CFF,#0B5ED7)' }}>🎥</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Zoom</div>
          </a>
        </div>
      </div>
    </div>
  </section>;
}

function InventoryPage() {
  const [products, setProducts] = useState(getProducts());
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState(''); const [price, setPrice] = useState(''); const [stock, setStock] = useState('');
  const [cat, setCat] = useState(''); const [expiry, setExpiry] = useState(''); const [supplier, setSupplier] = useState('');
  const [currency, setCurrency] = useState('KSH');
  const [image, setImage] = useState('');
  const categories = getCategories();
  const refresh = () => { setProducts([...getProducts()]); setAdding(false); resetForm(); };
  const resetForm = () => { setName(''); setPrice(''); setStock(''); setCat(categories[0]?.name || ''); setExpiry(''); setSupplier(''); setCurrency('KSH'); setImage(''); };
  const handleAdd = () => {
    if (!name) return;
    addProduct({ name, cat: cat || categories[0]?.name || 'General', price: parseFloat(price) || 0, currency, stock: parseInt(stock) || 0, expiry, supplier, image: image || '' });
    refresh();
  };
  const handleDelete = (id: number) => {
    if (!confirm('Delete this product?')) return;
    deleteProduct(id);
    refresh();
  };
  return <section className="screen"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
    <div><span className="eyebrow">Products</span><h2 style={{ fontSize: 28, fontWeight: 800, margin: '4px 0' }}>Inventory</h2></div>
    <button className="primary" onClick={() => setAdding(true)}>+ Add Product</button>
  </div>
  {adding && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, padding: 20, border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, marginBottom: 20, background: 'rgba(255,255,255,.03)' }}>
    <div style={{ display: 'grid', gap: 6 }}><label style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase' }}>Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Product name" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'white' }} /></div>
    <div style={{ display: 'grid', gap: 6 }}><label style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase' }}>Category</label><select value={cat} onChange={e => setCat(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'white' }}>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
    <div style={{ display: 'grid', gap: 6 }}><label style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase' }}>Currency</label><select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'white' }}><option>KSH</option><option>USD</option><option>EUR</option><option>GBP</option></select></div>
    <div style={{ display: 'grid', gap: 6 }}><label style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase' }}>Price</label><input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'white' }} /></div>
    <div style={{ display: 'grid', gap: 6 }}><label style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase' }}>Stock</label><input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'white' }} /></div>
    <div style={{ display: 'grid', gap: 6 }}><label style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase' }}>Expiry</label><input type="month" value={expiry} onChange={e => setExpiry(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'white' }} /></div>
    <div style={{ display: 'grid', gap: 6 }}><label style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase' }}>Supplier</label><input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'white' }} /></div>
    <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button onClick={refresh} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: 'white', cursor: 'pointer' }}>Cancel</button><button onClick={handleAdd} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg,#9333EA,#EC4899)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Save Product</button></div>
  </div>}
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
    {products.map(p => <div key={p.id} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, overflow: 'hidden', position: 'relative', transition: '0.3s' }}>
      <button onClick={() => handleDelete(p.id)} style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 10, border: 'none', background: 'rgba(239,68,68,.2)', color: '#ef4444', cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center', opacity: 0.7 }}>×</button>
      {p.image && <img src={p.image} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', background: '#0b0714' }} />}
      <div style={{ padding: 14 }}><div style={{ fontWeight: 650, fontSize: 14, marginBottom: 6 }}>{p.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,.5)' }}><span>{p.cat}</span><span style={{ color: '#f9a8d4', fontWeight: 750 }}>{formatPrice(p.price)}</span></div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 6 }}>Stock: {p.stock}</div></div>
    </div>)}
  </div></section>;
}

function CategoriesPage() {
  const [cats, setCats] = useState(getCategories());
  const refresh = () => setCats([...getCategories()]);
  const handleDelete = (id: number) => {
    if (!confirm('Delete this category?')) return;
    deleteCategory(id);
    refresh();
  };
  const products = getProducts();
  return <section className="screen"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
    <div><span className="eyebrow">Browse</span><h2 style={{ fontSize: 28, fontWeight: 800, margin: '4px 0' }}>Categories</h2></div>
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
    {cats.map(c => { const count = products.filter(p => p.cat === c.name).length;
    return <div key={c.id} style={{ position: 'relative', height: 180, borderRadius: 24, overflow: 'hidden', cursor: 'pointer', background: '#130b24', border: '1px solid rgba(255,255,255,.08)', transition: '0.3s' }}>
      <button onClick={() => handleDelete(c.id)} style={{ position: 'absolute', top: 10, right: 10, zIndex: 5, width: 30, height: 30, borderRadius: 10, border: 'none', background: 'rgba(239,68,68,.2)', color: '#ef4444', cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center' }}>×</button>
      {c.image && <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '18px 18px 16px', zIndex: 2, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,.75) 85%)' }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, textShadow: '0 2px 10px rgba(0,0,0,.6)' }}>{c.name}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', padding: '4px 8px', borderRadius: 999, background: 'rgba(0,0,0,.35)', display: 'inline-block' }}>● {count} product{count !== 1 ? 's' : ''}</div>
      </div>
    </div>})}
  </div></section>;
}

function PosTerminalPage() {
  const [posProducts] = useState(getProducts());
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Array<{id: number; name: string; price: number; qty: number}>>([]);
  const [lastOrder, setLastOrder] = useState<SaleRecord | null>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const filtered = posProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.cat.toLowerCase().includes(search.toLowerCase()));
  const addToCart = (p: {id: number; name: string; price: number}) => {
    setCart(prev => { const ex = prev.find(i => i.id === p.id); if (ex) { ex.qty = Math.min(ex.qty + 1, 10); return [...prev] } return [...prev, { ...p, qty: 1 }] });
  };
  const updateQty = (id: number, qty: number) => { if (qty < 1) { setCart(prev => prev.filter(i => i.id !== id)); return } setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.min(qty, 10) } : i)) };
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const handlePrintDownload = (sale: SaleRecord, download: boolean) => {
    const invoiceId = 'INV-' + sale.id.toString(36).toUpperCase();
    const iframe = printFrameRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'NAISOMEDI_PRINT_INVOICE',
        payload: { sale, invoiceId, download }
      }, '*');
    }
  };
  const printInvoice = (sale: SaleRecord) => handlePrintDownload(sale, false);
  const downloadInvoice = (sale: SaleRecord) => handlePrintDownload(sale, true);
  const checkout = () => {
    if (!cart.length) return;
    const saleItems = cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.qty, image: '' }));
    const sale = addSale(saleItems, total, 'Cash');
    setLastOrder(sale);
    setCart([]);
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); document.getElementById('pos-search')?.focus() } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  return <section className="screen" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, height: 'calc(100vh - 160px)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input id="pos-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search products (Ctrl+F)..." style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: 'white', fontSize: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, overflow: 'auto', flex: 1, padding: '4px 0' }}>
        {filtered.map(p => <div key={p.id} onClick={() => addToCart(p)} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: '0.2s' }}>
          {p.image && <img src={p.image} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />}
          <div style={{ padding: 10 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div><div style={{ color: '#f9a8d4', fontWeight: 700, fontSize: 14 }}>{formatPrice(p.price)}</div></div>
        </div>)}
      </div>
    </div>
    <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700 }}>Cart ({cart.length})</h3>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cart.map(i => <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,.04)', borderRadius: 12 }}>
          <div style={{ flex: 1, fontSize: 13 }}>{i.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><button onClick={() => updateQty(i.id, i.qty - 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.05)', color: 'white', cursor: 'pointer' }}>−</button><span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{i.qty}</span><button onClick={() => updateQty(i.id, i.qty + 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.05)', color: 'white', cursor: 'pointer' }}>+</button></div>
          <div style={{ color: '#f9a8d4', fontWeight: 700, fontSize: 13 }}>{formatPrice(i.price * i.qty)}</div>
        </div>)}
        {!cart.length && <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,.3)' }}>Click products to add</div>}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, marginBottom: 12 }}><span>Total</span><span>{formatPrice(total)}</span></div>
        <button onClick={checkout} style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: 'linear-gradient(90deg,#9333EA,#EC4899)', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Checkout</button>
        {cart.length > 0 && <button onClick={() => setCart([])} style={{ width: '100%', padding: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.7)', cursor: 'pointer', marginTop: 8 }}>Clear Cart</button>}
      </div>
    </div>
    <iframe ref={printFrameRef} src="/legacy/Naisomedi-Luxe-Designer.html" style={{ position: 'absolute', width: 0, height: 0, border: 'none', opacity: 0 }} title="Print Frame" />
    {lastOrder && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'grid', placeItems: 'center', zIndex: 1000 }} onClick={() => setLastOrder(null)}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,.15)', borderRadius: 24, padding: 32, maxWidth: 420, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
        <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Order Placed!</h3>
        <p style={{ color: 'rgba(255,255,255,.6)', margin: '0 0 20px', fontSize: 14 }}>Invoice #{lastOrder.id}</p>
        <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 14, padding: 16, marginBottom: 20, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>Items</span><span>{lastOrder.items.length}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>Payment</span><span>{lastOrder.paymentMethod}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 8 }}><span>Total</span><span>{formatPrice(lastOrder.total)}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { printInvoice(lastOrder); setLastOrder(null) }} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(90deg,#9333EA,#EC4899)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>🖨 Print Invoice</button>
          <button onClick={() => { downloadInvoice(lastOrder); setLastOrder(null) }} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>⬇ Download Invoice</button>
        </div>
        <button onClick={() => setLastOrder(null)} style={{ marginTop: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 13 }}>Continue Shopping</button>
      </div>
    </div>}
  </section>;
}

function ReportsPage() {
  const [sales, setSales] = useState(getSales());
  const refresh = () => setSales([...getSales()]);
  const handleDelete = (id: number) => { if (!confirm('Delete this sale?')) return; deleteSale(id); refresh() };
  const totalRevenue = sales.reduce((s, r) => s + r.total, 0);
  const printReport = () => { const w = window.open('', '_blank'); if (!w) return; w.document.write(`<html><head><title>Sales Report</title><style>body{font-family:Arial;padding:40px}table{width:100%;border-collapse:collapse}th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}th{background:#f5f5f5}</style></head><body><h1>NaiSoMedi Sales Report</h1><p>${new Date().toLocaleString()}</p><table><tr><th>#</th><th>Items</th><th>Total</th><th>Date</th></tr>${sales.map((s,i)=>`<tr><td>${sales.length-i}</td><td>${s.items.map(it=>it.name+' x'+it.quantity).join(', ')}</td><td>${formatPrice(s.total)}</td><td>${new Date(s.timestamp).toLocaleDateString()}</td></tr>`).join('')}</table><p>Total: ${formatPrice(totalRevenue)}</p></body></html>`); w.document.close(); setTimeout(() => w.print(), 500) };
  const downloadReport = () => { let csv = 'Date,Items,Total\n'; sales.forEach(s => csv += `${new Date(s.timestamp).toLocaleDateString()},"${s.items.map(it=>it.name+' x'+it.quantity).join(', ')}",${s.total}\n`); const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sales_report.csv'; a.click(); URL.revokeObjectURL(a.href) };
  return <section className="screen"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
    <div><span className="eyebrow">Analytics</span><h2 style={{ fontSize: 28, fontWeight: 800, margin: '4px 0' }}>Sales Reports</h2></div>
    <div style={{ display: 'flex', gap: 8 }}><button className="primary" onClick={printReport}>🖨 Print</button><button className="primary" onClick={downloadReport}>⬇ Download</button></div>
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
    <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: 22 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📊 Overview</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}><div style={{ background: 'rgba(147,51,234,.1)', borderRadius: 14, padding: 16, textAlign: 'center' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>Orders</div><div style={{ fontSize: 28, fontWeight: 800, color: '#d8b4fe' }}>{sales.length}</div></div><div style={{ background: 'rgba(236,72,153,.1)', borderRadius: 14, padding: 16, textAlign: 'center' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>Revenue</div><div style={{ fontSize: 28, fontWeight: 800, color: '#f9a8d4' }}>{formatPrice(totalRevenue)}</div></div><div style={{ background: 'rgba(34,197,94,.1)', borderRadius: 14, padding: 16, textAlign: 'center' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>Avg</div><div style={{ fontSize: 28, fontWeight: 800, color: '#86efac' }}>{sales.length ? formatPrice(totalRevenue / sales.length) : 'KSH 0'}</div></div></div>
    </div>
    <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: 22 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📈 Weekly Trend</h3>
      {(function() { const weekAgo = Date.now() - 7 * 86400000; const weekSales = sales.filter(s => s.timestamp > weekAgo); const dayTotals: Record<string, number> = {}; for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000); dayTotals[d.toLocaleDateString('en', { weekday: 'short' })] = 0 } weekSales.forEach(s => { const d = new Date(s.timestamp).toLocaleDateString('en', { weekday: 'short' }); if (dayTotals[d] !== undefined) dayTotals[d] += s.total }); const maxDay = Math.max(...Object.values(dayTotals), 1); return <div style={{ display: 'flex', alignItems: 'end', gap: 8, height: 100, padding: '10px 0' }}>{Object.entries(dayTotals).map(([day, tot]) => <div key={day} style={{ flex: 1, borderRadius: '6px 6px 0 0', background: 'linear-gradient(180deg, #9333EA, #EC4899)', height: Math.max(4, (tot / maxDay) * 100) + '%', position: 'relative', transition: '0.3s' }}><div style={{ position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'rgba(255,255,255,.5)', whiteSpace: 'nowrap' }}>{day}</div></div>)}</div> })()}
    </div>
  </div>
  <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: 22 }}>
    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📋 Order History</h3>
    {sales.length ? <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr>{['#', 'Items', 'Total', 'Payment', 'Date', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead><tbody>{sales.map((s, i) => <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}><td style={{ padding: '10px 8px' }}>{sales.length - i}</td><td style={{ padding: '10px 8px' }}>{s.items.map(it => it.name + ' x' + it.quantity).join(', ')}</td><td style={{ padding: '10px 8px' }}>{formatPrice(s.total)}</td><td style={{ padding: '10px 8px' }}>{s.paymentMethod}</td><td style={{ padding: '10px 8px' }}>{new Date(s.timestamp).toLocaleDateString()}</td><td style={{ padding: '10px 8px' }}><button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>×</button></td></tr>)}</tbody></table> : <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,.4)' }}>No sales recorded yet.</div>}
  </div></section>;
}

function Placeholder({ name }: { name: string }) { return <section className="screen"><span className="eyebrow">{name}</span><h2>{name} workspace</h2><p>This workspace is served natively without an embedded legacy login or home document.</p><div className="notice">Offline encrypted local session active.</div></section>; }
