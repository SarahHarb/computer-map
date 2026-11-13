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
#ubox{display:flex;align-items:center;gap:6px;font-size:13px}
#ubox .sc{background:#E8F8EF;color:#1E8449;border-radius:999px;padding:2px 10px;font-weight:700}`;
  document.head.appendChild(css);

  const L = document.createElement("div");
  L.id = "login";
  L.innerHTML = `<form class="lbox" autocomplete="on">
  <h2>الخارطة المفاهيمية — مقدمة في الحاسوب</h2><div class="sub">إعداد: سارة حرب</div>
  <div class="lt"><button type="button" data-m="in" class="on">تسجيل الدخول</button><button type="button" data-m="up">حساب جديد</button></div>
  <div class="up"><label>الاسم الكامل</label><input name="full_name" autocomplete="name">
  <label>الرقم الجامعي</label><input name="student_no" inputmode="numeric"></div>
  <label>الإيميل</label><input name="email" type="email" autocomplete="email" required dir="ltr">
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
    F.full_name.required = F.student_no.required = m === "up";
    F.password.autocomplete = m === "up" ? "new-password" : "current-password";
    L.querySelector(".go").textContent = m === "up" ? "إنشاء الحساب" : "دخول";
    say("");
  };
  const say = (t, ok) => { msg.textContent = t; msg.className = "msg " + (ok ? "ok" : "err"); };
  L.querySelectorAll(".lt button").forEach((b) => (b.onclick = () => setMode(b.dataset.m)));
  setMode("in");
  const AR = (e) => {
    const m = (e && e.message) || String(e);
    if (/Invalid login/i.test(m)) return "الإيميل أو كلمة السر غلط.";
    if (/already registered/i.test(m)) return "هاد الإيميل إله حساب، اعمل تسجيل دخول.";
    if (/Email not confirmed/i.test(m)) return "لازم تأكّد إيميلك أول، افتح الرسالة اللي وصلتك.";
    if (/at least 6/i.test(m)) return "كلمة السر لازم تكون 6 حروف أو أكثر.";
    return "صار خطأ: " + m;
  };
  F.onsubmit = async (e) => {
    e.preventDefault();
    const go = L.querySelector(".go"); go.disabled = true; say("لحظة…", true);
    try {
      const email = F.email.value.trim(), password = F.password.value;
      if (mode === "up") {
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: F.full_name.value.trim(), student_no: F.student_no.value.trim() } } });
        if (error) throw error;
        if (!data.session) { say("تم إنشاء الحساب ✅ افتح إيميلك وأكّد الحساب، بعدين سجّل دخول.", true); setMode("in"); return; }
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
    if (!email) return say("اكتب إيميلك أول، بعدين اكبس نسيت كلمة السر.");
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    say(error ? AR(error) : "بعتنالك رابط على الإيميل لتغيير كلمة السر.", !error);
  };

  async function start(u) {
    user = u;
    const { data } = await sb.from("profiles").select("*").eq("id", u.id).maybeSingle();
    profile = data || { full_name: (u.user_metadata || {}).full_name || u.email, role: "student" };
    const { data: at } = await sb.from("attempts").select("is_correct").eq("user_id", u.id);
    stats = { ok: (at || []).filter((x) => x.is_correct).length, all: (at || []).length };
    L.style.display = "none";
    drawBox();
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
      const p = prompt("اكتب كلمة السر الجديدة (6 حروف أو أكثر):");
      if (p) sb.auth.updateUser({ password: p }).then(({ error }) => alert(error ? AR(error) : "تم تغيير كلمة السر ✅"));
    }
  });
  sb.auth.getSession().then(({ data }) => { if (data.session) start(data.session.user); });
})();
