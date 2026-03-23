import { useState, useEffect, useRef } from "react";

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const SALLES = [
  { id: "grande", nom: "La Grande", capaciteAssise: 60, capaciteDebout: 80, couleur: "#c8a96e" },
  { id: "petite", nom: "La Petite", capaciteAssise: 20, capaciteDebout: 30, couleur: "#8fad88" },
  { id: "combinee", nom: "Grande + Petite", capaciteAssise: 80, capaciteDebout: 110, couleur: "#b07db0" },
];

const STATUTS_REZ = [
  { id: "attente", label: "En attente", color: "#e8b84b" },
  { id: "confirmee", label: "Confirmée", color: "#5aaa6e" },
  { id: "annulee", label: "Annulée", color: "#d9534f" },
  { id: "terminee", label: "Terminée", color: "#888" },
];

const STATUTS_DEVIS = [
  { id: "envoye", label: "Devis envoyé", color: "#6ab0de" },
  { id: "attente", label: "En attente", color: "#e8b84b" },
  { id: "accepte", label: "Accepté", color: "#5aaa6e" },
  { id: "refuse", label: "Refusé / Perdu", color: "#d9534f" },
];

const TYPES_EV = [
  { id: "privatisation", label: "Privatisation" },
  { id: "evenement", label: "Événement spécial" },
  { id: "groupe", label: "Groupe" },
];

const CRENEAUX = [
  { id: "dejeuner", label: "Déjeuner", heure: "12:00 – 14:00" },
  { id: "diner", label: "Dîner", heure: "19:00 – 22:00" },
  { id: "journee", label: "Journée entière", heure: "09:00 – 23:00" },
  { id: "libre", label: "Horaires libres", heure: "" },
];

const CATEGORIES_PLATS = [
  { id: "amuse", label: "Amuse-bouche", emoji: "🥄" },
  { id: "entree", label: "Entrée", emoji: "🥗" },
  { id: "plat", label: "Plat", emoji: "🍽️" },
  { id: "fromage", label: "Fromage", emoji: "🧀" },
  { id: "dessert", label: "Dessert", emoji: "🍮" },
  { id: "boisson", label: "Boisson", emoji: "🍷" },
];

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const TVA = 0.20;

function genId() { return Math.random().toString(36).substr(2, 9); }
function formatDate(d) { if (!d) return ""; const [y,m,j] = d.split("-"); return `${j}/${m}/${y}`; }
function today() { return new Date().toISOString().split("T")[0]; }
function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
  const monday = new Date(d); monday.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => { const dd = new Date(monday); dd.setDate(monday.getDate() + i); return dd.toISOString().split("T")[0]; });
}
function numDevis(n) { return `DEV-${String(n).padStart(4, "0")}`; }

const emptyRez = { client: "", telephone: "", email: "", salleId: "grande", type: "privatisation", creneau: "diner", heureDebut: "", heureFin: "", date: "", nbPersonnes: "", configuration: "assise", tarif: "", statut: "attente", notes: "" };
const emptyDevis = { numero: 1, client: "", telephone: "", email: "", entreprise: "", salleId: "grande", type: "privatisation", creneau: "diner", date: "", dateEvenement: "", nbPersonnes: "", configuration: "assise", statut: "attente", notes: "", lignes: [], acompte: "", validite: 30 };

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: "'Cormorant Garamond', Georgia, serif", background: "#0f0b06", minHeight: "100vh", color: "#f0e6d0", display: "flex" },
  sidebar: { width: 230, background: "#0a0704", borderRight: "1px solid #2a2010", display: "flex", flexDirection: "column", padding: "28px 0", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100, overflowY: "auto" },
  logo: { padding: "0 20px 24px", borderBottom: "1px solid #2a2010", marginBottom: 20 },
  logoTitle: { fontSize: 17, fontWeight: 700, color: "#c8a96e", letterSpacing: "0.04em", lineHeight: 1.3 },
  logoSub: { fontSize: 10, color: "#5a4a30", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 4 },
  navSection: { padding: "8px 20px 4px", fontSize: 9, color: "#3a2e1a", textTransform: "uppercase", letterSpacing: "0.2em" },
  navBtn: (a) => ({ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: a ? "#1e1508" : "transparent", border: "none", borderLeft: a ? "3px solid #c8a96e" : "3px solid transparent", color: a ? "#c8a96e" : "#7a6a50", fontSize: 13, cursor: "pointer", textAlign: "left", letterSpacing: "0.02em", transition: "all 0.15s", fontFamily: "inherit", width: "100%" }),
  main: { marginLeft: 230, padding: "36px 44px", minHeight: "100vh", flex: 1 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 },
  pageTitle: { fontSize: 28, fontWeight: 700, color: "#c8a96e", letterSpacing: "0.02em" },
  btn: (c="#c8a96e", bg=false) => ({ background: bg || c, color: bg ? c : "#0f0b06", border: `1px solid ${c}`, padding: "10px 24px", borderRadius: 3, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "inherit", transition: "all 0.15s" }),
  btnSm: (c="#c8a96e") => ({ background: "transparent", color: c, border: `1px solid ${c}44`, padding: "5px 14px", borderRadius: 3, fontSize: 11, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em" }),
  card: (border="#2a2010") => ({ background: "#161008", border: `1px solid ${border}`, borderRadius: 6, padding: 24 }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 },
  label: { display: "block", fontSize: 10, color: "#5a4a30", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 5 },
  input: { width: "100%", background: "#0a0704", border: "1px solid #2a2010", borderRadius: 3, padding: "9px 11px", color: "#f0e6d0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" },
  select: { width: "100%", background: "#0a0704", border: "1px solid #2a2010", borderRadius: 3, padding: "9px 11px", color: "#f0e6d0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" },
  textarea: { width: "100%", background: "#0a0704", border: "1px solid #2a2010", borderRadius: 3, padding: "9px 11px", color: "#f0e6d0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", minHeight: 72, outline: "none" },
  modal: { position: "fixed", inset: 0, background: "#000000dd", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modalBox: (w=640) => ({ background: "#120e07", border: "1px solid #2a2010", borderRadius: 8, padding: 36, width: w, maxWidth: "95vw", maxHeight: "92vh", overflowY: "auto" }),
  modalTitle: { fontSize: 22, color: "#c8a96e", marginBottom: 24, fontWeight: 700 },
  badge: (color) => ({ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + "22", color: color, border: `1px solid ${color}44` }),
  th: { textAlign: "left", padding: "10px 14px", fontSize: 10, color: "#5a4a30", textTransform: "uppercase", letterSpacing: "0.12em", borderBottom: "1px solid #2a2010" },
  td: { padding: "12px 14px", borderBottom: "1px solid #1a1208", fontSize: 13, verticalAlign: "middle" },
  iconBtn: { background: "transparent", border: "none", cursor: "pointer", padding: "3px 7px", fontSize: 15, color: "#5a4a30", fontFamily: "inherit" },
  divider: { border: "none", borderTop: "1px solid #2a2010", margin: "20px 0" },
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const load = (k, def) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : def; } catch { return def; } };
  const [reservations, setReservations] = useState(() => load("fdch_rez", []));
  const [devis, setDevis] = useState(() => load("fdch_devis", []));
  const [plats, setPlats] = useState(() => load("fdch_plats", []));
  const [menus, setMenus] = useState(() => load("fdch_menus", []));
  const [infos, setInfos] = useState(() => load("fdch_infos", { nom: "La Folie des Champs", adresse: "", telephone: "", email: "", siret: "" }));

  const [vue, setVue] = useState("dashboard");
  const [modal, setModal] = useState(null); // "rez"|"devis"|"plat"|"menu"|"devis-detail"|"infos"|"convert"
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [semaine, setSemaine] = useState(today());
  const [filterStatutRez, setFilterStatutRez] = useState("tous");
  const [filterStatutDevis, setFilterStatutDevis] = useState("tous");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [convertDevisId, setConvertDevisId] = useState(null);

  useEffect(() => { localStorage.setItem("fdch_rez", JSON.stringify(reservations)); }, [reservations]);
  useEffect(() => { localStorage.setItem("fdch_devis", JSON.stringify(devis)); }, [devis]);
  useEffect(() => { localStorage.setItem("fdch_plats", JSON.stringify(plats)); }, [plats]);
  useEffect(() => { localStorage.setItem("fdch_menus", JSON.stringify(menus)); }, [menus]);
  useEffect(() => { localStorage.setItem("fdch_infos", JSON.stringify(infos)); }, [infos]);

  // helpers
  const getSalle = (id) => SALLES.find(s => s.id === id);
  const getStatutRez = (id) => STATUTS_REZ.find(s => s.id === id);
  const getStatutDevis = (id) => STATUTS_DEVIS.find(s => s.id === id);

  // next devis number
  const nextNum = () => devis.length === 0 ? 1 : Math.max(...devis.map(d => d.numero || 1)) + 1;

  // ── RESERVATIONS ────────────────────────────────────────────────────────────
  const openNewRez = () => { setForm({ ...emptyRez }); setEditId(null); setModal("rez"); };
  const openEditRez = (r) => { setForm({ ...r }); setEditId(r.id); setModal("rez"); };
  const saveRez = () => {
    if (!form.client || !form.date || !form.nbPersonnes) return;
    if (editId) setReservations(p => p.map(r => r.id === editId ? { ...form, id: editId } : r));
    else setReservations(p => [...p, { ...form, id: genId() }]);
    setModal(null);
  };

  // ── DEVIS ───────────────────────────────────────────────────────────────────
  const openNewDevis = () => { setForm({ ...emptyDevis, numero: nextNum(), lignes: [] }); setEditId(null); setModal("devis"); };
  const openEditDevis = (d) => { setForm({ ...d }); setEditId(d.id); setModal("devis"); };
  const openViewDevis = (d) => { setForm({ ...d }); setEditId(d.id); setModal("devis-detail"); };
  const saveDevis = () => {
    if (!form.client || !form.dateEvenement) return;
    if (editId) setDevis(p => p.map(d => d.id === editId ? { ...form, id: editId } : d));
    else setDevis(p => [...p, { ...form, id: genId() }]);
    setModal(null);
  };
  const convertirDevis = (devisItem) => {
    const r = {
      ...emptyRez,
      id: genId(),
      client: devisItem.client,
      telephone: devisItem.telephone,
      email: devisItem.email,
      salleId: devisItem.salleId,
      type: devisItem.type,
      creneau: devisItem.creneau,
      date: devisItem.dateEvenement,
      nbPersonnes: devisItem.nbPersonnes,
      configuration: devisItem.configuration,
      tarif: totalTTC(devisItem.lignes).toFixed(2),
      statut: "confirmee",
      notes: `Converti depuis ${numDevis(devisItem.numero)}`,
    };
    setReservations(p => [...p, r]);
    setDevis(p => p.map(d => d.id === devisItem.id ? { ...d, statut: "accepte" } : d));
    setModal(null);
    setVue("liste");
  };

  // ── LIGNES DEVIS ─────────────────────────────────────────────────────────────
  const addLigne = (type) => {
    const newLigne = { id: genId(), type, platId: "", menuId: "", libelle: "", prixHT: "", qte: 1, description: "" };
    setForm(f => ({ ...f, lignes: [...(f.lignes || []), newLigne] }));
  };
  const updateLigne = (id, key, val) => {
    setForm(f => ({ ...f, lignes: f.lignes.map(l => l.id === id ? { ...l, [key]: val } : l) }));
  };
  const removeLigne = (id) => {
    setForm(f => ({ ...f, lignes: f.lignes.filter(l => l.id !== id) }));
  };
  const selectPlatForLigne = (ligneId, platId) => {
    const p = plats.find(p => p.id === platId);
    if (!p) return;
    setForm(f => ({ ...f, lignes: f.lignes.map(l => l.id === ligneId ? { ...l, platId, libelle: p.nom, prixHT: p.prixHT, description: p.description || "" } : l) }));
  };
  const selectMenuForLigne = (ligneId, menuId) => {
    const m = menus.find(m => m.id === menuId);
    if (!m) return;
    const prix = totalMenuHT(m);
    setForm(f => ({ ...f, lignes: f.lignes.map(l => l.id === ligneId ? { ...l, menuId, libelle: m.nom, prixHT: prix.toFixed(2), description: m.description || "" } : l) }));
  };

  // ── PLATS ───────────────────────────────────────────────────────────────────
  const openNewPlat = () => { setForm({ nom: "", categorie: "entree", prixHT: "", description: "", allergenes: "" }); setEditId(null); setModal("plat"); };
  const openEditPlat = (p) => { setForm({ ...p }); setEditId(p.id); setModal("plat"); };
  const savePlat = () => {
    if (!form.nom || !form.prixHT) return;
    if (editId) setPlats(p => p.map(x => x.id === editId ? { ...form, id: editId } : x));
    else setPlats(p => [...p, { ...form, id: genId() }]);
    setModal(null);
  };

  // ── MENUS ───────────────────────────────────────────────────────────────────
  const openNewMenu = () => { setForm({ nom: "", description: "", platIds: [] }); setEditId(null); setModal("menu"); };
  const openEditMenu = (m) => { setForm({ ...m }); setEditId(m.id); setModal("menu"); };
  const saveMenu = () => {
    if (!form.nom) return;
    if (editId) setMenus(p => p.map(x => x.id === editId ? { ...form, id: editId } : x));
    else setMenus(p => [...p, { ...form, id: genId() }]);
    setModal(null);
  };
  const togglePlatInMenu = (platId) => {
    setForm(f => {
      const ids = f.platIds || [];
      return { ...f, platIds: ids.includes(platId) ? ids.filter(i => i !== platId) : [...ids, platId] };
    });
  };

  // ── CALCULS ─────────────────────────────────────────────────────────────────
  const totalMenuHT = (menu) => {
    if (!menu || !menu.platIds) return 0;
    return menu.platIds.reduce((acc, pid) => { const p = plats.find(p => p.id === pid); return acc + (p ? parseFloat(p.prixHT || 0) : 0); }, 0);
  };
  const ligneHT = (l) => parseFloat(l.prixHT || 0) * parseInt(l.qte || 1);
  const totalHT = (lignes) => (lignes || []).reduce((acc, l) => acc + ligneHT(l), 0);
  const totalTVA = (lignes) => totalHT(lignes) * TVA;
  const totalTTC = (lignes) => totalHT(lignes) * (1 + TVA);

  // ── STATS ────────────────────────────────────────────────────────────────────
  const todayStr = today();
  const aVenir = reservations.filter(r => r.date >= todayStr && r.statut !== "annulee").sort((a, b) => new Date(a.date) - new Date(b.date));
  const caConfirme = reservations.filter(r => r.statut === "confirmee" && r.tarif).reduce((acc, r) => acc + parseFloat(r.tarif || 0), 0);
  const devisEnCours = devis.filter(d => d.statut === "attente" || d.statut === "envoye");
  const caPotentiel = devisEnCours.reduce((acc, d) => acc + totalTTC(d.lignes), 0);

  const weekDates = getWeekDates(semaine);

  // ── PRINT DEVIS ──────────────────────────────────────────────────────────────
  const printDevis = (d) => {
    const ht = totalHT(d.lignes);
    const tva = totalTVA(d.lignes);
    const ttc = totalTTC(d.lignes);
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Devis ${numDevis(d.numero)}</title>
    <style>
      body { font-family: 'Georgia', serif; margin: 0; padding: 40px; color: #1a1208; background: white; }
      .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #c8a96e; padding-bottom: 24px; }
      .logo { font-size: 24px; font-weight: bold; color: #c8a96e; }
      .logo small { display: block; font-size: 11px; color: #888; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; }
      .infos-resto { text-align: right; font-size: 13px; color: #555; line-height: 1.6; }
      .devis-title { font-size: 28px; font-weight: bold; color: #1a1208; margin-bottom: 4px; }
      .devis-num { font-size: 13px; color: #888; margin-bottom: 24px; }
      .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
      .partie h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #888; margin-bottom: 8px; }
      .partie p { margin: 2px 0; font-size: 14px; }
      .event-info { background: #fdf8f0; border-left: 3px solid #c8a96e; padding: 16px 20px; margin-bottom: 32px; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      thead th { background: #1a1208; color: white; padding: 10px 14px; text-align: left; font-size: 12px; letter-spacing: 0.05em; }
      tbody td { padding: 12px 14px; border-bottom: 1px solid #eee; font-size: 13px; }
      tbody tr:nth-child(even) { background: #fafafa; }
      .totaux { display: flex; justify-content: flex-end; margin-bottom: 32px; }
      .totaux table { width: 300px; }
      .totaux td { padding: 6px 14px; font-size: 14px; }
      .totaux .total-ttc { font-weight: bold; font-size: 16px; color: #c8a96e; border-top: 2px solid #c8a96e; }
      .acompte { background: #fdf8f0; padding: 16px; border-radius: 4px; font-size: 13px; margin-bottom: 24px; }
      .notes { font-size: 12px; color: #666; margin-bottom: 32px; }
      .footer { text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
      .validite { font-size: 12px; color: #888; text-align: right; margin-bottom: 8px; }
    </style></head><body>
    <div class="header">
      <div>
        <div class="logo">${infos.nom}<small>Privatisation & Événements</small></div>
        ${infos.adresse ? `<div style="font-size:12px;color:#888;margin-top:8px">${infos.adresse}</div>` : ""}
        ${infos.telephone ? `<div style="font-size:12px;color:#888">${infos.telephone}</div>` : ""}
        ${infos.email ? `<div style="font-size:12px;color:#888">${infos.email}</div>` : ""}
        ${infos.siret ? `<div style="font-size:11px;color:#aaa;margin-top:4px">SIRET : ${infos.siret}</div>` : ""}
      </div>
      <div class="infos-resto">
        <div style="font-size:11px;color:#888;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">Devis</div>
        <div style="font-size:22px;font-weight:bold">${numDevis(d.numero)}</div>
        <div style="font-size:12px;color:#888">Émis le ${formatDate(todayStr)}</div>
        ${d.validite ? `<div style="font-size:12px;color:#888">Valide ${d.validite} jours</div>` : ""}
      </div>
    </div>
    <div class="parties">
      <div class="partie"><h3>Client</h3><p><strong>${d.client}</strong></p>${d.entreprise ? `<p>${d.entreprise}</p>` : ""}${d.telephone ? `<p>${d.telephone}</p>` : ""}${d.email ? `<p>${d.email}</p>` : ""}</div>
      <div class="partie"><h3>Événement</h3><p><strong>Date :</strong> ${formatDate(d.dateEvenement)}</p><p><strong>Salle :</strong> ${getSalle(d.salleId)?.nom}</p><p><strong>Personnes :</strong> ${d.nbPersonnes}</p><p><strong>Créneau :</strong> ${CRENEAUX.find(c=>c.id===d.creneau)?.label}</p></div>
    </div>
    <table>
      <thead><tr><th>Désignation</th><th>Description</th><th style="text-align:right">Qté</th><th style="text-align:right">P.U. HT</th><th style="text-align:right">Total HT</th></tr></thead>
      <tbody>
        ${(d.lignes||[]).map(l => `<tr><td><strong>${l.libelle}</strong></td><td style="color:#666;font-size:12px">${l.description||""}</td><td style="text-align:right">${l.qte}</td><td style="text-align:right">${parseFloat(l.prixHT||0).toFixed(2)} €</td><td style="text-align:right">${ligneHT(l).toFixed(2)} €</td></tr>`).join("")}
      </tbody>
    </table>
    <div class="totaux"><table>
      <tr><td>Total HT</td><td style="text-align:right">${ht.toFixed(2)} €</td></tr>
      <tr><td>TVA (20%)</td><td style="text-align:right">${tva.toFixed(2)} €</td></tr>
      <tr class="total-ttc"><td><strong>Total TTC</strong></td><td style="text-align:right"><strong>${ttc.toFixed(2)} €</strong></td></tr>
      ${d.acompte ? `<tr><td style="color:#888;font-size:12px">Acompte demandé</td><td style="text-align:right;color:#888;font-size:12px">${parseFloat(d.acompte).toFixed(2)} €</td></tr>` : ""}
    </table></div>
    ${d.notes ? `<div class="notes"><strong>Notes :</strong> ${d.notes}</div>` : ""}
    <div class="footer">Devis établi par ${infos.nom} — Non contractuel avant signature</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  const nav = [
    { section: "Suivi" },
    { id: "dashboard", icon: "◈", label: "Tableau de bord" },
    { id: "semaine", icon: "⊟", label: "Vue semaine" },
    { id: "liste", icon: "≡", label: "Réservations" },
    { id: "avenir", icon: "◷", label: "À venir" },
    { section: "Commerce" },
    { id: "devis-list", icon: "📋", label: "Devis" },
    { section: "Cuisine" },
    { id: "plats", icon: "🍽️", label: "Bibliothèque plats" },
    { id: "menus", icon: "📖", label: "Menus" },
    { section: "Paramètres" },
    { id: "parametres", icon: "⚙", label: "Infos restaurant" },
  ];

  return (
    <div style={S.app}>
      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoTitle}>La Folie<br />des Champs</div>
          <div style={S.logoSub}>Gestion des salles</div>
        </div>
        {nav.map((n, i) => n.section
          ? <div key={i} style={S.navSection}>{n.section}</div>
          : <button key={n.id} style={S.navBtn(vue === n.id)} onClick={() => setVue(n.id)}>
              <span>{n.icon}</span>{n.label}
            </button>
        )}
      </div>

      {/* MAIN */}
      <div style={S.main}>

        {/* ── DASHBOARD ─────────────────────────────────────────────────────── */}
        {vue === "dashboard" && <>
          <div style={S.header}>
            <div style={S.pageTitle}>Tableau de bord</div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={S.btn("#6ab0de", "#6ab0de22")} onClick={openNewDevis}>+ Nouveau devis</button>
              <button style={S.btn()} onClick={openNewRez}>+ Réservation</button>
            </div>
          </div>
          <div style={S.grid4}>
            {[
              { n: reservations.filter(r=>r.statut==="confirmee").length, label: "Réservations confirmées", c: "#5aaa6e" },
              { n: reservations.filter(r=>r.statut==="attente").length, label: "En attente", c: "#e8b84b" },
              { n: devisEnCours.length, label: "Devis en cours", c: "#6ab0de" },
              { n: `${caConfirme.toLocaleString("fr-FR")} €`, label: "CA confirmé TTC", c: "#c8a96e" },
            ].map((s, i) => (
              <div key={i} style={{ ...S.card(`${s.c}33`), textAlign: "center" }}>
                <div style={{ fontSize: 34, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 11, color: "#5a4a30", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 8 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {caPotentiel > 0 && (
            <div style={{ ...S.card("#6ab0de33"), marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 12, color: "#6ab0de", textTransform: "uppercase", letterSpacing: "0.1em" }}>CA potentiel (devis en cours)</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#6ab0de", marginTop: 4 }}>{caPotentiel.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} € TTC</div></div>
              <button style={S.btnSm("#6ab0de")} onClick={() => setVue("devis-list")}>Voir les devis →</button>
            </div>
          )}
          <div style={S.grid2}>
            <div style={S.card()}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#c8a96e", marginBottom: 16 }}>Prochaines réservations</div>
              {aVenir.length === 0 ? <div style={{ color: "#3a2e1a", fontSize: 13, textAlign: "center", padding: 24 }}>Aucune réservation à venir</div>
                : aVenir.slice(0, 5).map(r => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1a1208", cursor: "pointer" }} onClick={() => openEditRez(r)}>
                    <div style={{ textAlign: "center", minWidth: 40 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#c8a96e" }}>{r.date.split("-")[2]}</div>
                      <div style={{ fontSize: 9, color: "#5a4a30" }}>{MOIS[parseInt(r.date.split("-")[1])-1]?.slice(0,3)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.client}</div>
                      <div style={{ fontSize: 11, color: "#7a6a50" }}>{getSalle(r.salleId)?.nom} · {r.nbPersonnes} pers.</div>
                    </div>
                    <span style={S.badge(getStatutRez(r.statut)?.color)}>{getStatutRez(r.statut)?.label}</span>
                  </div>
                ))}
            </div>
            <div style={S.card()}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#6ab0de", marginBottom: 16 }}>Devis récents</div>
              {devis.length === 0 ? <div style={{ color: "#3a2e1a", fontSize: 13, textAlign: "center", padding: 24 }}>Aucun devis créé</div>
                : devis.slice().reverse().slice(0, 5).map(d => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1a1208", cursor: "pointer" }} onClick={() => openViewDevis(d)}>
                    <div style={{ fontSize: 11, color: "#5a4a30", minWidth: 80 }}>{numDevis(d.numero)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{d.client}</div>
                      <div style={{ fontSize: 11, color: "#7a6a50" }}>{formatDate(d.dateEvenement)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, color: "#c8a96e" }}>{totalTTC(d.lignes).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €</div>
                      <span style={S.badge(getStatutDevis(d.statut)?.color)}>{getStatutDevis(d.statut)?.label}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>}

        {/* ── SEMAINE ───────────────────────────────────────────────────────── */}
        {vue === "semaine" && <>
          <div style={S.header}>
            <div style={S.pageTitle}>Vue semaine</div>
            <button style={S.btn()} onClick={openNewRez}>+ Réservation</button>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 24 }}>
            {[["← Préc.", -7], ["Aujourd'hui", 0], ["Suiv. →", 7]].map(([label, delta]) => (
              <button key={label} style={{ ...S.btnSm("#c8a96e"), padding: "7px 16px" }} onClick={() => {
                if (delta === 0) setSemaine(today());
                else { const d = new Date(semaine); d.setDate(d.getDate() + delta); setSemaine(d.toISOString().split("T")[0]); }
              }}>{label}</button>
            ))}
            <div style={{ fontSize: 13, color: "#5a4a30", marginLeft: 8 }}>{formatDate(weekDates[0])} – {formatDate(weekDates[6])}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
            {weekDates.map((date, i) => {
              const dayRes = reservations.filter(r => r.date === date);
              const isToday = date === todayStr;
              return (
                <div key={date} style={{ background: isToday ? "#1e1508" : "#120e07", border: `1px solid ${isToday ? "#c8a96e" : "#2a2010"}`, borderRadius: 6, padding: 10, minHeight: 110 }}>
                  <div style={{ fontSize: 10, color: isToday ? "#c8a96e" : "#5a4a30", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                    {JOURS[i]}<br /><span style={{ fontSize: 20, fontWeight: 700, color: isToday ? "#c8a96e" : "#f0e6d0" }}>{date.split("-")[2]}</span>
                  </div>
                  {dayRes.map(r => (
                    <div key={r.id} style={{ background: getSalle(r.salleId)?.couleur + "22", border: `1px solid ${getSalle(r.salleId)?.couleur}55`, borderRadius: 3, padding: "4px 7px", marginBottom: 4, fontSize: 10, cursor: "pointer", color: getSalle(r.salleId)?.couleur }} onClick={() => openEditRez(r)}>
                      <div style={{ fontWeight: 600 }}>{r.client}</div>
                      <div style={{ opacity: 0.8 }}>{getSalle(r.salleId)?.nom}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>}

        {/* ── LISTE RÉSERVATIONS ────────────────────────────────────────────── */}
        {vue === "liste" && <>
          <div style={S.header}>
            <div style={S.pageTitle}>Réservations</div>
            <button style={S.btn()} onClick={openNewRez}>+ Nouvelle réservation</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {["tous", ...STATUTS_REZ.map(s=>s.id)].map(s => (
              <button key={s} style={{ ...S.btnSm(s==="tous" ? "#c8a96e" : STATUTS_REZ.find(x=>x.id===s)?.color || "#c8a96e"), background: filterStatutRez===s ? (STATUTS_REZ.find(x=>x.id===s)?.color||"#c8a96e")+"22" : "transparent", padding: "5px 14px" }} onClick={() => setFilterStatutRez(s)}>
                {s==="tous" ? "Tous" : STATUTS_REZ.find(x=>x.id===s)?.label}
              </button>
            ))}
          </div>
          <div style={S.card()}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Client","Date","Salle","Type","Pers.","Tarif","Statut",""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {reservations.filter(r => filterStatutRez==="tous" || r.statut===filterStatutRez)
                  .sort((a,b) => new Date(a.date)-new Date(b.date))
                  .map(r => (
                  <tr key={r.id} style={{ cursor: "pointer" }} onMouseEnter={e=>e.currentTarget.style.background="#1a1208"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={S.td}><div style={{ fontWeight: 600 }}>{r.client}</div><div style={{ fontSize: 11, color: "#5a4a30" }}>{r.telephone}</div></td>
                    <td style={S.td}>{formatDate(r.date)}</td>
                    <td style={S.td}><span style={S.badge(getSalle(r.salleId)?.couleur)}>{getSalle(r.salleId)?.nom}</span></td>
                    <td style={S.td}><div style={{ fontSize: 12 }}>{TYPES_EV.find(t=>t.id===r.type)?.label}</div><div style={{ fontSize: 11, color: "#5a4a30" }}>{CRENEAUX.find(c=>c.id===r.creneau)?.label}</div></td>
                    <td style={S.td}>{r.nbPersonnes}</td>
                    <td style={S.td}>{r.tarif ? <span style={{ color: "#c8a96e" }}>{parseFloat(r.tarif).toLocaleString("fr-FR")} €</span> : "—"}</td>
                    <td style={S.td}>
                      <select value={r.statut} onChange={e => setReservations(p=>p.map(x=>x.id===r.id?{...x,statut:e.target.value}:x))} style={{ ...S.select, width: "auto", padding: "4px 8px", fontSize: 11 }}>
                        {STATUTS_REZ.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </td>
                    <td style={S.td}>
                      <button style={S.iconBtn} onClick={() => openEditRez(r)}>✏️</button>
                      <button style={S.iconBtn} onClick={() => setConfirmDelete({ type: "rez", id: r.id })}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reservations.filter(r=>filterStatutRez==="tous"||r.statut===filterStatutRez).length===0 && <div style={{ textAlign: "center", padding: 40, color: "#3a2e1a" }}>Aucune réservation</div>}
          </div>
        </>}

        {/* ── À VENIR ───────────────────────────────────────────────────────── */}
        {vue === "avenir" && <>
          <div style={S.header}><div style={S.pageTitle}>À venir</div><button style={S.btn()} onClick={openNewRez}>+ Réservation</button></div>
          {aVenir.length === 0 ? <div style={{ ...S.card(), textAlign: "center", padding: 64, color: "#3a2e1a" }}>Aucune réservation à venir</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {aVenir.map(r => (
                <div key={r.id} style={{ ...S.card(getSalle(r.salleId)?.couleur + "44"), display: "flex", alignItems: "center", gap: 20, borderLeft: `4px solid ${getSalle(r.salleId)?.couleur}` }}>
                  <div style={{ textAlign: "center", minWidth: 60 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "#c8a96e" }}>{r.date.split("-")[2]}</div>
                    <div style={{ fontSize: 10, color: "#5a4a30", textTransform: "uppercase" }}>{MOIS[parseInt(r.date.split("-")[1])-1]?.slice(0,3)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{r.client}</div>
                    <div style={{ fontSize: 12, color: "#7a6a50", marginTop: 3 }}>
                      <span style={S.badge(getSalle(r.salleId)?.couleur)}>{getSalle(r.salleId)?.nom}</span>
                      {" · "}{TYPES_EV.find(t=>t.id===r.type)?.label}{" · "}{r.nbPersonnes} pers.{" · "}{CRENEAUX.find(c=>c.id===r.creneau)?.label}
                    </div>
                    {r.notes && <div style={{ fontSize: 11, color: "#5a4a30", marginTop: 4, fontStyle: "italic" }}>{r.notes}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {r.tarif && <div style={{ fontSize: 18, fontWeight: 700, color: "#c8a96e", marginBottom: 4 }}>{parseFloat(r.tarif).toLocaleString("fr-FR")} €</div>}
                    <span style={S.badge(getStatutRez(r.statut)?.color)}>{getStatutRez(r.statut)?.label}</span>
                  </div>
                  <button style={S.iconBtn} onClick={() => openEditRez(r)}>✏️</button>
                </div>
              ))}
            </div>}
        </>}

        {/* ── DEVIS LIST ────────────────────────────────────────────────────── */}
        {vue === "devis-list" && <>
          <div style={S.header}>
            <div style={S.pageTitle}>Devis</div>
            <button style={S.btn("#6ab0de")} onClick={openNewDevis}>+ Nouveau devis</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {["tous", ...STATUTS_DEVIS.map(s=>s.id)].map(s => (
              <button key={s} style={{ ...S.btnSm(s==="tous"?"#6ab0de":STATUTS_DEVIS.find(x=>x.id===s)?.color||"#6ab0de"), background: filterStatutDevis===s?(STATUTS_DEVIS.find(x=>x.id===s)?.color||"#6ab0de")+"22":"transparent", padding: "5px 14px" }} onClick={() => setFilterStatutDevis(s)}>
                {s==="tous"?"Tous":STATUTS_DEVIS.find(x=>x.id===s)?.label}
              </button>
            ))}
          </div>
          <div style={S.card()}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["N°","Client","Événement","Salle","Montant TTC","Statut",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {devis.filter(d=>filterStatutDevis==="tous"||d.statut===filterStatutDevis)
                  .sort((a,b)=>b.numero-a.numero)
                  .map(d=>(
                  <tr key={d.id} onMouseEnter={e=>e.currentTarget.style.background="#1a1208"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={S.td}><span style={{ color: "#6ab0de", fontWeight: 600 }}>{numDevis(d.numero)}</span></td>
                    <td style={S.td}><div style={{ fontWeight: 600 }}>{d.client}</div>{d.entreprise&&<div style={{ fontSize: 11, color: "#5a4a30" }}>{d.entreprise}</div>}</td>
                    <td style={S.td}>{formatDate(d.dateEvenement)}</td>
                    <td style={S.td}><span style={S.badge(getSalle(d.salleId)?.couleur)}>{getSalle(d.salleId)?.nom}</span></td>
                    <td style={S.td}><span style={{ color: "#c8a96e", fontWeight: 600 }}>{totalTTC(d.lignes).toLocaleString("fr-FR",{maximumFractionDigits:2})} €</span></td>
                    <td style={S.td}>
                      <select value={d.statut} onChange={e=>setDevis(p=>p.map(x=>x.id===d.id?{...x,statut:e.target.value}:x))} style={{ ...S.select, width:"auto", padding:"4px 8px", fontSize:11 }}>
                        {STATUTS_DEVIS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </td>
                    <td style={S.td}>
                      <button style={S.iconBtn} title="Voir" onClick={()=>openViewDevis(d)}>👁️</button>
                      <button style={S.iconBtn} title="Modifier" onClick={()=>openEditDevis(d)}>✏️</button>
                      <button style={S.iconBtn} title="Imprimer PDF" onClick={()=>printDevis(d)}>🖨️</button>
                      {d.statut!=="accepte"&&<button style={S.iconBtn} title="Convertir en réservation" onClick={()=>convertirDevis(d)}>✅</button>}
                      <button style={S.iconBtn} title="Supprimer" onClick={()=>setConfirmDelete({type:"devis",id:d.id})}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {devis.filter(d=>filterStatutDevis==="tous"||d.statut===filterStatutDevis).length===0&&<div style={{ textAlign:"center", padding:40, color:"#3a2e1a" }}>Aucun devis</div>}
          </div>
        </>}

        {/* ── PLATS ────────────────────────────────────────────────────────── */}
        {vue === "plats" && <>
          <div style={S.header}>
            <div style={S.pageTitle}>Bibliothèque de plats</div>
            <button style={S.btn("#8fad88")} onClick={openNewPlat}>+ Nouveau plat</button>
          </div>
          {CATEGORIES_PLATS.map(cat => {
            const catPlats = plats.filter(p => p.categorie === cat.id);
            return (
              <div key={cat.id} style={{ ...S.card(), marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#8fad88", marginBottom: 14 }}>{cat.emoji} {cat.label} <span style={{ fontSize: 12, color: "#5a4a30", fontWeight: 400 }}>({catPlats.length})</span></div>
                {catPlats.length === 0 ? <div style={{ fontSize: 12, color: "#3a2e1a", fontStyle: "italic" }}>Aucun plat dans cette catégorie</div>
                  : <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Nom","Description","Prix HT","Allergènes",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {catPlats.map(p=>(
                        <tr key={p.id} onMouseEnter={e=>e.currentTarget.style.background="#1a1208"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={S.td}><span style={{ fontWeight: 600 }}>{p.nom}</span></td>
                          <td style={{ ...S.td, color: "#7a6a50", fontSize: 12 }}>{p.description||"—"}</td>
                          <td style={S.td}><span style={{ color: "#c8a96e" }}>{parseFloat(p.prixHT||0).toFixed(2)} €</span></td>
                          <td style={{ ...S.td, fontSize: 11, color: "#7a6a50" }}>{p.allergenes||"—"}</td>
                          <td style={S.td}>
                            <button style={S.iconBtn} onClick={()=>openEditPlat(p)}>✏️</button>
                            <button style={S.iconBtn} onClick={()=>setConfirmDelete({type:"plat",id:p.id})}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
              </div>
            );
          })}
          {plats.length===0&&<div style={{ ...S.card(), textAlign:"center", padding:48, color:"#3a2e1a" }}>Aucun plat créé — commencez par ajouter vos plats</div>}
        </>}

        {/* ── MENUS ────────────────────────────────────────────────────────── */}
        {vue === "menus" && <>
          <div style={S.header}>
            <div style={S.pageTitle}>Menus</div>
            <button style={S.btn("#b07db0")} onClick={openNewMenu}>+ Nouveau menu</button>
          </div>
          {menus.length===0 ? <div style={{ ...S.card(), textAlign:"center", padding:48, color:"#3a2e1a" }}>Aucun menu créé — composez vos premiers menus à partir des plats de la bibliothèque</div>
            : <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {menus.map(m=>(
                <div key={m.id} style={{ ...S.card("#b07db033"), borderLeft:"4px solid #b07db0" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, color:"#b07db0" }}>{m.nom}</div>
                      {m.description&&<div style={{ fontSize:12, color:"#7a6a50", marginTop:3 }}>{m.description}</div>}
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <div style={{ fontSize:18, fontWeight:700, color:"#c8a96e" }}>{totalMenuHT(m).toFixed(2)} € HT</div>
                      <button style={S.iconBtn} onClick={()=>openEditMenu(m)}>✏️</button>
                      <button style={S.iconBtn} onClick={()=>setConfirmDelete({type:"menu",id:m.id})}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {CATEGORIES_PLATS.map(cat=>{
                      const catPlats = (m.platIds||[]).map(id=>plats.find(p=>p.id===id)).filter(p=>p&&p.categorie===cat.id);
                      if(catPlats.length===0) return null;
                      return <div key={cat.id}>
                        <div style={{ fontSize:9, color:"#5a4a30", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>{cat.emoji} {cat.label}</div>
                        {catPlats.map(p=><div key={p.id} style={{ ...S.badge("#8fad88"), marginRight:4, fontSize:11 }}>{p.nom} <span style={{ opacity:0.7 }}>{parseFloat(p.prixHT).toFixed(2)}€</span></div>)}
                      </div>;
                    })}
                    {(!m.platIds||m.platIds.length===0)&&<div style={{ fontSize:12, color:"#3a2e1a", fontStyle:"italic" }}>Aucun plat sélectionné</div>}
                  </div>
                </div>
              ))}
            </div>}
        </>}

        {/* ── PARAMÈTRES ───────────────────────────────────────────────────── */}
        {vue === "parametres" && <>
          <div style={S.header}><div style={S.pageTitle}>Infos restaurant</div></div>
          <div style={{ ...S.card(), maxWidth: 540 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#c8a96e", marginBottom:20 }}>Coordonnées (pour les devis PDF)</div>
            {[["nom","Nom du restaurant"],["adresse","Adresse"],["telephone","Téléphone"],["email","Email"],["siret","SIRET"]].map(([k,label])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={S.label}>{label}</label>
                <input style={S.input} value={infos[k]||""} onChange={e=>setInfos(p=>({...p,[k]:e.target.value}))} />
              </div>
            ))}
            <div style={{ fontSize:11, color:"#5a4a30", marginTop:8 }}>Ces informations apparaîtront sur vos devis exportés en PDF.</div>
          </div>
        </>}

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* ── MODAL RÉSERVATION ─────────────────────────────────────────────── */}
      {modal === "rez" && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={S.modalBox(640)}>
            <div style={S.modalTitle}>{editId ? "Modifier la réservation" : "Nouvelle réservation"}</div>
            <div style={S.grid2}>
              {[["client","Client *","text"],["telephone","Téléphone","text"],["email","Email","email"],["date","Date *","date"],["nbPersonnes","Nombre de personnes *","number"],["tarif","Tarif (€)","number"]].map(([k,label,type])=>(
                <div key={k}><label style={S.label}>{label}</label><input style={S.input} type={type} value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
              ))}
              {[["salleId","Salle",SALLES.map(s=>({v:s.id,l:s.nom}))],["type","Type",TYPES_EV.map(t=>({v:t.id,l:t.label}))],["creneau","Créneau",CRENEAUX.map(c=>({v:c.id,l:c.label+(c.heure?` (${c.heure})`:"")}))],["configuration","Configuration",[{v:"assise",l:"Assise"},{v:"debout",l:"Debout"},{v:"mixte",l:"Mixte"}]],["statut","Statut",STATUTS_REZ.map(s=>({v:s.id,l:s.label}))]].map(([k,label,opts])=>(
                <div key={k}><label style={S.label}>{label}</label><select style={S.select} value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}>{opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
              ))}
            </div>
            {form.creneau==="libre"&&<div style={{ ...S.grid2, marginTop:16 }}>
              <div><label style={S.label}>Heure début</label><input style={S.input} type="time" value={form.heureDebut||""} onChange={e=>setForm(f=>({...f,heureDebut:e.target.value}))} /></div>
              <div><label style={S.label}>Heure fin</label><input style={S.input} type="time" value={form.heureFin||""} onChange={e=>setForm(f=>({...f,heureFin:e.target.value}))} /></div>
            </div>}
            <div style={{ marginTop:16 }}><label style={S.label}>Notes</label><textarea style={S.textarea} value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:12, marginTop:24 }}>
              <button style={S.btn("#5a4a30","transparent")} onClick={()=>setModal(null)}>Annuler</button>
              <button style={S.btn()} onClick={saveRez}>{editId?"Enregistrer":"Créer la réservation"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DEVIS FORM ──────────────────────────────────────────────── */}
      {modal === "devis" && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={S.modalBox(760)}>
            <div style={S.modalTitle}>{editId ? `Modifier ${numDevis(form.numero)}` : `Nouveau devis — ${numDevis(form.numero)}`}</div>

            {/* Infos client */}
            <div style={{ fontSize:11, color:"#6ab0de", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:12 }}>Client / Prospect</div>
            <div style={S.grid2}>
              {[["client","Nom *"],["entreprise","Entreprise / Organisation"],["telephone","Téléphone"],["email","Email"]].map(([k,l])=>(
                <div key={k}><label style={S.label}>{l}</label><input style={S.input} value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
              ))}
            </div>
            <hr style={S.divider} />

            {/* Infos événement */}
            <div style={{ fontSize:11, color:"#6ab0de", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:12 }}>Événement</div>
            <div style={S.grid2}>
              <div><label style={S.label}>Date de l'événement *</label><input style={S.input} type="date" value={form.dateEvenement||""} onChange={e=>setForm(f=>({...f,dateEvenement:e.target.value}))} /></div>
              <div><label style={S.label}>Nombre de personnes</label><input style={S.input} type="number" value={form.nbPersonnes||""} onChange={e=>setForm(f=>({...f,nbPersonnes:e.target.value}))} /></div>
              <div><label style={S.label}>Salle</label><select style={S.select} value={form.salleId||"grande"} onChange={e=>setForm(f=>({...f,salleId:e.target.value}))}>{SALLES.map(s=><option key={s.id} value={s.id}>{s.nom}</option>)}</select></div>
              <div><label style={S.label}>Type</label><select style={S.select} value={form.type||"privatisation"} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{TYPES_EV.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
              <div><label style={S.label}>Créneau</label><select style={S.select} value={form.creneau||"diner"} onChange={e=>setForm(f=>({...f,creneau:e.target.value}))}>{CRENEAUX.map(c=><option key={c.id} value={c.id}>{c.label}{c.heure?` (${c.heure})`:""}</option>)}</select></div>
              <div><label style={S.label}>Configuration</label><select style={S.select} value={form.configuration||"assise"} onChange={e=>setForm(f=>({...f,configuration:e.target.value}))}><option value="assise">Assise</option><option value="debout">Debout</option><option value="mixte">Mixte</option></select></div>
            </div>
            <hr style={S.divider} />

            {/* Lignes */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:11, color:"#6ab0de", textTransform:"uppercase", letterSpacing:"0.12em" }}>Prestations</div>
              <div style={{ display:"flex", gap:8 }}>
                {[["Plat/Boisson","plat"],["Menu","menu"],["Salle","salle"],["Service","service"],["Libre","libre"]].map(([l,t])=>(
                  <button key={t} style={{ ...S.btnSm("#8fad88"), padding:"4px 10px" }} onClick={()=>addLigne(t)}>+ {l}</button>
                ))}
              </div>
            </div>
            {(form.lignes||[]).length===0&&<div style={{ fontSize:12, color:"#3a2e1a", textAlign:"center", padding:24, border:"1px dashed #2a2010", borderRadius:4, marginBottom:16 }}>Ajoutez des prestations ci-dessus</div>}
            {(form.lignes||[]).map(l=>(
              <div key={l.id} style={{ background:"#0a0704", border:"1px solid #2a2010", borderRadius:4, padding:14, marginBottom:10 }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    {l.type==="plat"&&plats.length>0&&<div style={{ marginBottom:8 }}>
                      <label style={S.label}>Sélectionner un plat de la bibliothèque</label>
                      <select style={S.select} value={l.platId||""} onChange={e=>selectPlatForLigne(l.id,e.target.value)}>
                        <option value="">— Choisir un plat —</option>
                        {CATEGORIES_PLATS.map(cat=>{
                          const cPlats=plats.filter(p=>p.categorie===cat.id);
                          if(cPlats.length===0) return null;
                          return <optgroup key={cat.id} label={`${cat.emoji} ${cat.label}`}>{cPlats.map(p=><option key={p.id} value={p.id}>{p.nom} — {parseFloat(p.prixHT).toFixed(2)} € HT</option>)}</optgroup>;
                        })}
                      </select>
                    </div>}
                    {l.type==="menu"&&menus.length>0&&<div style={{ marginBottom:8 }}>
                      <label style={S.label}>Sélectionner un menu</label>
                      <select style={S.select} value={l.menuId||""} onChange={e=>selectMenuForLigne(l.id,e.target.value)}>
                        <option value="">— Choisir un menu —</option>
                        {menus.map(m=><option key={m.id} value={m.id}>{m.nom} — {totalMenuHT(m).toFixed(2)} € HT/pers.</option>)}
                      </select>
                    </div>}
                    <div style={S.grid2}>
                      <div><label style={S.label}>Désignation</label><input style={S.input} value={l.libelle||""} onChange={e=>updateLigne(l.id,"libelle",e.target.value)} placeholder="ex: Privatisation La Grande" /></div>
                      <div><label style={S.label}>Description</label><input style={S.input} value={l.description||""} onChange={e=>updateLigne(l.id,"description",e.target.value)} placeholder="Détails optionnels" /></div>
                      <div><label style={S.label}>Prix unitaire HT (€)</label><input style={S.input} type="number" value={l.prixHT||""} onChange={e=>updateLigne(l.id,"prixHT",e.target.value)} /></div>
                      <div><label style={S.label}>Quantité / Personnes</label><input style={S.input} type="number" value={l.qte||1} onChange={e=>updateLigne(l.id,"qte",e.target.value)} /></div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right", minWidth:90 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:"#c8a96e", marginBottom:8 }}>{ligneHT(l).toFixed(2)} €</div>
                    <button style={{ ...S.iconBtn, color:"#d9534f" }} onClick={()=>removeLigne(l.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}

            {/* Totaux */}
            {(form.lignes||[]).length>0&&(
              <div style={{ background:"#0a0704", border:"1px solid #2a2010", borderRadius:4, padding:14, marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <table style={{ width:280 }}>
                    <tbody>
                      <tr><td style={{ padding:"4px 12px", fontSize:13, color:"#7a6a50" }}>Total HT</td><td style={{ padding:"4px 12px", textAlign:"right", fontSize:13 }}>{totalHT(form.lignes).toFixed(2)} €</td></tr>
                      <tr><td style={{ padding:"4px 12px", fontSize:13, color:"#7a6a50" }}>TVA (20%)</td><td style={{ padding:"4px 12px", textAlign:"right", fontSize:13 }}>{totalTVA(form.lignes).toFixed(2)} €</td></tr>
                      <tr style={{ borderTop:"1px solid #2a2010" }}><td style={{ padding:"8px 12px", fontWeight:700, color:"#c8a96e" }}>Total TTC</td><td style={{ padding:"8px 12px", textAlign:"right", fontWeight:700, fontSize:16, color:"#c8a96e" }}>{totalTTC(form.lignes).toFixed(2)} €</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={S.grid2}>
              <div><label style={S.label}>Acompte demandé (€)</label><input style={S.input} type="number" value={form.acompte||""} onChange={e=>setForm(f=>({...f,acompte:e.target.value}))} /></div>
              <div><label style={S.label}>Validité du devis (jours)</label><input style={S.input} type="number" value={form.validite||30} onChange={e=>setForm(f=>({...f,validite:e.target.value}))} /></div>
              <div><label style={S.label}>Statut</label><select style={S.select} value={form.statut||"attente"} onChange={e=>setForm(f=>({...f,statut:e.target.value}))}>{STATUTS_DEVIS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
            </div>
            <div style={{ marginTop:14 }}><label style={S.label}>Notes</label><textarea style={S.textarea} value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:12, marginTop:24 }}>
              <button style={S.btn("#5a4a30","transparent")} onClick={()=>setModal(null)}>Annuler</button>
              <button style={S.btn("#6ab0de")} onClick={saveDevis}>{editId?"Enregistrer":"Créer le devis"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DEVIS DETAIL ────────────────────────────────────────────── */}
      {modal === "devis-detail" && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={S.modalBox(640)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
              <div>
                <div style={{ fontSize:11, color:"#6ab0de", textTransform:"uppercase", letterSpacing:"0.12em" }}>{numDevis(form.numero)}</div>
                <div style={S.modalTitle}>{form.client}</div>
              </div>
              <span style={S.badge(getStatutDevis(form.statut)?.color)}>{getStatutDevis(form.statut)?.label}</span>
            </div>
            <div style={S.grid2}>
              {[["Entreprise",form.entreprise],["Téléphone",form.telephone],["Email",form.email],["Date événement",formatDate(form.dateEvenement)],["Salle",getSalle(form.salleId)?.nom],["Personnes",form.nbPersonnes],["Créneau",CRENEAUX.find(c=>c.id===form.creneau)?.label],["Type",TYPES_EV.find(t=>t.id===form.type)?.label]].filter(([,v])=>v).map(([k,v])=>(
                <div key={k}><div style={{ fontSize:10, color:"#5a4a30", textTransform:"uppercase", letterSpacing:"0.1em" }}>{k}</div><div style={{ fontSize:13, marginTop:3 }}>{v}</div></div>
              ))}
            </div>
            <hr style={S.divider} />
            <div style={{ fontSize:11, color:"#6ab0de", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:12 }}>Prestations</div>
            {(form.lignes||[]).map(l=>(
              <div key={l.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #1a1208" }}>
                <div><div style={{ fontWeight:600, fontSize:13 }}>{l.libelle}</div>{l.description&&<div style={{ fontSize:11, color:"#7a6a50" }}>{l.description}</div>}</div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, color:"#7a6a50" }}>{l.qte} × {parseFloat(l.prixHT||0).toFixed(2)} €</div>
                  <div style={{ fontWeight:600, color:"#c8a96e" }}>{ligneHT(l).toFixed(2)} €</div>
                </div>
              </div>
            ))}
            <div style={{ textAlign:"right", marginTop:16, padding:16, background:"#0a0704", borderRadius:4 }}>
              <div style={{ fontSize:12, color:"#7a6a50" }}>HT : {totalHT(form.lignes).toFixed(2)} € · TVA : {totalTVA(form.lignes).toFixed(2)} €</div>
              <div style={{ fontSize:20, fontWeight:700, color:"#c8a96e", marginTop:4 }}>Total TTC : {totalTTC(form.lignes).toFixed(2)} €</div>
              {form.acompte&&<div style={{ fontSize:12, color:"#7a6a50", marginTop:4 }}>Acompte demandé : {parseFloat(form.acompte).toFixed(2)} €</div>}
            </div>
            {form.notes&&<div style={{ fontSize:12, color:"#7a6a50", marginTop:14, fontStyle:"italic" }}>{form.notes}</div>}
            <div style={{ display:"flex", gap:10, marginTop:24, justifyContent:"flex-end" }}>
              <button style={S.btn("#5a4a30","transparent")} onClick={()=>setModal(null)}>Fermer</button>
              <button style={S.btn("#8fad88","#8fad8822")} onClick={()=>{setModal(null);openEditDevis(form);}}>✏️ Modifier</button>
              <button style={S.btn("#6ab0de","#6ab0de22")} onClick={()=>printDevis(form)}>🖨️ PDF</button>
              {form.statut!=="accepte"&&<button style={S.btn("#5aaa6e")} onClick={()=>convertirDevis(form)}>✅ Convertir en réservation</button>}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PLAT ────────────────────────────────────────────────────── */}
      {modal === "plat" && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={S.modalBox(520)}>
            <div style={S.modalTitle}>{editId?"Modifier le plat":"Nouveau plat"}</div>
            <div style={S.grid2}>
              <div><label style={S.label}>Nom du plat *</label><input style={S.input} value={form.nom||""} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} /></div>
              <div><label style={S.label}>Catégorie</label><select style={S.select} value={form.categorie||"entree"} onChange={e=>setForm(f=>({...f,categorie:e.target.value}))}>{CATEGORIES_PLATS.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}</select></div>
              <div><label style={S.label}>Prix unitaire HT (€) *</label><input style={S.input} type="number" value={form.prixHT||""} onChange={e=>setForm(f=>({...f,prixHT:e.target.value}))} /></div>
              <div><label style={S.label}>Allergènes</label><input style={S.input} value={form.allergenes||""} onChange={e=>setForm(f=>({...f,allergenes:e.target.value}))} placeholder="ex: gluten, lactose..." /></div>
            </div>
            <div style={{ marginTop:14 }}><label style={S.label}>Description</label><textarea style={S.textarea} value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Courte description du plat" /></div>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:12, marginTop:24 }}>
              <button style={S.btn("#5a4a30","transparent")} onClick={()=>setModal(null)}>Annuler</button>
              <button style={S.btn("#8fad88")} onClick={savePlat}>{editId?"Enregistrer":"Ajouter le plat"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL MENU ────────────────────────────────────────────────────── */}
      {modal === "menu" && (
        <div style={S.modal} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={S.modalBox(680)}>
            <div style={S.modalTitle}>{editId?"Modifier le menu":"Nouveau menu"}</div>
            <div style={S.grid2}>
              <div><label style={S.label}>Nom du menu *</label><input style={S.input} value={form.nom||""} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="ex: Menu Prestige" /></div>
              <div><label style={S.label}>Description</label><input style={S.input} value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Courte description" /></div>
            </div>
            <hr style={S.divider} />
            <div style={{ fontSize:11, color:"#b07db0", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>Sélectionner les plats</div>
            {plats.length===0&&<div style={{ fontSize:12, color:"#3a2e1a", textAlign:"center", padding:24, border:"1px dashed #2a2010", borderRadius:4 }}>Aucun plat dans la bibliothèque — créez d'abord vos plats</div>}
            {CATEGORIES_PLATS.map(cat=>{
              const cPlats=plats.filter(p=>p.categorie===cat.id);
              if(cPlats.length===0) return null;
              return <div key={cat.id} style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:"#7a6a50", marginBottom:8 }}>{cat.emoji} {cat.label}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {cPlats.map(p=>{
                    const sel=(form.platIds||[]).includes(p.id);
                    return <div key={p.id} onClick={()=>togglePlatInMenu(p.id)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${sel?"#8fad88":"#2a2010"}`, background:sel?"#8fad8822":"transparent", cursor:"pointer", fontSize:12, color:sel?"#8fad88":"#7a6a50", transition:"all 0.15s" }}>
                      {p.nom} <span style={{ opacity:0.6 }}>{parseFloat(p.prixHT).toFixed(2)}€</span>
                    </div>;
                  })}
                </div>
              </div>;
            })}
            {(form.platIds||[]).length>0&&(
              <div style={{ background:"#0a0704", borderRadius:4, padding:12, marginTop:8, textAlign:"right" }}>
                <span style={{ fontSize:11, color:"#7a6a50" }}>Total HT du menu : </span>
                <span style={{ fontSize:16, fontWeight:700, color:"#c8a96e" }}>{totalMenuHT(form).toFixed(2)} €</span>
                <span style={{ fontSize:11, color:"#7a6a50" }}> · TTC : {(totalMenuHT(form)*1.2).toFixed(2)} €</span>
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:12, marginTop:24 }}>
              <button style={S.btn("#5a4a30","transparent")} onClick={()=>setModal(null)}>Annuler</button>
              <button style={S.btn("#b07db0")} onClick={saveMenu}>{editId?"Enregistrer":"Créer le menu"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE ────────────────────────────────────────────────── */}
      {confirmDelete && (
        <div style={S.modal}>
          <div style={{ ...S.modalBox(380), textAlign:"center" }}>
            <div style={{ fontSize:18, color:"#d9534f", fontWeight:700, marginBottom:12 }}>Supprimer ?</div>
            <div style={{ color:"#7a6a50", fontSize:13, marginBottom:28 }}>Cette action est irréversible.</div>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <button style={S.btn("#5a4a30","transparent")} onClick={()=>setConfirmDelete(null)}>Annuler</button>
              <button style={S.btn("#d9534f")} onClick={()=>{
                if(confirmDelete.type==="rez") setReservations(p=>p.filter(r=>r.id!==confirmDelete.id));
                if(confirmDelete.type==="devis") setDevis(p=>p.filter(d=>d.id!==confirmDelete.id));
                if(confirmDelete.type==="plat") setPlats(p=>p.filter(x=>x.id!==confirmDelete.id));
                if(confirmDelete.type==="menu") setMenus(p=>p.filter(x=>x.id!==confirmDelete.id));
                setConfirmDelete(null);
              }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
