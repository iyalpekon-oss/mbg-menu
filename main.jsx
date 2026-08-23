import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  url && key
    ? createClient(url, key)
    : null;

/* =========================
   HELPER
========================= */

function num(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function fmt(value) {
  if (!value) return "—";

  const d = new Date(`${value}T00:00:00`);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* =========================
   UI COMPONENTS
========================= */

const Card = ({ children }) => (
  <section className="card">{children}</section>
);

const Page = ({ children }) => (
  <main className="wrap">
    {children}

    <footer>
      Sistem Menu MBG • Informasi berdasarkan data yang dimasukkan pengelola
    </footer>
  </main>
);

function Stat({ name, value, unit }) {
  return (
    <div className="stat">
      <small>{name}</small>
      <strong>
        {value ?? "—"} {unit}
      </strong>
    </div>
  );
}

function Bar({ name, value }) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  const width = Math.max(0, Math.min(100, number));

  return (
    <div className="barrow">
      <span>{name}</span>

      <div className="bar">
        <i style={{ width: `${width}%` }} />
      </div>

      <b>{number}%</b>
    </div>
  );
}

/* =========================
   PUBLIC MENU
========================= */

function PublicMenu() {
  const [days, setDays] = useState([]);
  const [date, setDate] = useState("");
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function init() {
      if (!supabase) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("mbg_days")
          .select("*")
          .eq("published", true)
          .order("service_date", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        if (!active) return;

        setDays(data || []);

        if (data && data.length > 0) {
          setDate(data[0].service_date);
          await load(data[0].id);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Gagal memuat data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      active = false;
    };
  }, []);

  async function load(id) {
    if (!supabase || !id) return;

    try {
      const { data, error } = await supabase
        .from("mbg_days")
        .select("*, mbg_items(*)")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      setDay(data);
    } catch (err) {
      setError(err.message || "Gagal memuat menu.");
    }
  }

  if (loading) {
    return (
      <Page>
        <Card>
          <h2>⏳ Memuat data…</h2>
        </Card>
      </Page>
    );
  }

  if (!supabase) {
    return (
      <Page>
        <Card>
          <h2>⚠️ Belum terhubung</h2>
          <p>
            Supabase belum dikonfigurasi. Pastikan environment variables
            sudah diisi di Vercel.
          </p>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <header className="hero">
        <div className="brand">
          🍱 <b>MBG</b>
        </div>

        <h1>Menu Makan Bergizi</h1>

        <p>
          Menu, informasi gizi, dan persentase AKG berdasarkan tanggal.
        </p>
      </header>

      {error && (
        <Card>
          <p>⚠️ {error}</p>
        </Card>
      )}

      <Card>
        <label>Pilih tanggal</label>

        <select
          value={date}
          onChange={async (e) => {
            const selected = e.target.value;

            setDate(selected);

            const selectedDay = days.find(
              (item) => item.service_date === selected
            );

            if (selectedDay) {
              await load(selectedDay.id);
            }
          }}
        >
          {days.length === 0 ? (
            <option value="">Belum ada menu</option>
          ) : (
            days.map((item) => (
              <option key={item.id} value={item.service_date}>
                {fmt(item.service_date)}
              </option>
            ))
          )}
        </select>
      </Card>

      {days.length === 0 && (
        <Card>
          <h2>🍱 Belum ada menu</h2>
          <p>
            Belum ada data menu yang dipublikasikan oleh admin.
          </p>
        </Card>
      )}

      {day && (
        <>
          <Card>
            <div className="date">
              {fmt(day.service_date)}
            </div>

            <h2>
              🍱 {day.title || "Menu MBG"}
            </h2>

            <div className="grid">
              {(day.mbg_items || [])
                .slice()
                .sort(
                  (a, b) =>
                    (a.sort_order || 0) -
                    (b.sort_order || 0)
                )
                .map((item) => (
                  <div className="item" key={item.id}>
                    <div>
                      {item.icon || "🍽️"}
                    </div>

                    <b>{item.name}</b>

                    {item.description && (
                      <small>
                        {item.description}
                      </small>
                    )}
                  </div>
                ))}
            </div>
          </Card>

          <Card>
            <h2>📊 Informasi Gizi</h2>

            <div className="stats">
              <Stat
                name="Energi"
                value={day.energy_kcal}
                unit="kkal"
              />

              <Stat
                name="Protein"
                value={day.protein_g}
                unit="g"
              />

              <Stat
                name="Lemak"
                value={day.fat_g}
                unit="g"
              />

              <Stat
                name="Karbohidrat"
                value={day.carb_g}
                unit="g"
              />
            </div>

            <h3>Persentase AKG</h3>

            <Bar
              name="Energi"
              value={day.energy_akg_pct}
            />

            <Bar
              name="Protein"
              value={day.protein_akg_pct}
            />

            <Bar
              name="Lemak"
              value={day.fat_akg_pct}
            />

            <Bar
              name="Karbohidrat"
              value={day.carb_akg_pct}
            />

            {day.benefits && (
              <div className="note">
                💡 {day.benefits}
              </div>
            )}
          </Card>
        </>
      )}
    </Page>
  );
}

/* =========================
   ADMIN
========================= */

function Admin() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    service_date: "",
    title: "",
    energy_kcal: "",
    protein_g: "",
    fat_g: "",
    carb_g: "",
    energy_akg_pct: "",
    protein_akg_pct: "",
    fat_akg_pct: "",
    carb_akg_pct: "",
    benefits: "",
    published: true,
  });

  const [items, setItems] = useState([
    {
      name: "",
      icon: "🍚",
      description: "",
    },
  ]);

  /* =========================
     AUTH
  ========================= */

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setSession(data.session);
        }
      });

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (mounted) {
          setSession(currentSession);
        }
      }
    );

    return () => {
      mounted = false;

      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function login(e) {
    e.preventDefault();

    if (!supabase) {
      setMsg("Supabase belum dikonfigurasi.");
      return;
    }

    setMsg("Memeriksa login…");

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Login berhasil.");
  }

  async function logout() {
    if (!supabase) return;

    await supabase.auth.signOut();

    setSession(null);
  }

  /* =========================
     LOAD DATA
  ========================= */

  async function load() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("mbg_days")
      .select("*")
      .order("service_date", {
        ascending: false,
      });

    if (error) {
      setMsg(error.message);
      return;
    }

    setDays(data || []);
  }

  useEffect(() => {
    if (session) {
      load();
    }
  }, [session]);

  /* =========================
     FORM
  ========================= */

  function setField(keyName, value) {
    setForm((old) => ({
      ...old,
      [keyName]: value,
    }));
  }

  function updateItem(index, fieldName, value) {
    setItems((old) =>
      old.map((item, i) =>
        i === index
          ? {
              ...item,
              [fieldName]: value,
            }
          : item
      )
    );
  }

  function addItem() {
    setItems((old) => [
      ...old,
      {
        name: "",
        icon: "🍽️",
        description: "",
      },
    ]);
  }

  function removeItem(index) {
    setItems((old) =>
      old.filter((_item, i) => i !== index)
    );
  }

  function resetForm() {
    setForm({
      service_date: "",
      title: "",
      energy_kcal: "",
      protein_g: "",
      fat_g: "",
      carb_g: "",
      energy_akg_pct: "",
      protein_akg_pct: "",
      fat_akg_pct: "",
      carb_akg_pct: "",
      benefits: "",
      published: true,
    });

    setItems([
      {
        name: "",
        icon: "🍚",
        description: "",
      },
    ]);
  }

  /* =========================
     SAVE
  ========================= */

  async function save(e) {
    e.preventDefault();

    if (!supabase) {
      setMsg("Supabase belum dikonfigurasi.");
      return;
    }

    if (!form.service_date) {
      setMsg("Tanggal wajib diisi.");
      return;
    }

    setSaving(true);
    setMsg("Menyimpan…");

    try {
      const payload = {
        service_date: form.service_date,
        title: form.title || null,

        energy_kcal: num(form.energy_kcal),
        protein_g: num(form.protein_g),
        fat_g: num(form.fat_g),
        carb_g: num(form.carb_g),

        energy_akg_pct: num(
          form.energy_akg_pct
        ),
        protein_akg_pct: num(
          form.protein_akg_pct
        ),
        fat_akg_pct: num(
          form.fat_akg_pct
        ),
        carb_akg_pct: num(
          form.carb_akg_pct
        ),

        benefits: form.benefits || null,
        published: Boolean(form.published),
      };

      const {
        data,
        error,
      } = await supabase
        .from("mbg_days")
        .upsert(payload, {
          onConflict: "service_date",
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data?.id) {
        throw new Error(
          "Data menu tersimpan tetapi ID tidak ditemukan."
        );
      }

      const {
        error: deleteError,
      } = await supabase
        .from("mbg_items")
        .delete()
        .eq("day_id", data.id);

      if (deleteError) {
        throw deleteError;
      }

      const rows = items
        .filter(
          (item) =>
            item.name &&
            item.name.trim() !== ""
        )
        .map((item, index) => ({
          day_id: data.id,
          name: item.name.trim(),
          icon: item.icon || "🍽️",
          description:
            item.description || null,
          sort_order: index,
        }));

      if (rows.length > 0) {
        const {
          error: insertError,
        } = await supabase
          .from("mbg_items")
          .insert(rows);

        if (insertError) {
          throw insertError;
        }
      }

      setMsg("✅ Data berhasil disimpan.");

      await load();

      resetForm();
    } catch (error) {
      setMsg(
        `❌ ${error.message || "Gagal menyimpan data."}`
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     RENDER ADMIN
  ========================= */

  if (!supabase) {
    return (
      <Page>
        <Card>
          <h2>⚠️ Konfigurasi Supabase belum diisi</h2>

          <p>
            Pastikan VITE_SUPABASE_URL dan
            VITE_SUPABASE_PUBLISHABLE_KEY sudah
            dibuat di Vercel.
          </p>
        </Card>
      </Page>
    );
  }

  if (!session) {
    return (
      <Page>
        <header className="hero">
          <div className="brand">
            🍱 <b>MBG</b>
          </div>

          <h1>Admin Menu MBG</h1>

          <p>
            Kelola menu dan informasi gizi.
          </p>
        </header>

        <Card>
          <h2>🔐 Login Admin</h2>

          <form onSubmit={login}>
            <label>Email</label>

            <input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              type="email"
              placeholder="Email admin"
              required
            />

            <label>Password</label>

            <input
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              type="password"
              placeholder="Password"
              required
            />

            <button type="submit">
              Masuk
            </button>

            {msg && <p>{msg}</p>}
          </form>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <header className="hero">
        <div className="brand">
          🍱 <b>MBG</b>
        </div>

        <h1>⚙️ Admin Menu MBG</h1>

        <p>
          Kelola menu dan data gizi tanpa
          mengedit kode.
        </p>
      </header>

      <Card>
        <form onSubmit={save}>
          <h2>➕ Tambah Menu</h2>

          <label>Tanggal</label>

          <input
            type="date"
            value={form.service_date}
            onChange={(e) =>
              setField(
                "service_date",
                e.target.value
              )
            }
            required
          />

          <label>Judul</label>

          <input
            value={form.title}
            onChange={(e) =>
              setField(
                "title",
                e.target.value
              )
            }
            placeholder="Contoh: Menu Makan Bergizi"
          />

          <div className="two">
            <div>
              <label>Energi (kkal)</label>

              <input
                type="number"
                step="0.01"
                value={form.energy_kcal}
                onChange={(e) =>
                  setField(
                    "energy_kcal",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>AKG Energi (%)</label>

              <input
                type="number"
                step="0.01"
                value={form.energy_akg_pct}
                onChange={(e) =>
                  setField(
                    "energy_akg_pct",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>Protein (g)</label>

              <input
                type="number"
                step="0.01"
                value={form.protein_g}
                onChange={(e) =>
                  setField(
                    "protein_g",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>AKG Protein (%)</label>

              <input
                type="number"
                step="0.01"
                value={form.protein_akg_pct}
                onChange={(e) =>
                  setField(
                    "protein_akg_pct",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>Lemak (g)</label>

              <input
                type="number"
                step="0.01"
                value={form.fat_g}
                onChange={(e) =>
                  setField(
                    "fat_g",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>AKG Lemak (%)</label>

              <input
                type="number"
                step="0.01"
                value={form.fat_akg_pct}
                onChange={(e) =>
                  setField(
                    "fat_akg_pct",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>Karbohidrat (g)</label>

              <input
                type="number"
                step="0.01"
                value={form.carb_g}
                onChange={(e) =>
                  setField(
                    "carb_g",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>AKG Karbohidrat (%)</label>

              <input
                type="number"
                step="0.01"
                value={form.carb_akg_pct}
                onChange={(e) =>
                  setField(
                    "carb_akg_pct",
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <label>Manfaat / Keterangan</label>

          <textarea
            value={form.benefits}
            onChange={(e) =>
              setField(
                "benefits",
                e.target.value
              )
            }
            placeholder="Contoh: Sumber protein, vitamin, mineral, dan energi."
          />

          <h3>🍱 Menu</h3>

          {items.map((item, index) => (
            <div
              className="menuform"
              key={index}
            >
              <input
                value={item.icon}
                onChange={(e) =>
                  updateItem(
                    index,
                    "icon",
                    e.target.value
                  )
                }
                placeholder="🍚"
                aria-label="Ikon menu"
              />

              <input
                value={item.name}
                onChange={(e) =>
                  updateItem(
                    index,
                    "name",
                    e.target.value
                  )
                }
                placeholder="Nama menu"
              />

              <input
                value={item.description}
                onChange={(e) =>
                  updateItem(
                    index,
                    "description",
                    e.target.value
                  )
                }
                placeholder="Keterangan"
              />

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeItem(index)
                  }
                >
                  Hapus
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
          >
            + Tambah menu
          </button>

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Menyimpan…"
              : "💾 Simpan data"}
          </button>

          <button
            type="button"
            onClick={logout}
          >
            🚪 Keluar
          </button>

          {msg && <p>{msg}</p>}
        </form>
      </Card>

      <Card>
        <h2>📅 Data tersimpan</h2>

        {days.length === 0 ? (
          <p>
            Belum ada data menu tersimpan.
          </p>
        ) : (
          days.map((item) => (
            <div
              className="saved"
              key={item.id}
            >
              <strong>
                {fmt(item.service_date)}
              </strong>

              <span>
                {item.published
                  ? "Publik"
                  : "Draft"}
              </span>
            </div>
          ))
        )}
      </Card>
    </Page>
  );
}

/* =========================
   ROUTING
========================= */

function App() {
  const path = window.location.pathname;

  if (path.startsWith("/admin")) {
    return <Admin />;
  }

  return <PublicMenu />;
}

/* =========================
   START REACT
========================= */

const rootElement =
  document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Element #root tidak ditemukan di index.html."
  );
}

createRoot(rootElement).render(
  <App />
);
