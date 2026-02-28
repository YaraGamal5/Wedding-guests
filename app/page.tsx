"use client";

import { useEffect, useState } from "react";

type Guest = {
  id: string;
  name: string;
  invited: boolean;
  rsvp_status: string;
  side: "bride" | "groom";
  notes: string | null;
  created_at?: string;
};

export default function Home() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [name, setName] = useState("");
  const [side, setSide] = useState<"bride" | "groom">("bride");
  const [error, setError] = useState<string>("");

  // Fetch guests via server API (uses service role, bypasses RLS)
  const fetchGuests = async () => {
    try {
      const res = await fetch("/api/guests");
      const json = await res.json();
      console.log("API fetch guests response", json);
      if (!res.ok) {
        setError(json.error || "Failed to load guests");
        return;
      }
      setGuests(json.data as Guest[]);
    } catch (err) {
      console.error("Fetch guests error", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  // Add new guest
  const addGuest = async () => {
    if (!name) return;
    setError("");
    try {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, side }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to add guest");
        alert("Error adding guest: " + (result.error || "Unknown error"));
        return;
      }

      console.log("Guest added successfully:", result);
      setName("");
      await fetchGuests();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      alert("Error adding guest: " + errorMessage);
    }
  };

  // Update RSVP (use server PATCH to avoid RLS with anon key)
  const updateRSVP = async (id: string, rsvp_status: "coming" | "not_coming") => {
    try {
      const res = await fetch(`/api/guests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvp_status }),
      });
      if (!res.ok) {
        let json = null;
        try { json = await res.json(); } catch {}
        console.error("updateRSVP error:", json || res.statusText);
        setError((json && json.error) || "Failed to update RSVP");
        return;
      }
      await fetchGuests();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // Toggle invited flag (use server PATCH to avoid RLS for anon key)
  const toggleInvited = async (id: string) => {
    const guest = guests.find((g) => g.id === id);
    if (!guest) return;
    try {
      const res = await fetch(`/api/guests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invited: !guest.invited, rsvp_status: guest.invited ? "pending" : guest.rsvp_status }),
      });
      if (!res.ok) {
        let json = null;
        try { json = await res.json(); } catch {}
        console.error("toggleInvited error:", json || res.statusText);
        setError((json && json.error) || "Failed to toggle invited");
        return;
      }
      await fetchGuests();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  

  // Edit guest name
  const editName = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      const res = await fetch(`/api/guests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) {
        let json = null;
        try { json = await res.json(); } catch {}
        console.error("Edit error:", json || res.statusText);
        setError((json && json.error) || "Failed to edit name");
        return;
      }
      await fetchGuests();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // Remove guest
  const removeGuest = async (id: string) => {
    if (!confirm("Remove this guest?")) return;
    try {
      const res = await fetch(`/api/guests/${id}`, { method: "DELETE" });
      if (!res.ok) {
        let json = null;
        try { json = await res.json(); } catch {}
        console.error("Delete error:", json || res.statusText);
        setError((json && json.error) || "Failed to delete guest");
        return;
      }
      await fetchGuests();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // Download CSV
  const downloadCSV = () => {
    let csv = "Name,Invited,RSVP\n";
    guests.forEach((g) => {
      csv += `"${g.name}",${g.invited},${normalizeStatus(g.rsvp_status)}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "wedding_guests.csv");
    a.click();
  };

  // Counts
  const normalizeStatus = (status: string) => {
    // Handle the case where status has extra quotes like "'pending'"
    return status.replace(/'/g, "");
  };

  const total = guests.length;
  const coming = guests.reduce((sum, g) => {
    const status = normalizeStatus(g.rsvp_status);
    return sum + (status === "coming" ? 1 : 0);
  }, 0);
  const notComing = guests.filter(
    (g) => normalizeStatus(g.rsvp_status) === "not_coming"
  ).length;
  const pending = guests.filter(
    (g) => normalizeStatus(g.rsvp_status) === "pending"
  ).length;

  return (
    <div className="p-10 max-w-4xl mx-auto bg-white rounded-xl shadow-lg mt-10">
      <header className="flex justify-between items-center mb-8 rounded-t-xl bg-gradient-to-r from-green-300 to-blue-200 text-gray-800 p-6">
        <h1 className="text-3xl font-bold">Wedding List Manager</h1>
        <button
          onClick={downloadCSV}
          id="download-btn"
          className="bg-white text-purple-600 font-bold px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition"
        >
          ⬇ Save to Computer (Excel)
        </button>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <div className="flex justify-center mb-8">
        <div className="grid grid-cols-4 gap-4 stats-grid">
          <div className="stat-card">
            <span id="total-stat">{total}</span>
            <label>Total People</label>
          </div>
          <div className="stat-card">
            <span id="invited-stat">{guests.filter((g) => g.invited).length}</span>
            <label>Invited</label>
          </div>
          <div className="stat-card">
            <span id="attending-stat">{coming}</span>
            <label>Confirmed</label>
          </div>
          <div className="stat-card">
            <span id="pending-stat">{pending}</span>
            <label>Pending</label>
          </div>
        </div>
      </div>

      {/* Add Guest */}
      <div className="controls flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          placeholder="Guest Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 rounded p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as "bride" | "groom")}
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="bride">Bride</option>
          <option value="groom">Groom</option>
        </select>
        <button
          id="add-btn"
          onClick={addGuest}
          className="bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 transition"
        >
          Add Guest
        </button>
      </div>

      {/* Guest Table */}
      {guests.length === 0 ? (
        <p className="text-center text-gray-600">No guests yet.</p>
      ) : (
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-left">Click Name to Edit</th>
              <th className="border px-2 py-1 text-left">Side</th>
              <th className="border px-2 py-1 text-left">Status</th>
              <th className="border px-2 py-1 text-left">RSVP</th>
              <th className="border px-2 py-1">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    className="guest-name-input"
                    defaultValue={g.name}
                    onBlur={(e) => editName(g.id, e.target.value)}
                  />
                </td>
                <td className="border px-2 py-1 capitalize">{g.side}</td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() => toggleInvited(g.id)}
                    className={`status-btn ${g.invited ? 'invited' : 'not-invited'}`}
                  >
                    {g.invited ? 'Sent' : 'Pending'}
                  </button>
                </td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() =>
                      updateRSVP(
                        g.id,
                        normalizeStatus(g.rsvp_status) === 'coming' ? 'not_coming' : 'coming'
                      )
                    }
                    className={`status-btn ${
                      normalizeStatus(g.rsvp_status) === 'coming' ? 'attending' : ''
                    }`}
                    disabled={!g.invited}
                    style={!g.invited ? { opacity: 0.3 } : {}}
                  >
                    {normalizeStatus(g.rsvp_status) === 'coming' ? 'Confirmed' : 'Waiting'}
                  </button>
                </td>
                <td className="border px-2 py-1 text-center">
                  <button className="remove-btn" onClick={() => removeGuest(g.id)}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <style jsx global>{`
        /* Inputs and editable name */
        .guest-name-input {
          border: 1px dashed transparent;
          background: none;
          font-weight: bold;
          font-size: 1rem;
          color: #000;
          width: 100%;
          padding: 5px;
        }
        .guest-name-input:hover {
          border-color: #7c3aed;
          background: #fdfaff;
        }

        /* Buttons */
        .status-btn {
          font-size: 0.75rem;
          width: 100px;
          border: none;
          border-radius: 0.5rem;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          color: inherit;
        }
        .not-invited {
          background: #fecaca;
          color: #7f1d1d;
        }
        .invited {
          background: #16a34a;
          color: #ffffff;
        }
        .attending {
          background: #1e3a8a;
          color: #ffffff;
        }
        .remove-btn {
          color: #374151;
          background: none;
          font-size: 1.2rem;
          border: none;
          cursor: pointer;
        }

        /* Stat cards */
        .stat-card {
          background: #f4f7f9; /* very light gray-blue */
          padding: 15px;
          border-radius: 10px;
          text-align: center;
          border: 1px solid #d1dfe6;
        }
        .stat-card span {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937; /* dark gray for numbers */
        }
        .stats-grid label {
          display: block;
          font-size: 0.75rem;
          color: #4b5563; /* muted gray */
          font-weight: 600;
          text-transform: uppercase;
        }

        /* Table headers and cells */
        th {
          color: #000;
          font-weight: 700;
          text-transform: none;
        }
        td {
          color: #000; /* table numbers/text black */
        }

        /* Form controls */
        select, input, .guest-name-input {
          color: #000; /* ensure dropdown and inputs show black text */
        }

        #add-btn { background: #6b7280; color: #ffffff; }
        #add-btn:hover { background: #4b5563; }
        #download-btn { background: #3b82f6; color: #ffffff; }
        #download-btn:hover { background: #2563eb; }

        /* more polished overrides */
        header h1 { letter-spacing: 0.05em; }
        table th { background: #f3f4f6; }
        table td, table th { font-size: 0.875rem; }

        .controls input, .controls select { min-width: 150px; }
      `}]}{
    </div>
  );
}

