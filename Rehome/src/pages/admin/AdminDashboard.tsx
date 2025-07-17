import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import useUserSessionStore from "../../services/state/useUserSessionStore";

const tables = [
  "profiles",
  "admin_users",
  "furniture_items",
  "city_base_charges",
  "city_day_data",
  "pricing_config",
  "rehome_orders",
  "marketplace_furniture",
  "marketplace_bids",
  "item_donations",
];

function EditableCell({ value, onChange, required }: { value: any; onChange: (v: any) => void; required?: boolean }) {
  return (
    <input
      style={{ width: "100%", border: required ? "2px solid #f00" : "1px solid #ccc", padding: 2 }}
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
    />
  );
}

const PAGE_SIZE = 20;

export default function AdminDashboard() {
  const { user, role } = useUserSessionStore();
  const [tab, setTab] = useState<'data' | 'audit'>('data');
  // Data tables state (existing)
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<{ [table: string]: number | null }>({});
  const [editData, setEditData] = useState<{ [table: string]: any }>({});
  const [addData, setAddData] = useState<{ [table: string]: any }>({});
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [actionMessage, setActionMessage] = useState<{ [key: string]: string }>({});
  const [search, setSearch] = useState<{ [key: string]: string }>({});
  const [page, setPage] = useState<{ [key: string]: number }>({});
  const [total, setTotal] = useState<{ [key: string]: number }>({});
  const [validation, setValidation] = useState<{ [table: string]: { [field: string]: boolean } }>({});

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);

  // Helper: get required fields (for demo, assume all fields except id/_id are required)
  const getRequiredFields = (row: any) => {
    if (!row) return [];
    return Object.keys(row).filter(k => !k.endsWith("id") && k !== "id" && k !== "created_at" && k !== "updated_at");
  };

  // Helper: log to audit_logs
  const logAudit = async (action: string, table: string, recordId: any, oldValues: any, newValues: any) => {
    if (!user) return;
    await supabase.from("audit_logs").insert({
      admin_id: user?.sub || null,
      action,
      table_name: table,
      record_id: String(recordId),
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      created_at: new Date().toISOString(),
    });
  };

  // Fetch table data with search and pagination
  const fetchTable = async (table: string, searchValue = "", pageNum = 1) => {
    let query = supabase.from(table).select("*", { count: "exact" });
    if (searchValue && data[table]?.[0]) {
      // Search all string fields
      const fields = Object.keys(data[table][0]).filter(
        (k) => typeof data[table][0][k] === "string"
      );
      if (fields.length > 0) {
        const orString = fields.map((f) => `${f}.ilike.%${searchValue}%`).join(",");
        query = query.or(orString);
      }
    }
    const from = (pageNum - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);
    const { data: rows, error, count } = await query;
    if (error) {
      setData((prev: any) => ({ ...prev, [table]: { error: error.message } }));
    } else {
      setData((prev: any) => ({ ...prev, [table]: rows }));
      setTotal((prev) => ({ ...prev, [table]: count || 0 }));
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async (searchValue = "", pageNum = 1) => {
    setAuditLoading(true);
    setAuditError(null);
    let query = supabase.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (searchValue) {
      query = query.or([
        `action.ilike.%${searchValue}%`,
        `table_name.ilike.%${searchValue}%`,
        `record_id.ilike.%${searchValue}%`,
        `admin_id.ilike.%${searchValue}%`
      ].join(","));
    }
    const from = (pageNum - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);
    const { data, error, count } = await query;
    if (error) setAuditError(error.message);
    else {
      setAuditLogs(data || []);
      setAuditTotal(count || 0);
    }
    setAuditLoading(false);
  };

  // Initial fetch for all tables
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all(
      tables.map((table) =>
        supabase
          .from(table)
          .select("*", { count: "exact" })
          .range(0, PAGE_SIZE - 1)
          .then(({ data, error, count }) => ({ table, data, error, count }))
      )
    )
      .then((results) => {
        const newData: any = {};
        const newTotal: any = {};
        results.forEach(({ table, data, error, count }) => {
          if (error) {
            newData[table] = { error: error.message };
          } else {
            newData[table] = data;
            newTotal[table] = count || 0;
          }
        });
        setData(newData);
        setTotal(newTotal);
        setPage(tables.reduce((acc, t) => ({ ...acc, [t]: 1 }), {}));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch audit logs on tab switch or search/page change
  useEffect(() => {
    if (tab === 'audit') fetchAuditLogs(auditSearch, auditPage);
    // eslint-disable-next-line
  }, [tab, auditSearch, auditPage]);

  // CRUD handlers (with validation, RBAC, audit, confirmation)
  const handleEdit = (table: string, idx: number) => {
    setEditRow({ ...editRow, [table]: idx });
    setEditData({ ...editData, [table]: { ...data[table][idx] } });
    setActionMessage({ ...actionMessage, [table]: "" });
    setValidation({ ...validation, [table]: {} });
  };
  const handleEditChange = (table: string, key: string, value: any) => {
    setEditData({ ...editData, [table]: { ...editData[table], [key]: value } });
  };
  const handleEditSave = async (table: string, idx: number) => {
    if (role !== "admin" && role !== "editor") {
      setActionMessage({ ...actionMessage, [table]: "You do not have permission to edit." });
      return;
    }
    setActionLoading({ ...actionLoading, [table]: true });
    setActionMessage({ ...actionMessage, [table]: "" });
    const row = editData[table];
    const idKey = Object.keys(row).find(k => k === "id" || k.endsWith("_id"));
    if (!idKey) {
      setActionLoading({ ...actionLoading, [table]: false });
      setActionMessage({ ...actionMessage, [table]: "No id field found" });
      return;
    }
    // Validate required fields
    const requiredFields = getRequiredFields(row);
    const missing: any = {};
    requiredFields.forEach(f => { if (!row[f]) missing[f] = true; });
    if (Object.keys(missing).length > 0) {
      setValidation({ ...validation, [table]: missing });
      setActionLoading({ ...actionLoading, [table]: false });
      setActionMessage({ ...actionMessage, [table]: "Please fill all required fields." });
      return;
    }
    const oldRow = data[table][idx];
    const { error } = await supabase.from(table).update(row).eq(idKey, row[idKey]);
    if (error) {
      setActionMessage({ ...actionMessage, [table]: error.message });
    } else {
      setActionMessage({ ...actionMessage, [table]: "Saved successfully!" });
      await logAudit("update", table, row[idKey], oldRow, row);
      await fetchTable(table, search[table], page[table] || 1);
      setEditRow({ ...editRow, [table]: null });
    }
    setActionLoading({ ...actionLoading, [table]: false });
  };
  const handleDelete = async (table: string, idx: number) => {
    if (role !== "admin") {
      setActionMessage({ ...actionMessage, [table]: "You do not have permission to delete." });
      return;
    }
    if (!window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;
    setActionLoading({ ...actionLoading, [table]: true });
    setActionMessage({ ...actionMessage, [table]: "" });
    const row = data[table][idx];
    const idKey = Object.keys(row).find(k => k === "id" || k.endsWith("_id"));
    if (!idKey) {
      setActionLoading({ ...actionLoading, [table]: false });
      setActionMessage({ ...actionMessage, [table]: "No id field found" });
      return;
    }
    const { error } = await supabase.from(table).delete().eq(idKey, row[idKey]);
    if (error) {
      setActionMessage({ ...actionMessage, [table]: error.message });
    } else {
      setActionMessage({ ...actionMessage, [table]: "Deleted successfully!" });
      await logAudit("delete", table, row[idKey], row, null);
      await fetchTable(table, search[table], page[table] || 1);
    }
    setActionLoading({ ...actionLoading, [table]: false });
  };
  const handleAddChange = (table: string, key: string, value: any) => {
    setAddData({ ...addData, [table]: { ...addData[table], [key]: value } });
  };
  const handleAdd = async (table: string) => {
    if (role !== "admin" && role !== "editor") {
      setActionMessage({ ...actionMessage, [table]: "You do not have permission to add." });
      return;
    }
    setActionLoading({ ...actionLoading, [table]: true });
    setActionMessage({ ...actionMessage, [table]: "" });
    const row = addData[table];
    if (!row) {
      setActionLoading({ ...actionLoading, [table]: false });
      return;
    }
    // Validate required fields
    const requiredFields = getRequiredFields(row);
    const missing: any = {};
    requiredFields.forEach(f => { if (!row[f]) missing[f] = true; });
    if (Object.keys(missing).length > 0) {
      setValidation({ ...validation, [table]: missing });
      setActionLoading({ ...actionLoading, [table]: false });
      setActionMessage({ ...actionMessage, [table]: "Please fill all required fields." });
      return;
    }
    const { data: inserted, error } = await supabase.from(table).insert(row).select();
    if (error) {
      setActionMessage({ ...actionMessage, [table]: error.message });
    } else {
      setActionMessage({ ...actionMessage, [table]: "Added successfully!" });
      setAddData({ ...addData, [table]: {} });
      await logAudit("insert", table, inserted?.[0]?.id || "", null, inserted?.[0]);
      await fetchTable(table, search[table], page[table] || 1);
    }
    setActionLoading({ ...actionLoading, [table]: false });
  };

  // Search and pagination handlers for data tables (unchanged)
  const handleSearchChange = (table: string, value: string) => {
    setSearch({ ...search, [table]: value });
    setPage({ ...page, [table]: 1 });
    fetchTable(table, value, 1);
  };
  const handlePageChange = (table: string, newPage: number) => {
    setPage({ ...page, [table]: newPage });
    fetchTable(table, search[table], newPage);
  };

  // Audit logs search/pagination handlers
  const handleAuditSearchChange = (value: string) => {
    setAuditSearch(value);
    setAuditPage(1);
  };
  const handleAuditPageChange = (newPage: number) => {
    setAuditPage(newPage);
  };

  if (loading) return <div style={{ padding: 32 }}>Loading data from Supabase...</div>;
  if (error) return <div style={{ color: "red", padding: 32 }}>Error: {error}</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1>Admin Dashboard (Full CRUD, Audit, RBAC, Validation)</h1>
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => setTab('data')} style={{ marginRight: 8, fontWeight: tab === 'data' ? 'bold' : undefined }}>Data Tables</button>
        <button onClick={() => setTab('audit')} style={{ fontWeight: tab === 'audit' ? 'bold' : undefined }}>Audit Logs</button>
      </div>
      {tab === 'data' ? (
        <>
          {/* Existing data tables code here (unchanged) */}
          {tables.map((table) => (
            <div key={table} style={{ marginBottom: 40 }}>
              <h2>{table}</h2>
              <div style={{ marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={search[table] || ""}
                  onChange={e => handleSearchChange(table, e.target.value)}
                  style={{ padding: 4, width: 200, marginRight: 8 }}
                />
                <span>
                  Page {page[table] || 1} of {Math.ceil((total[table] || 1) / PAGE_SIZE)}
                </span>
                <button
                  onClick={() => handlePageChange(table, (page[table] || 1) - 1)}
                  disabled={(page[table] || 1) <= 1}
                  style={{ marginLeft: 8 }}
                >
                  Prev
                </button>
                <button
                  onClick={() => handlePageChange(table, (page[table] || 1) + 1)}
                  disabled={(page[table] || 1) >= Math.ceil((total[table] || 1) / PAGE_SIZE)}
                  style={{ marginLeft: 4 }}
                >
                  Next
                </button>
              </div>
              {actionMessage[table] && (
                <div style={{ color: actionMessage[table].includes("success") ? "green" : "red", marginBottom: 8 }}>
                  {actionMessage[table]}
                </div>
              )}
              {data[table]?.error ? (
                <div style={{ color: "red" }}>Error: {data[table].error}</div>
              ) : (
                <>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
                    <thead>
                      <tr>
                        {data[table]?.[0] &&
                          Object.keys(data[table][0]).map((col) => (
                            <th key={col} style={{ border: "1px solid #ccc", padding: 4 }}>{col}</th>
                          ))}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data[table]?.map((row: any, i: number) => (
                        <tr key={i}>
                          {Object.entries(row).map(([col, val]) => (
                            <td key={col} style={{ border: "1px solid #eee", padding: 4 }}>
                              {editRow[table] === i ? (
                                <EditableCell
                                  value={editData[table][col]}
                                  onChange={v => handleEditChange(table, col, v)}
                                  required={validation[table]?.[col]}
                                />
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                          <td>
                            {editRow[table] === i ? (
                              <>
                                <button onClick={() => handleEditSave(table, i)} disabled={actionLoading[table]}>
                                  {actionLoading[table] ? "Saving..." : "Save"}
                                </button>
                                <button onClick={() => setEditRow({ ...editRow, [table]: null })} disabled={actionLoading[table]}>Cancel</button>
                              </>
                            ) : (
                              <>
                                {(role === "admin" || role === "editor") && (
                                  <button onClick={() => handleEdit(table, i)} disabled={actionLoading[table]}>Edit</button>
                                )}
                                {role === "admin" && (
                                  <button onClick={() => handleDelete(table, i)} disabled={actionLoading[table]}>
                                    {actionLoading[table] ? "Deleting..." : "Delete"}
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* Add new row */}
                      {data[table]?.[0] && (role === "admin" || role === "editor") && (
                        <tr>
                          {Object.keys(data[table][0]).map((col) => (
                            <td key={col} style={{ border: "1px solid #eee", padding: 4 }}>
                              <EditableCell
                                value={addData[table]?.[col] ?? ""}
                                onChange={v => handleAddChange(table, col, v)}
                                required={validation[table]?.[col]}
                              />
                            </td>
                          ))}
                          <td>
                            <button onClick={() => handleAdd(table)} disabled={actionLoading[table]}>
                              {actionLoading[table] ? "Adding..." : "Add"}
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          ))}
        </>
      ) : (
        <div>
          <h2>Audit Logs</h2>
          <div style={{ marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Search audit logs..."
              value={auditSearch}
              onChange={e => handleAuditSearchChange(e.target.value)}
              style={{ padding: 4, width: 200, marginRight: 8 }}
            />
            <span>
              Page {auditPage} of {Math.ceil((auditTotal || 1) / PAGE_SIZE)}
            </span>
            <button
              onClick={() => handleAuditPageChange(auditPage - 1)}
              disabled={auditPage <= 1}
              style={{ marginLeft: 8 }}
            >
              Prev
            </button>
            <button
              onClick={() => handleAuditPageChange(auditPage + 1)}
              disabled={auditPage >= Math.ceil((auditTotal || 1) / PAGE_SIZE)}
              style={{ marginLeft: 4 }}
            >
              Next
            </button>
          </div>
          {auditLoading ? (
            <div>Loading audit logs...</div>
          ) : auditError ? (
            <div style={{ color: "red" }}>{auditError}</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ccc", padding: 4 }}>Timestamp</th>
                  <th style={{ border: "1px solid #ccc", padding: 4 }}>Admin</th>
                  <th style={{ border: "1px solid #ccc", padding: 4 }}>Action</th>
                  <th style={{ border: "1px solid #ccc", padding: 4 }}>Table</th>
                  <th style={{ border: "1px solid #ccc", padding: 4 }}>Record ID</th>
                  <th style={{ border: "1px solid #ccc", padding: 4 }}>Old Values</th>
                  <th style={{ border: "1px solid #ccc", padding: 4 }}>New Values</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, i) => (
                  <tr key={i}>
                    <td style={{ border: "1px solid #eee", padding: 4 }}>{log.created_at}</td>
                    <td style={{ border: "1px solid #eee", padding: 4 }}>{log.admin_id}</td>
                    <td style={{ border: "1px solid #eee", padding: 4 }}>{log.action}</td>
                    <td style={{ border: "1px solid #eee", padding: 4 }}>{log.table_name}</td>
                    <td style={{ border: "1px solid #eee", padding: 4 }}>{log.record_id}</td>
                    <td style={{ border: "1px solid #eee", padding: 4 }}>
                      <pre style={{ whiteSpace: "pre-wrap", maxWidth: 200, overflow: "auto" }}>{log.old_values}</pre>
                    </td>
                    <td style={{ border: "1px solid #eee", padding: 4 }}>
                      <pre style={{ whiteSpace: "pre-wrap", maxWidth: 200, overflow: "auto" }}>{log.new_values}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
} 