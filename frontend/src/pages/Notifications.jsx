import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../providers/AuthProvider.jsx";
import { useTranslation } from "../i18n/I18nProvider.jsx";
import PageInfo from "../components/PageInfo.jsx";

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("rules");
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [channelForm, setChannelForm] = useState({ channel: "email", enabled: true });
  const [channels, setChannels] = useState([]);
  const [newRule, setNewRule] = useState({ name: "", severity: "warning", condition: "", message_template: "{machine_id}: {value}", channels: "mqtt,websocket", machine_id: "" });

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    setLoading(true);
    if (activeTab === "rules") loadRules();
    if (activeTab === "history") loadHistory();
    if (activeTab === "channels") loadChannels();
    setLoading(false);
  }, [activeTab]);

  async function loadRules() { try { const r = await api.get("/notifications/rules"); setRules(Array.isArray(r) ? r : []); } catch {} }
  async function loadHistory() { try { const h = await api.get("/notifications/history?limit=100"); setHistory(Array.isArray(h) ? h : []); } catch {} }
  async function loadChannels() { try { const c = await api.get("/notifications/channels"); setChannels(Array.isArray(c) ? c : []); } catch {} }
  async function loadStats() { try { const s = await api.get("/notifications/stats"); if (s) setStats(s); } catch {} }

  async function toggleRule(id) { try { await api.post(`/notifications/rules/${id}/toggle`); loadRules(); } catch {} }

  async function deleteRule(id) {
    if (!confirm(t("notifications.confirmDelete"))) return;
    try { await api.del(`/notifications/rules/${id}`); loadRules(); } catch {}
  }

  async function createRule(e) {
    e.preventDefault();
    const payload = newRule.channels ? { ...newRule, channels: newRule.channels.split(",").map(c => c.trim()).filter(Boolean) } : { ...newRule };
    try { await api.post("/notifications/rules", payload); setShowForm(false); loadRules(); setNewRule({ name: "", severity: "warning", condition: "", message_template: "{machine_id}: {value}", channels: "mqtt,websocket", machine_id: "" }); } catch {}
  }

  async function createChannel(e) {
    e.preventDefault();
    try { const p = { ...channelForm, config: "{}" }; await api.post("/notifications/channels", p); loadChannels(); } catch {}
  }

  const severityColors = { info: "#6b7280", warning: "#f59e0b", error: "#ef4444", critical: "#dc2626" };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 inline-flex items-center">{t("notifications.title")}<PageInfo page="notifications" /></h1>
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border"><div className="text-sm text-gray-500">{t("notifications.totalRules")}</div><div className="text-2xl font-bold">{stats.total}</div></div>
          <div className="bg-white rounded-lg p-4 shadow-sm border"><div className="text-sm text-gray-500">{t("notifications.active")}</div><div className="text-2xl font-bold" style={{ color: "#10b981" }}>{stats.active}</div></div>
          <div className="bg-white rounded-lg p-4 shadow-sm border"><div className="text-sm text-gray-500">{t("notifications.firing")}</div><div className="text-2xl font-bold" style={{ color: "#ef4444" }}>{stats.firing}</div></div>
        </div>
      )}

      <div className="flex gap-2 mb-4 border-b">
        {[["rules", t("notifications.alertRules")], ["history", t("notifications.history")], ["channels", t("notifications.channels")]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`px-4 py-2 font-medium ${activeTab === key ? "border-b-2 border-blue-500" : "text-gray-500"}`}>{label}</button>
        ))}
      </div>

      {loading && <p className="text-gray-400">{t("common.loading")}</p>}

      {activeTab === "rules" && !loading && (
        <div>
          <button onClick={() => setShowForm(!showForm)} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t("notifications.newRule")}</button>

          {showForm && (
            <form onSubmit={createRule} className="mb-4 p-4 bg-white shadow-sm border rounded-lg space-y-3">
              <input type="text" placeholder={t("notifications.ruleName")} value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })} className="border px-2 py-1 rounded w-full" />
              <select value={newRule.severity} onChange={e => setNewRule({ ...newRule, severity: e.target.value })} className="border px-2 py-1 rounded w-full">{["info", "warning", "error", "critical"].map(s => <option key={s} value={s}>{s}</option>)}</select>
              <input type="text" placeholder={t("notifications.conditionPlaceholder")} value={newRule.condition} onChange={e => setNewRule({ ...newRule, condition: e.target.value })} className="border px-2 py-1 rounded w-full" />
              <input type="text" placeholder={t("notifications.machineUuid")} value={newRule.machine_id} onChange={e => setNewRule({ ...newRule, machine_id: e.target.value })} className="border px-2 py-1 rounded w-full" />
              <input type="text" placeholder={t("notifications.messageTemplate")} value={newRule.message_template} onChange={e => setNewRule({ ...newRule, message_template: e.target.value })} className="border px-2 py-1 rounded w-full" />
              <input type="text" placeholder={t("notifications.channelsPlaceholder")} value={newRule.channels} onChange={e => setNewRule({ ...newRule, channels: e.target.value })} className="border px-2 py-1 rounded w-full" />
              <div className="flex gap-2"><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{t("notifications.create")}</button><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500">{t("notifications.cancel")}</button></div>
            </form>
          )}

          {rules.length === 0 ? <p className="text-gray-400">{t("notifications.noRules")}</p> : (
            <table className="w-full text-sm bg-white shadow-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-2 text-left">{t("notifications.ruleName")}</th><th className="px-4 py-2 text-left">{t("notifications.severity")}</th><th className="px-4 py-2 text-left">{t("notifications.status")}</th><th className="px-4 py-2 text-left">{t("notifications.condition")}</th><th></th></tr></thead>
              <tbody>{rules.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2"><span style={{ background: severityColors[r.severity || "warning"], color: "#fff", padding: "2px 8px", borderRadius: "4px" }}>{r.severity}</span></td>
                  <td className="px-4 py-2">{r.is_active ? <span className="text-green-600">{t("notifications.activeLabel")}</span> : <span className="text-gray-400">{t("notifications.inactiveLabel")}</span>}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.condition}</td>
                  <td className="px-4 py-2 flex gap-1"><button onClick={() => toggleRule(r.id)} className="text-sm px-2 py-1 bg-blue-50 rounded hover:bg-blue-100">{r.is_active ? t("notifications.stop") : t("notifications.start")}</button><button onClick={() => deleteRule(r.id)} className="text-sm px-2 py-1 bg-red-50 rounded hover:bg-red-100 text-red-600">{t("notifications.delete")}</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "history" && !loading && (
        <div className="space-y-2">
          {history.length === 0 ? <p className="text-gray-400">{t("notifications.noHistory")}</p> : history.map(h => (
            <div key={h.id} className="bg-white p-3 shadow-sm border rounded-lg flex items-start gap-3">
              <span style={{ background: severityColors[h.severity || "warning"], color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>{h.severity}</span>
              <div className="flex-1 min-w-0"><div className="font-medium truncate">{h.message}</div><div className="text-xs text-gray-500">{h.machine_id ? `Machine: ${h.machine_id} • ` : ""}{h.delivered ? "✓" : "✗"}<span>{new Date(h.created_at).toLocaleString("de-DE")}</span></div></div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "channels" && !loading && (
        <div>
          <form onSubmit={createChannel} className="mb-4 p-4 bg-white shadow-sm border rounded-lg space-y-3">
            <h3 className="font-medium mb-2">{t("notifications.newChannel")}</h3>
            <select value={channelForm.channel} onChange={e => setChannelForm({ ...channelForm, channel: e.target.value })} className="border px-2 py-1 rounded w-full">{["email", "push", "mqtt", "websocket"].map(c => <option key={c} value={c}>{c}</option>)}</select>
            <label><input type="checkbox" checked={channelForm.enabled} onChange={e => setChannelForm({ ...channelForm, enabled: e.target.checked })} className="mr-2"/> {t("notifications.channelEnabled")}</label>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{t("notifications.channelCreate")}</button>
          </form>

          {channels.length === 0 ? <p className="text-gray-400">{t("notifications.noChannels")}</p> : (
            <table className="w-full text-sm bg-white shadow-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-2 text-left">{t("notifications.channelLabel")}</th><th className="px-4 py-2 text-left">{t("notifications.channelStatus")}</th></tr></thead>
              <tbody>{channels.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50"><td className="px-4 py-2 font-medium">{c.channel}</td><td className="px-4 py-2 text-xs text-gray-500">{c.enabled ? t("notifications.activeLabel") : t("notifications.inactiveLabel")}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
