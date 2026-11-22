// تسجيل دخول الطلاب وتسجيل نشاطهم (Supabase)
(function () {
  const C = window.APP_CONFIG || {};
  if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY || !window.supabase) return; // بدون إعداد: الموقع مفتوح بدون دخول
  const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  window.sb = sb;
  let user = null, profile = null, stats = { ok: 0, all: 0 };

  const css = document.createElement("style");
  css.textContent = `
#login{position:fixed;inset:0;z-index:200;background:linear-gradient(135deg,#16213E,#2F5D9B);display:flex;align-items:center;justify-content:center;padding:16px}
#login .lbox{background:#fff;border-radius:18px;width:min(440px,100%);padding:26px 26px 20px;box-shadow:0 20px 60px rgba(0,0,0,.35)}
#login h2{margin:0 0 4px;font-size:22px;color:#16213E}#login .sub{color:#6B7280;font-size:14px;margin-bottom:14px}
#login .lt{display:flex;gap:6px;margin-bottom:14px}#login .lt button{flex:1;border-radius:10px;padding:8px;font-size:15px;font-weight:700}
#login label{display:block;font-size:14px;font-weight:600;margin:8px 0 3px}
#login input{width:100%;font-family:inherit;font-size:16px;padding:9px 12px;border:1px solid #D1D5DB;border-radius:10px}
#login input:focus{outline:2px solid #F1C40F;border-color:#B7950B}
#login .go{width:100%;margin-top:16px;background:#16213E;color:#fff;border:none;border-radius:10px;padding:11px;font-size:17px;font-weight:700}
#login .msg{min-height:22px;margin-top:10px;font-size:14px;text-align:center}#login .msg.err{color:#C0392B}#login .msg.ok{color:#1E8449}
#login .link{background:none;border:none;color:#2F5D9B;font-size:13px;text-decoration:underline;padding:0;margin-top:6px}
#login .gbtn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:#fff;border:2px solid #D1D5DB;border-radius:12px;padding:12px;font-size:17px;font-weight:800;font-family:inherit;color:#14213D;cursor:pointer;margin:4px 0 6px}
#login .gbtn:hover{border-color:#4285F4;background:#F5F9FF}
#login .or{display:flex;align-items:center;gap:8px;color:#9CA3AF;font-size:13px;margin:10px 0}#login .or::before,#login .or::after{content:"";flex:1;border-top:1px solid #E5E7EB}
#login .gnote{color:#4B5563;font-size:14px;line-height:1.8;text-align:center;margin:10px 0 0}
#ubox{display:flex;align-items:center;gap:10px;font-size:13px;margin-inline-start:auto}
#ubox .uwrap{position:relative}
#ubox .uchip{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:4px 12px 4px 4px;cursor:pointer;font-family:inherit;color:#fff}
#ubox .uchip:hover,#ubox .uchip[aria-expanded="true"]{background:rgba(255,255,255,.16)}
#ubox .uav{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#F2B705,#E08E0B);color:#14213D;display:grid;place-items:center;font-weight:900;font-size:15px;overflow:hidden;box-shadow:0 0 0 2px #F2B705;flex:none}
#ubox .uav img{width:100%;height:100%;object-fit:cover}
#ubox .unm{display:flex;flex-direction:column;line-height:1.25;text-align:start}#ubox .unm b{font-size:16px;color:#fff;font-weight:800;white-space:nowrap}#ubox .unm small{font-size:11px;color:#F2B705;font-weight:700}
#ubox .ucar{font-size:12px;color:#B8C4D6}
#ubox .umenu{position:absolute;top:calc(100% + 10px);inset-inline-end:0;width:300px;background:#fff;color:#14213D;border-radius:20px;box-shadow:0 18px 50px rgba(15,23,42,.35);padding:22px 18px 16px;display:flex;flex-direction:column;align-items:center;gap:4px;z-index:300}
#ubox .umenu[hidden]{display:none}
#ubox .uav.big{width:76px;height:76px;font-size:28px;box-shadow:0 0 0 3px #F2B705;margin-bottom:6px}
#ubox .um-n{font-size:19px;font-weight:900}#ubox .um-e{color:#6B7280;font-size:13px}
#ubox .urole{background:#F2B705;color:#14213D;font-weight:900;font-size:12px;border-radius:999px;padding:2px 12px;margin-top:4px}
#ubox .um-links{display:grid;width:100%;gap:4px;margin:4px 0}#ubox .um-links a{display:block;text-align:start;padding:9px 12px;border-radius:10px;color:#14213D;text-decoration:none;font-weight:800;font-size:15px;background:#F4F6FA}#ubox .um-links a:hover{background:#FFF8E1}
#ubox .um-pref{display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%;margin:4px 0}#ubox .um-pref button{font-family:inherit;font-weight:700;font-size:13px;border:1px solid #D1D5DB;background:#fff;border-radius:10px;padding:8px 4px;cursor:pointer;color:#14213D}#ubox .um-pref button.on{background:#14213D;color:#F2B705}
#ubox .um-s{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%;margin:12px 0 8px}#ubox .um-s div{background:#F4F6FA;border-radius:12px;padding:8px 4px;text-align:center}#ubox .um-s b{display:block;font-size:18px}#ubox .um-s span{font-size:11px;color:#6B7280;font-weight:700}
#ubox .um-b{width:100%;text-align:center;border:1px solid #D1D5DB;background:#fff;color:#14213D;border-radius:12px;padding:10px;font-family:inherit;font-weight:800;font-size:15px;cursor:pointer;text-decoration:none;margin-top:6px}#ubox .um-b:hover{background:#F4F6FA}
#ubox .um-b.gold{background:#F2B705;border-color:#F2B705}
#ubox .uscore{display:flex;align-items:baseline;gap:4px;background:#E3F6EA;color:#1E8449;border-radius:12px;padding:5px 12px;font-weight:800}#ubox .uscore b{font-size:17px}#ubox .uscore i{font-style:normal;font-size:12px;opacity:.75}#ubox .uscore em{font-style:normal;font-size:12px;background:#1E8449;color:#fff;border-radius:99px;padding:0 7px;margin-inline-start:4px}
@media (max-width:700px){#ubox .unm,#ubox .ucar,#ubox .uscore{display:none}#ubox .uchip{padding:3px}}
#ubox .sc{background:#E8F8EF;color:#1E8449;border-radius:999px;padding:2px 10px;font-weight:700}`;
  document.head.appendChild(css);

  const L = document.createElement("div");
  L.id = "login";
  L.innerHTML = `<form class="lbox" autocomplete="on">
  <h2>مقدمة في الحاسوب</h2><div class="sub">سارة حرب</div>
  <button type="button" class="gbtn" id="gbtn"><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg><span>الدخول بحساب الجامعة (Google)</span></button>
  <p class="gnote">الدخول وإنشاء الحساب يتمّان بكبسة واحدة عبر حساب Google الجامعي الذي ينتهي بـ <b dir="ltr">@ppu.edu.ps</b>.</p>
  <div class="msg"></div></form>`;
  document.body.appendChild(L);
  const F = L.querySelector("form"), msg = L.querySelector(".msg");
  const say = (t, ok) => { msg.textContent = t; msg.className = "msg " + (ok ? "ok" : "err"); };
  const AR = (e) => "حدث خطأ: " + ((e && e.message) || String(e));

  async function start(u) {
    user = u; window.ME_EMAIL = u.email;
    const { data } = await sb.from("profiles").select("*").eq("id", u.id).maybeSingle();
    profile = data || { full_name: (u.user_metadata || {}).full_name || u.email, role: "student" };
    // only students listed in the course sections (شعب) may use the site
    if (profile.role !== "admin") { const { data: ok, error } = await sb.rpc("is_allowed"); if (!error && ok === false) { await sb.auth.signOut(); user = null; L.style.display = ""; say("حسابك (" + u.email + ") غير مسجّل في شعب هذه المادة. إذا كنت طالباً في الشعبة، تواصل مع مدرّسك لإضافتك."); return; } }
    const [{ data: at }, { data: vw }] = await Promise.all([sb.from("attempts").select("concept,question,is_correct,created_at").eq("user_id", u.id), sb.from("views").select("concept,tab,created_at").eq("user_id", u.id)]);
    stats = { ok: (at || []).filter((x) => x.is_correct).length, all: (at || []).length };
    const MY = (window.MY = window.MY || {}); MY.A = at || []; MY.V = vw || []; MY.uid = u.id; MY.ready = true;
    L.style.display = "none";
    drawBox();
    try { if (typeof refit === "function") setTimeout(refit, 50); } catch (e) {}
    window.dispatchEvent(new Event("my-ready"));
  }
  function drawBox() {
    const box = document.getElementById("ubox"); if (!box) return;
    const md = (user && user.user_metadata) || {}, name = (profile.full_name || md.full_name || md.name || (user && user.email) || "").trim();
    const ini = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join(""), pic = md.avatar_url || md.picture;
    const p = stats.all ? Math.round((100 * stats.ok) / stats.all) : null;
    const av = (cls) => `<span class="${cls}">${pic ? `<img src="${esc(pic)}" alt="" referrerpolicy="no-referrer">` : esc(ini)}</span>`;
    box.innerHTML = `<div class="uwrap"><button class="uchip" id="uchip" aria-haspopup="true" aria-expanded="false">${av("uav")}<span class="unm"><b>${esc(name)}</b>${profile.role === "admin" ? "" : `<small>طالب</small>`}</span><span class="ucar">▾</span></button>
      <div class="umenu" id="umenu" hidden>${av("uav big")}<b class="um-n">${esc(name)}</b><small class="um-e" dir="ltr">${esc((user && user.email) || "")}</small>${profile.role === "admin" ? `<span class="urole">المعلمة</span>` : ""}
        <div class="um-s"><div><b>${stats.ok}</b><span>إجابة صحيحة</span></div><div><b>${stats.all}</b><span>كل الإجابات</span></div><div><b>${p != null ? p + "%" : "—"}</b><span>النسبة</span></div></div>
        <div class="um-links"><a href="#/me">📈 تقدّمي وشاراتي</a><a href="#/review">🔁 مراجعة أخطائي</a><a href="#/exam">📝 امتحان تجريبي</a></div>
        <div class="um-pref"><button id="pDark">🌙 الوضع الليلي</button><button id="pFs">🔠 حجم الخط</button></div>
        ${profile.role === "admin" ? `<a class="um-b gold" href="admin.html">📊 لوحة المتابعة</a>` : ""}<button class="um-b" id="logout">⎋ تسجيل الخروج</button></div></div>`;
    box.querySelectorAll(".uav img").forEach((im) => (im.onerror = () => (im.parentElement.textContent = ini)));
    const chip = box.querySelector("#uchip"), menu = box.querySelector("#umenu");
    const toggle = (o) => { menu.hidden = !o; chip.setAttribute("aria-expanded", o); };
    chip.onclick = (e) => { e.stopPropagation(); toggle(menu.hidden); };
    menu.onclick = (e) => e.stopPropagation();
    document.addEventListener("click", () => toggle(false)); window.addEventListener("hashchange", () => toggle(false));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); });
    menu.querySelectorAll(".um-links a").forEach((a) => (a.onclick = () => toggle(false)));
    const fsL = ["عادي", "كبير", "أكبر"], pv = () => { let P = {}; try { P = JSON.parse(localStorage.getItem("prefs") || "{}"); } catch (e) {} menu.querySelector("#pDark").classList.toggle("on", !!P.dark); menu.querySelector("#pFs").textContent = "🔠 الخط: " + fsL[P.fs || 0]; };
    menu.querySelector("#pDark").onclick = () => { window.setPref && setPref("dark"); pv(); };
    menu.querySelector("#pFs").onclick = () => { window.setPref && setPref("fs"); pv(); }; pv();
    box.querySelector("#logout").onclick = async () => { await sb.auth.signOut(); location.reload(); };
  }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  window.track = {
    view(concept, tab) { if (user && window.MY) MY.V.push({ concept, tab, created_at: new Date().toISOString() }); if (user) sb.from("views").insert({ user_id: user.id, concept, tab }).then(() => {}); },
    answer(r) {
      if (!user) return;
      stats.all++; if (r.is_correct) stats.ok++; drawBox();
      if (window.MY) { MY.A.push({ ...r, created_at: new Date().toISOString() }); window.dispatchEvent(new Event("my-update")); }
      sb.from("attempts").insert({ user_id: user.id, ...r }).then(({ error }) => { if (error) console.warn(error); });
    },
  };


  L.querySelector("#gbtn").onclick = async () => {
    say("لحظة…", true);
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname, queryParams: { hd: "ppu.edu.ps", prompt: "select_account" } } });
    if (error) say(/not enabled|Unsupported provider/i.test(error.message) ? "الدخول بحساب Google غير متاح حالياً. ادخل بالبريد الإلكتروني وكلمة السر." : AR(error));
  };
  { // رجوع من Google بخطأ (مثلاً حساب مش جامعي)
    const q = new URLSearchParams(location.hash.slice(1) + "&" + location.search.slice(1)), ed = q.get("error_description");
    if (ed) { say(/Database error|signup/i.test(ed) ? "يجب اختيار حساب الجامعة الذي ينتهي بـ ‎@ppu.edu.ps" : "تعذّر تسجيل الدخول: " + ed.replace(/\+/g, " ")); history.replaceState(null, "", location.pathname); }
  }
  sb.auth.getSession().then(({ data }) => { if (data.session) start(data.session.user); });
})();
