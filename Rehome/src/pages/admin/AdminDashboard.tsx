import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { FaDatabase, FaHistory, FaSearch, FaEdit, FaTrash, FaPlus, FaSave, FaTimes } from 'react-icons/fa';
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
      className={`w-full px-2 py-1 border rounded ${required ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-orange-500`}
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
    />
  );
}

const PAGE_SIZE = 20;

export default function AdminDashboard() {
  const { user, role } = useUserSessionStore();
  const [activeTab, setActiveTab] = useState<'data' | 'audit'>('data');
  
  // Data tables state
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

  // Helper: get required fields
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

  // Fetch audit logs on tab switch
  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs(auditSearch, auditPage);
  }, [activeTab, auditSearch, auditPage]);

  // CRUD handlers
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

  const handleSearchChange = (table: string, value: string) => {
    setSearch({ ...search, [table]: value });
    setPage({ ...page, [table]: 1 });
    fetchTable(table, value, 1);
  };

  const handlePageChange = (table: string, newPage: number) => {
    setPage({ ...page, [table]: newPage });
    fetchTable(table, search[table], newPage);
  };

  const handleAuditSearchChange = (value: string) => {
    setAuditSearch(value);
    setAuditPage(1);
  };

  const handleAuditPageChange = (newPage: number) => {
    setAuditPage(newPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col pt-24 items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Manage database tables, audit logs, and system data</p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-2 shadow-lg">
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'data'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaDatabase className="mr-2" />
              Data Tables
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors ml-2 ${
                activeTab === 'audit'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaHistory className="mr-2" />
              Audit Logs
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'data' ? (
          <div className="space-y-8">
            {tables.map((table) => (
              <motion.div
                key={table}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-800 capitalize">
                    {table.replace(/_/g, ' ')}
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* Search and Pagination */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={search[table] || ""}
                        onChange={e => handleSearchChange(table, e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">
                        Page {page[table] || 1} of {Math.ceil((total[table] || 1) / PAGE_SIZE)}
                      </span>
                      <button
                        onClick={() => handlePageChange(table, (page[table] || 1) - 1)}
                        disabled={(page[table] || 1) <= 1}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => handlePageChange(table, (page[table] || 1) + 1)}
                        disabled={(page[table] || 1) >= Math.ceil((total[table] || 1) / PAGE_SIZE)}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  {/* Action Message */}
                  {actionMessage[table] && (
                    <div className={`mb-4 p-3 rounded ${
                      actionMessage[table].includes("success") 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {actionMessage[table]}
                    </div>
                  )}

                  {/* Table */}
                  {data[table]?.error ? (
                    <div className="text-red-500">Error: {data[table].error}</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            {data[table]?.[0] &&
                              Object.keys(data[table][0]).map((col) => (
                                <th key={col} className="border border-gray-300 px-4 py-2 text-left font-medium">
                                  {col}
                                </th>
                              ))}
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data[table]?.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                              {Object.entries(row).map(([col, val]) => (
                                <td key={col} className="border border-gray-300 px-4 py-2">
                                  {editRow[table] === i ? (
                                    <EditableCell
                                      value={editData[table][col]}
                                      onChange={v => handleEditChange(table, col, v)}
                                      required={validation[table]?.[col]}
                                    />
                                  ) : (
                                    <span className="truncate block max-w-xs">{String(val)}</span>
                                  )}
                                </td>
                              ))}
                              <td className="border border-gray-300 px-4 py-2">
                                {editRow[table] === i ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditSave(table, i)}
                                      disabled={actionLoading[table]}
                                      className="flex items-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                    >
                                      <FaSave className="mr-1" />
                                      {actionLoading[table] ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      onClick={() => setEditRow({ ...editRow, [table]: null })}
                                      disabled={actionLoading[table]}
                                      className="flex items-center px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                    >
                                      <FaTimes className="mr-1" />
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex space-x-2">
                                    {(role === "admin" || role === "editor") && (
                                      <button
                                        onClick={() => handleEdit(table, i)}
                                        disabled={actionLoading[table]}
                                        className="flex items-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                      >
                                        <FaEdit className="mr-1" />
                                        Edit
                                      </button>
                                    )}
                                    {role === "admin" && (
                                      <button
                                        onClick={() => handleDelete(table, i)}
                                        disabled={actionLoading[table]}
                                        className="flex items-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                      >
                                        <FaTrash className="mr-1" />
                                        {actionLoading[table] ? "Deleting..." : "Delete"}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                          {/* Add new row */}
                          {data[table]?.[0] && (role === "admin" || role === "editor") && (
                            <tr className="bg-blue-50">
                              {Object.keys(data[table][0]).map((col) => (
                                <td key={col} className="border border-gray-300 px-4 py-2">
                                  <EditableCell
                                    value={addData[table]?.[col] ?? ""}
                                    onChange={v => handleAddChange(table, col, v)}
                                    required={validation[table]?.[col]}
                                  />
                                </td>
                              ))}
                              <td className="border border-gray-300 px-4 py-2">
                                <button
                                  onClick={() => handleAdd(table)}
                                  disabled={actionLoading[table]}
                                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                >
                                  <FaPlus className="mr-1" />
                                  {actionLoading[table] ? "Adding..." : "Add"}
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Audit Logs Tab */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Audit Logs</h2>
            </div>
            
            <div className="p-6">
              {/* Search and Pagination */}
              <div className="flex justify-between items-center mb-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search audit logs..."
                    value={auditSearch}
                    onChange={e => handleAuditSearchChange(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">
                    Page {auditPage} of {Math.ceil((auditTotal || 1) / PAGE_SIZE)}
                  </span>
                  <button
                    onClick={() => handleAuditPageChange(auditPage - 1)}
                    disabled={auditPage <= 1}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => handleAuditPageChange(auditPage + 1)}
                    disabled={auditPage >= Math.ceil((auditTotal || 1) / PAGE_SIZE)}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Audit Table */}
              {auditLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                  <span className="ml-2">Loading audit logs...</span>
                </div>
              ) : auditError ? (
                <div className="text-red-500 p-4">{auditError}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium">Timestamp</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium">Admin</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium">Action</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium">Table</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium">Record ID</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium">Old Values</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-medium">New Values</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{log.created_at}</td>
                          <td className="border border-gray-300 px-4 py-2">{log.admin_id}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              log.action === 'insert' ? 'bg-green-100 text-green-800' :
                              log.action === 'update' ? 'bg-blue-100 text-blue-800' :
                              log.action === 'delete' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">{log.table_name}</td>
                          <td className="border border-gray-300 px-4 py-2">{log.record_id}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <pre className="whitespace-pre-wrap text-xs max-w-xs overflow-auto">
                              {log.old_values}
                            </pre>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <pre className="whitespace-pre-wrap text-xs max-w-xs overflow-auto">
                              {log.new_values}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 