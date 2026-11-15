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
#ubox{display:flex;align-items:center;gap:6px;font-size:13px}
#ubox .sc{background:#E8F8EF;color:#1E8449;border-radius:999px;padding:2px 10px;font-weight:700}`;
  document.head.appendChild(css);

  const L = document.createElement("div");
  L.id = "login";
  L.innerHTML = `<form class="lbox" autocomplete="on">
  <h2>الخارطة المفاهيمية — مقدمة في الحاسوب</h2><div class="sub">إعداد: سارة حرب</div>
  <button type="button" class="gbtn" id="gbtn"><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg><span>ادخل بحساب الجامعة (Google)</span></button>
  <div class="or"><span>أو بالبريد الإلكتروني وكلمة السر</span></div>
  <div class="lt"><button type="button" data-m="in" class="on">تسجيل الدخول</button><button type="button" data-m="up">حساب جديد</button></div>
  <div class="up"><label>الاسم الكامل</label><input name="full_name" autocomplete="name">
  </div>
  <label>البريد الإلكتروني الجامعي</label><input name="email" type="email" placeholder="…@ppu.edu.ps" autocomplete="email" required dir="ltr">
  <label>كلمة السر</label><input name="password" type="password" autocomplete="current-password" required minlength="6" dir="ltr">
  <button class="go" type="submit">دخول</button>
  <button type="button" class="link" id="forgot">نسيت كلمة السر؟</button>
  <div class="msg"></div></form>`;
  document.body.appendChild(L);
  const F = L.querySelector("form"), msg = L.querySelector(".msg");
  let mode = "in";
  const setMode = (m) => {
    mode = m;
    L.querySelectorAll(".lt button").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
    L.querySelector(".up").style.display = m === "up" ? "" : "none";
    F.full_name.required = m === "up";
    F.password.autocomplete = m === "up" ? "new-password" : "current-password";
    L.querySelector(".go").textContent = m === "up" ? "إنشاء الحساب" : "دخول";
    say("");
  };
  const say = (t, ok) => { msg.textContent = t; msg.className = "msg " + (ok ? "ok" : "err"); };
  L.querySelectorAll(".lt button").forEach((b) => (b.onclick = () => setMode(b.dataset.m)));
  setMode("in");
  const AR = (e) => {
    const m = (e && e.message) || String(e);
    if (/Invalid login/i.test(m)) return "البريد الإلكتروني أو كلمة السر غير صحيحة.";
    if (/already registered/i.test(m)) return "لهذا البريد حساب مسبق، سجّل الدخول.";
    if (/Email not confirmed/i.test(m)) return "يجب تأكيد بريدك الإلكتروني أولاً، افتح الرسالة التي وصلتك.";
    if (m === "PPU_ONLY" || /Database error saving new user/i.test(m)) return "التسجيل متاح بالبريد الجامعي الذي ينتهي بـ ‎@ppu.edu.ps فقط.";
    if (/at least 6/i.test(m)) return "يجب أن تتكوّن كلمة السر من 6 أحرف أو أكثر.";
    return "حدث خطأ: " + m;
  };
  F.onsubmit = async (e) => {
    e.preventDefault();
    const go = L.querySelector(".go"); go.disabled = true; say("لحظة…", true);
    try {
      const email = F.email.value.trim(), password = F.password.value;
      if (mode === "up") {
        if (!/@ppu\.edu\.ps$/i.test(email)) throw new Error("PPU_ONLY");
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: F.full_name.value.trim(), student_no: email.split("@")[0] } } });
        if (error) throw error;
        if (!data.session) { say("تم إنشاء الحساب ✅ افتح بريدك وأكّد الحساب، ثم سجّل الدخول.", true); setMode("in"); return; }
        await start(data.session.user);
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await start(data.user);
      }
    } catch (err) { say(AR(err)); } finally { go.disabled = false; }
  };
  L.querySelector("#forgot").onclick = async () => {
    const email = F.email.value.trim();
    if (!email) return say("اكتب بريدك الإلكتروني أولاً، ثم اضغط «نسيت كلمة السر؟».");
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    say(error ? AR(error) : "أرسلنا إلى بريدك رابطاً لتغيير كلمة السر.", !error);
  };

  async function start(u) {
    user = u;
    const { data } = await sb.from("profiles").select("*").eq("id", u.id).maybeSingle();
    profile = data || { full_name: (u.user_metadata || {}).full_name || u.email, role: "student" };
    const { data: at } = await sb.from("attempts").select("is_correct").eq("user_id", u.id);
    stats = { ok: (at || []).filter((x) => x.is_correct).length, all: (at || []).length };
    L.style.display = "none";
    drawBox();
    try { if (typeof refit === "function") setTimeout(refit, 50); } catch (e) {}
  }
  function drawBox() {
    const box = document.getElementById("ubox"); if (!box) return;
    box.innerHTML = `<span>👤 ${esc(profile.full_name || "")}</span><span class="sc" title="إجاباتك الصحيحة">✅ ${stats.ok} / ${stats.all}</span>` +
      (profile.role === "admin" ? `<a href="admin.html"><button>📊 لوحة المتابعة</button></a>` : "") + `<button id="logout">خروج</button>`;
    box.querySelector("#logout").onclick = async () => { await sb.auth.signOut(); location.reload(); };
  }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  window.track = {
    view(concept, tab) { if (user) sb.from("views").insert({ user_id: user.id, concept, tab }).then(() => {}); },
    answer(r) {
      if (!user) return;
      stats.all++; if (r.is_correct) stats.ok++; drawBox();
      sb.from("attempts").insert({ user_id: user.id, ...r }).then(({ error }) => { if (error) console.warn(error); });
    },
  };

  sb.auth.onAuthStateChange((ev, session) => {
    if (ev === "PASSWORD_RECOVERY") {
      const p = prompt("اكتب كلمة السر الجديدة (6 أحرف أو أكثر):");
      if (p) sb.auth.updateUser({ password: p }).then(({ error }) => alert(error ? AR(error) : "تم تغيير كلمة السر ✅"));
    }
  });
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
