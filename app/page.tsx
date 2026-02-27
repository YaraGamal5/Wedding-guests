"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Guest = {
  id: string;
  name: string;
  invited: boolean;
  rsvp_status: "pending" | "coming" | "not_coming";
  plus_one: number;
  side: "bride" | "groom";
  notes: string | null;
};

export default function Home() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [name, setName] = useState("");
  const [side, setSide] = useState<"bride" | "groom">("bride");

  // Fetch guests from Supabase
  const fetchGuests = async () => {
    const { data, error } = await supabase.from("guests").select("*");
    if (error) console.log(error);
    else setGuests(data as Guest[]);
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  // Add new guest
  const addGuest = async () => {
    if (!name) return;
    const { error } = await supabase.from("guests").insert([
      {
        name,
        invited: true,
        rsvp_status: "pending",
        plus_one: 0,
        side,
      },
    ]);
    if (error) console.log(error);
    setName("");
    fetchGuests();
  };

  // Update RSVP
  const updateRSVP = async (id: string, rsvp_status: "coming" | "not_coming") => {
    const { error } = await supabase
      .from("guests")
      .update({ rsvp_status })
      .eq("id", id);
    if (error) console.log(error);
    fetchGuests();
  };

  // Counts
  const total = guests.length;
  const coming = guests.reduce(
    (sum, g) => sum + (g.rsvp_status === "coming" ? 1 + g.plus_one : 0),
    0
  );
  const notComing = guests.filter((g) => g.rsvp_status === "not_coming").length;
  const pending = guests.filter((g) => g.rsvp_status === "pending").length;

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Wedding Guest Dashboard</h1>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="border p-4 flex-1 text-center">
          <div className="font-bold text-xl">{total}</div>
          <div>Total Guests</div>
        </div>
        <div className="border p-4 flex-1 text-center">
          <div className="font-bold text-xl">{coming}</div>
          <div>Coming</div>
        </div>
        <div className="border p-4 flex-1 text-center">
          <div className="font-bold text-xl">{notComing}</div>
          <div>Not Coming</div>
        </div>
        <div className="border p-4 flex-1 text-center">
          <div className="font-bold text-xl">{pending}</div>
          <div>Pending</div>
        </div>
      </div>

      {/* Add Guest */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Guest Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 flex-1"
        />
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as "bride" | "groom")}
          className="border p-2"
        >
          <option value="bride">Bride</option>
          <option value="groom">Groom</option>
        </select>
        <button onClick={addGuest} className="border px-4 py-2">
          Add
        </button>
      </div>

      {/* Guest Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Side</th>
            <th className="border px-2 py-1">RSVP</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((g) => (
            <tr key={g.id}>
              <td className="border px-2 py-1">{g.name}</td>
              <td className="border px-2 py-1">{g.side}</td>
              <td className="border px-2 py-1">{g.rsvp_status}</td>
              <td className="border px-2 py-1 flex gap-1">
                <button
                  onClick={() => updateRSVP(g.id, "coming")}
                  className="border px-2 py-1 bg-green-200"
                >
                  Coming
                </button>
                <button
                  onClick={() => updateRSVP(g.id, "not_coming")}
                  className="border px-2 py-1 bg-red-200"
                >
                  Not Coming
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}