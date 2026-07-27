import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { useTranslation } from "../i18n/I18nProvider.jsx";
import PageInfo from "../components/PageInfo.jsx";

export default function TracesPage() {
  const { t } = useTranslation();
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [keyFilter, setKeyFilter] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyFilter) params.set("key_data_point", keyFilter);
    if (minValue) params.set("min_value", minValue);
    if (maxValue) params.set("max_value", maxValue);
    api.get(`/traces?${params.toString()}`).then((d) => { setTraces(Array.isArray(d) ? d : []); }).catch(() => setTraces([])).finally(() => setLoading(false));
  }, [keyFilter, minValue, maxValue]);

  const filtered = filter === "all" ? traces : traces.filter((t) => (t.category || "").toLowerCase() === filter.toLowerCase());

  function catClass(c) {
    if (c === "process_data") return "bg-status-bg-info text-status-info";
    if (c === "quality") return "bg-status-bg-success text-status-success";
    if (c === "material") return "bg-accent-lilac-bg text-brand-lilac";
    if (c === "energy") return "bg-status-bg-warning text-status-warning";
    if (c === "op_input") return "bg-brand-primary/10 text-brand-primary";
    return "bg-neutral-100 text-neutral-600";
  }

  function formatValue(val) {
    if (val == null) return "-";
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    try { const obj = JSON.parse(val); if (typeof obj === "object" && obj !== null) { const numericValue = obj.numeric_value; return numericValue != null ? String(numericValue) : JSON.stringify(obj).slice(0, 100); } } catch {}
    return String(val).slice(0, 100);
  }

  function formatDate(d) { if (!d) return "-"; return new Date(d).toLocaleString("de-DE"); }

  const categories = ["all", "process_data", "quality", "material", "energy", "op_input"];

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 inline-flex items-center">{t("traces.title")}<PageInfo page="traces" /></h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t("traces.subtitle")}</p>
        </div>

        <div className="flex gap-2 flex-wrap items-end bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
          <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{t("traces.keyDataPoint")}</label><input type="text" value={keyFilter} onChange={(e) => setKeyFilter(e.target.value)} placeholder={t("traces.placeholderKey")} className="px-3 py-2 border border-neutral-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary w-48" /></div>
          <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{t("traces.minValue")}</label><input type="number" value={minValue} onChange={(e) => setMinValue(e.target.value)} placeholder={t("traces.placeholderMin")} className="px-3 py-2 border border-neutral-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary w-24" /></div>
          <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{t("traces.maxValue")}</label><input type="number" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} placeholder={t("traces.placeholderMax")} className="px-3 py-2 border border-neutral-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary w-24" /></div>
          <button onClick={() => { setKeyFilter(""); setMinValue(""); setMaxValue(""); }} className="px-3 py-2 bg-neutral-100 text-neutral-600 rounded-md text-xs font-semibold hover:bg-neutral-200 transition-colors">{t("traces.resetFilters")}</button>
        </div>

        <div className="flex gap-1.5 flex-wrap" role="group">
          {categories.map((c) => (<button key={c} onClick={() => setFilter(c)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${filter === c ? "bg-brand-primary text-white" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"}`}>{c === "all" ? t("traces.filterAll") : c}</button>))}
        </div>

        {loading && <p className="text-center text-neutral-400 py-12 text-sm">{t("traces.loading")}</p>}
        {!loading && filtered.length === 0 && <p className="text-center text-neutral-400 py-12 text-sm">{t("traces.noTraces")}</p>}

        {filtered.length > 0 && (
          <div className="bg-white rounded-lg shadow-card border border-neutral-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t("traces.id")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t("traces.machine")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t("traces.keyDataPointCol")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t("traces.value")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t("traces.category")}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t("traces.timestamp")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-3.5 text-xs font-mono text-neutral-500">{(t.id || "").substring(0, 8)}</td>
                    <td className="px-5 py-3.5 text-sm text-neutral-700">{t.machineId || "-"}</td>
                    <td className="px-5 py-3.5 text-sm font-mono text-neutral-700">{t.keyDataPoint || "-"}</td>
                    <td className="px-5 py-3.5 text-sm font-mono text-neutral-700">{formatValue(t.value)}</td>
                    <td className="px-5 py-3.5"><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${catClass(t.category)}`}>{t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : "-"}</span></td>
                    <td className="px-5 py-3.5 text-xs text-neutral-500">{formatDate(t.collected_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
