import { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import { api } from "../api/client.js";
import { useAuth } from "../providers/AuthProvider.jsx";
import { canDeleteMachines, canManageMachines } from "../utils/roles.js";
import { useTranslation } from "../i18n/I18nProvider.jsx";
import PageInfo from "../components/PageInfo.jsx";

export default function MachinesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [machines, setMachines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ id: null, name: "", type: "CNC", status: "offline", location: "" });
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const canManage = canManageMachines(user);
  const canDelete = canDeleteMachines(user);

  useEffect(() => {
    api.get("/machines").then((d) => { setMachines(Array.isArray(d) ? d : []); }).catch(() => setMachines([]));
  }, []);

  function requestDelete(machine) { setError(""); setDeleteCandidate(machine); }

  function handleDelete() {
    if (!deleteCandidate) return;
    setError(""); setDeleting(true);
    api.del("/machines/" + deleteCandidate.id).then(() => {
      setMachines((prev) => prev.filter((m) => m.id !== deleteCandidate.id));
      setDeleteCandidate(null);
    }).catch((requestError) => setError(requestError.message)).finally(() => setDeleting(false));
  }

  function handleEdit(m) {
    setShowModal(true);
    setForm({ id: m.id, name: m.name || m.machineName || "", type: m.type || "CNC", status: m.status || "offline", location: m.location || "" });
  }

  function handleSubmit(e) {
    e.preventDefault(); setError("");
    const endpoint = form.id ? "/machines/" + form.id : "/machines";
    const save = form.id ? api.patch : api.post;
    save(endpoint, { name: form.name, type: form.type || "CNC", status: form.status || "offline", location: form.location || "" }).then(() => {
      refreshList(); setShowModal(false);
      setForm({ id: null, name: "", type: "CNC", status: "offline", location: "" });
    }).catch((requestError) => setError(requestError.message));
  }

  function refreshList() { api.get("/machines").then((d) => { setMachines(Array.isArray(d) ? d : []); }).catch(() => setMachines([])); }

  function downloadTemplate() { window.open('/api/machines/template/csv', '_blank'); }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError(""); setImportResult(null); setImporting(true);
    try {
      const text = await file.text();
      const fd = new FormData();
      fd.set('file', text, file.name);
      const res = await api.post('/machines/import/csv', fd);
      setImportResult(res);
    } catch (err) { setError(t("machines.importFailed") + ' ' + (err.message || t("common.unknown"))); }
    finally { setImporting(false); }
  }

  function handleImportSubmit(e) {
    e.preventDefault();
    const fileInput = document.getElementById('csv-file-input');
    if (fileInput && fileInput.files.length > 0) handleImport({ target: { files: fileInput.files } });
  }

  const onlineCount = machines.filter((m) => ["online", "running"].includes(m.status)).length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 inline-flex items-center">{t("machines.title")}<PageInfo page="machines" /></h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t("machines.subtitle")}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard label={t("machines.all")} value={String(machines.length)} icon="" />
          <StatCard label={t("machines.online")} value={String(onlineCount)} icon="✅" />
          <StatCard label={t("machines.offline")} value={String(machines.length - onlineCount)} icon="⚠️" />
        </div>

        <div className="flex justify-end gap-2">
          {canManage && <button onClick={downloadTemplate} className="bg-white border border-neutral-200 text-neutral-700 font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-neutral-50 transition-colors">{t("machines.csvTemplate")}</button>}
          {canManage && <button onClick={() => setShowImportModal(true)} className="bg-white border border-brand-primary/30 text-brand-primary font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-brand-primary/5 transition-colors">{t("machines.csvImport")}</button>}
          {canManage && <button onClick={() => { setForm({ id: null, name: "", type: "CNC", status: "offline", location: "" }); setShowModal(true); }} className="bg-brand-primary text-white font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-[var(--color-brand-primary-dark)] transition-colors">{t("machines.newStation")}</button>}
        </div>

        {error && <p role="alert" className="rounded-lg bg-status-error-bg px-4 py-3 text-sm text-status-error">{error}</p>}

        <input type="text" placeholder={t("machines.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white border border-neutral-200 rounded-lg px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all" />

        {machines.filter((m) => !search || (m.name||"").toLowerCase().includes(search.toLowerCase())).length > 0 ? (
          <div className="bg-white rounded-lg shadow-card border border-neutral-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t("common.id")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t("machines.name")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t("machines.type")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t("machines.status")}</th>
                  {canManage && <th className="px-5 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t("machines.actions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {machines.filter((m) => !search || (m.name||"").toLowerCase().includes(search.toLowerCase())).map((m, i) => {
                  const statusOk = ["online", "running"].includes(m.status);
                  return (
                    <tr key={m.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-mono text-neutral-500">{(m.id||"").substring(0, 8)}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-2 text-sm text-neutral-800">
                          <span className={`w-2 h-2 rounded-full ${statusOk ? "bg-status-success" : "bg-status-error"}`} />
                          {m.name || m.machineName || "-"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-neutral-600">{m.type || "CNC"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${statusOk ? "bg-status-bg-success text-status-success" : "bg-status-bg-error text-status-error"}`}>
                          {m.status ? m.status.charAt(0).toUpperCase() + m.status.slice(1) : "-"}
                        </span>
                      </td>
                      {canManage && <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button onClick={() => handleEdit(m)} className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 rounded-md hover:bg-neutral-200 transition-colors">{t("machines.edit")}</button>
                          {canDelete && <button onClick={() => requestDelete(m)} className="px-3 py-1.5 text-xs font-medium text-white bg-status-error rounded-md hover:bg-[var(--color-status-error-dark)] transition-colors">{t("machines.delete")}</button>}
                        </div>
                      </td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-neutral-400 py-12 text-sm">{t("common.noEntries")}</p>
        )}

        {showModal && (
          <div onClick={() => setShowModal(false)} className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">{form.id ? t("machines.stationEdit") : t("machines.newStationTitle")}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium text-neutral-700 mb-1.5">{t("machines.name")}</label><input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary" /></div>
                <div><label className="block text-sm font-medium text-neutral-700 mb-1.5">{t("machines.type")}</label><select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"><option value="CNC">CNC</option><option value="PLC">PLC</option><option value="Roboter">Roboter</option></select></div>
                <div><label className="block text-sm font-medium text-neutral-700 mb-1.5">{t("machines.status")}</label><select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"><option value="offline">{t("machines.statusOffline")}</option><option value="online">{t("machines.statusOnline")}</option><option value="idle">{t("machines.statusIdle")}</option><option value="maintenance">{t("machines.statusMaintenance")}</option><option value="error">{t("machines.statusError")}</option></select></div>
                <div><label className="block text-sm font-medium text-neutral-700 mb-1.5">{t("machines.location")}</label><input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" /></div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => { setShowModal(false); setForm({ id: null, name: "", type: "CNC", status: "offline", location: "" }); }} className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">{t("machines.cancel")}</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-[var(--color-brand-primary-dark)] transition-colors">{t("machines.save")}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteCandidate && (
          <div onClick={() => !deleting && setDeleteCandidate(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-status-error">{t("machines.deleteTitle")}</p>
              <h2 className="mt-2 text-lg font-bold text-neutral-900">{deleteCandidate.name || t("machines.deleteTitle")} {t("machines.deleteConfirm")}</h2>
              <p className="mt-2 text-sm text-neutral-500">{t("machines.deleteText")}</p>
              <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
                <p><span className="font-medium text-neutral-600">{t("machines.type")}:</span> {deleteCandidate.type || "-"}</p>
                <p><span className="font-medium text-neutral-600">{t("machines.status")}:</span> {deleteCandidate.status || "-"}</p>
                <p><span className="font-medium text-neutral-600">{t("machines.location")}:</span> {deleteCandidate.location || "-"}</p>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" disabled={deleting} onClick={() => setDeleteCandidate(null)} className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 disabled:opacity-50">{t("machines.cancel")}</button>
                <button type="button" disabled={deleting} onClick={handleDelete} className="rounded-lg bg-status-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-status-error-dark)] disabled:opacity-50">{deleting ? t("machines.deleting") : t("machines.deleteBtn")}</button>
              </div>
            </div>
          </div>
        )}

        {showImportModal && (
          <div onClick={() => { setShowImportModal(false); setImportResult(null); setError(""); }} className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">{t("machines.importTitle")}</h2>
              {!importResult && (
                <form onSubmit={handleImportSubmit} className="space-y-4">
                  <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-lg text-sm text-brand-primary">
                    <p className="font-semibold mb-1">{t("machines.importHints")}</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>{t("machines.importHint1")}</li>
                      <li>{t("machines.importHint2")}</li>
                      <li>{t("machines.importHint3")}</li>
                    </ul>
                  </div>
                  <div className="flex gap-2"><button type="button" onClick={downloadTemplate} className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">{t("machines.csvTemplate")}</button></div>
                  <div><label className="block text-sm font-medium text-neutral-700 mb-1.5">{t("machines.importFile")}</label><input id="csv-file-input" type="file" accept=".csv" onChange={(e) => { setError(""); setImportResult(null); }} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/30" /></div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => { setShowImportModal(false); setImportResult(null); setError(""); }} className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">{t("machines.cancel")}</button>
                    <button type="submit" disabled={importing} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-[var(--color-brand-primary-dark)] transition-colors disabled:opacity-50">{importing ? t("common.loading") : t("machines.importBtn")}</button>
                  </div>
                </form>
              )}
              {importResult && (
                <div className="space-y-3">
                  <div className="p-4 bg-status-bg-success text-status-success rounded-lg text-sm font-medium">{importResult.imported} {t("machines.importSuccess")}</div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-neutral-700">{importResult.errors.length} {t("machines.importErrors")}</p>
                      {importResult.errors.map((err, i) => (<div key={i} className="p-3 bg-status-error-bg border border-status-error/20 rounded-lg text-sm text-status-error">{t("machines.importRow")} {err.row}: {err.message}</div>))}
                    </div>
                  )}
                  <div className="flex justify-end pt-2"><button onClick={() => { setShowImportModal(false); setImportResult(null); refreshList(); }} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-[var(--color-brand-primary-dark)] transition-colors">{t("machines.close")}</button></div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
