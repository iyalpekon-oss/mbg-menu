import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import QRCode from "qrcode";
import {createClient} from "@supabase/supabase-js";
import "./style.css";

const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase=url&&key?createClient(url,key):null;

function PublicMenu(){
 const [days,setDays]=useState([]),[date,setDate]=useState(""),[day,setDay]=useState(null),[loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{if(!supabase){setLoading(false);return}
  const {data}=await supabase.from("mbg_days").select("*").eq("published",true).order("service_date",{ascending:false});
  setDays(data||[]); if(data?.[0]){setDate(data[0].service_date);load(data[0].id)}
  setLoading(false)})()},[]);
 async function load(id){if(!supabase)return; const {data}=await supabase.from("mbg_days").select("*,mbg_items(*)").eq("id",id).single();setDay(data)}
 if(loading)return <Page><Card>Memuat data…</Card></Page>;
 if(!supabase)return <Page><Card><h2>Belum terhubung</h2><p>Isi file <b>.env</b> dengan kredensial Supabase.</p></Card></Page>;
 return <Page>
  <header className="hero"><div className="brand">🍱 <b>MBG</b></div><h1>Menu Makan Bergizi</h1><p>Menu, informasi gizi, dan persentase AKG berdasarkan tanggal.</p></header>
  <Card><label>Pilih tanggal</label><select value={date} onChange={async e=>{setDate(e.target.value);const x=days.find(d=>d.service_date===e.target.value);if(x)load(x.id)}}>{days.map(d=><option key={d.id} value={d.service_date}>{fmt(d.service_date)}</option>)}</select></Card>
  {day&&<><Card><div className="date">{fmt(day.service_date)}</div><h2>🍱 Menu</h2><div className="grid">{(day.mbg_items||[]).sort((a,b)=>a.sort_order-b.sort_order).map(i=><div className="item" key={i.id}>{i.icon||"🍽️"}<b>{i.name}</b><small>{i.description||""}</small></div>)}</div></Card>
  <Card><h2>📊 Informasi Gizi</h2><div className="stats">{stat("Energi",day.energy_kcal,"kkal")}{stat("Protein",day.protein_g,"g")}{stat("Lemak",day.fat_g,"g")}{stat("Karbohidrat",day.carb_g,"g")}</div><h3>Persentase AKG</h3><Bar n="Energi" v={day.energy_akg_pct}/><Bar n="Protein" v={day.protein_akg_pct}/><Bar n="Lemak" v={day.fat_akg_pct}/><Bar n="Karbohidrat" v={day.carb_akg_pct}/>{day.benefits&&<div className="note">💡 {day.benefits}</div>}</Card></>}
 </Page>
}
const stat=(a,b,c)=><div className="stat"><small>{a}</small><strong>{b??"—"} {c}</strong></div>;
function Bar({n,v}){if(v==null)return null;let x=Math.max(0,Math.min(100,Number(v)));return <div className="barrow"><span>{n}</span><div className="bar"><i style={{width:x+"%"}}/></div><b>{v}%</b></div>}
const fmt=x=>new Date(x+"T00:00:00").toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const Card=({children})=><section className="card">{children}</section>;
const Page=({children})=><main className="wrap">{children}<footer>Sistem Menu MBG • Informasi berdasarkan data yang dimasukkan pengelola</footer></main>;

function Admin(){
 const [session,setSession]=useState(null),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[days,setDays]=useState([]),[form,setForm]=useState({service_date:"",title:"",energy_kcal:"",protein_g:"",fat_g:"",carb_g:"",energy_akg_pct:"",protein_akg_pct:"",fat_akg_pct:"",carb_akg_pct:"",benefits:"",published:true}),[items,setItems]=useState([{name:"",icon:"🍚",description:""}]),[msg,setMsg]=useState("");
 useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(r=>setSession(r.data.session));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>data.subscription.unsubscribe()},[]);
 async function login(e){e.preventDefault();let r=await supabase.auth.signInWithPassword({email,password});if(r.error)setMsg(r.error.message)}
 async function load(){let r=await supabase.from("mbg_days").select("*").order("service_date",{ascending:false});setDays(r.data||[])}
 useEffect(()=>{if(session)load()},[session]);
 async function save(e){e.preventDefault();setMsg("Menyimpan…");let payload={...form,energy_kcal:num(form.energy_kcal),protein_g:num(form.protein_g),fat_g:num(form.fat_g),carb_g:num(form.carb_g),energy_akg_pct:num(form.energy_akg_pct),protein_akg_pct:num(form.protein_akg_pct),fat_akg_pct:num(form.fat_akg_pct),carb_akg_pct:num(form.carb_akg_pct)};let r=await supabase.from("mbg_days").upsert(payload,{onConflict:"service_date"}).select().single();if(r.error){setMsg(r.error.message);return}await supabase.from("mbg_items").delete().eq("day_id",r.data.id);let rows=items.filter(x=>x.name.trim()).map((x,i)=>({...x,day_id:r.data.id,sort_order:i}));if(rows.length)await supabase.from("mbg_items").insert(rows);setMsg("Tersimpan.");load()}
 if(!supabase)return <Page><Card>Konfigurasi Supabase belum diisi.</Card></Page>;
 if(!session)return <Page><Card><h2>🔐 Admin MBG</h2><form onSubmit={login}><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/><label>Password</label><input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/><button>Masuk</button><p>{msg}</p></form></Card></Page>;
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 return <Page><header className="hero"><h1>⚙️ Admin Menu MBG</h1><p>Kelola menu dan data gizi tanpa mengedit kode.</p></header><Card><form onSubmit={save}><label>Tanggal</label><input type="date" value={form.service_date} onChange={e=>set("service_date",e.target.value)} required/><label>Judul</label><input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Menu MBG"/><div className="two">{field("Energi (kkal)","energy_kcal")}{field("AKG Energi (%)","energy_akg_pct")}{field("Protein (g)","protein_g")}{field("AKG Protein (%)","protein_akg_pct")}{field("Lemak (g)","fat_g")}{field("AKG Lemak (%)","fat_akg_pct")}{field("Karbohidrat (g)","carb_g")}{field("AKG Karbo (%)","carb_akg_pct")}</div><label>Manfaat</label><textarea value={form.benefits} onChange={e=>set("benefits",e.target.value)}/><h3>Menu</h3>{items.map((it,i)=><div className="menuform" key={i}><input value={it.icon} onChange={e=>{let a=[...items];a[i].icon=e.target.value;setItems(a)}}/><input placeholder="Nama menu" value={it.name} onChange={e=>{let a=[...items];a[i].name=e.target.value;setItems(a)}}/><input placeholder="Keterangan" value={it.description} onChange={e=>{let a=[...items];a[i].description=e.target.value;setItems(a)}}/></div>)}<button type="button" onClick={()=>setItems([...items,{name:"",icon:"🍽️",description:""}])}>+ Tambah menu</button><button>Simpan data</button><button type="button" onClick={()=>supabase.auth.signOut()}>Keluar</button><p>{msg}</p></form></Card><Card><h2>📅 Data tersimpan</h2>{days.map(d=><div className="saved" key={d.id}>{fmt(d.service_date)} <span>{d.published?"Publik":"Draft"}</span></div>)}</Card></Page>;
 function field(label,k){return <div><label>{label}</label><input type="number" step="0.01" value={form[k]} onChange={e=>set(k,e.target.value)}/></div>}
}
function num(x){return x===""||x==null?null:Number(x)}
const app=location.pathname.startsWith("/admin")?<Admin/>:<PublicMenu/>;
createRoot(document.getElementById("root")).render(app);