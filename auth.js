// تسجيل دخول الطلاب وتسجيل نشاطهم (Supabase)
(function () {
  const C = window.APP_CONFIG || {};
  if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY || !window.supabase) return; // بدون إعداد: الموقع مفتوح بدون دخول
  const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  window.sb = sb;
  let user = null, profile = null, stats = { ok: 0, all: 0 };

  const css = document.createElement("style");
  css.textContent = `
#login{position:fixed;inset:0;z-index:200;background:#14213D radial-gradient(circle at 20% 20%,#2F5D9B 0,transparent 55%);display:flex;align-items:center;justify-content:center;padding:16px}
#login .lbox{background:#fff;border-radius:20px;width:min(420px,100%);padding:26px;box-shadow:0 20px 60px rgba(0,0,0,.35)}
#login .lhead{display:flex;align-items:center;gap:12px;margin-bottom:18px}#login .llogo{width:52px;height:52px;border-radius:14px;background:#F2B705;display:grid;place-items:center;font-size:26px}
#login h2{margin:0;font-size:22px;color:#14213D}#login .sub{color:#6B7280;font-size:14px}
#login label{display:block;font-size:15px;font-weight:700;margin:8px 0 6px;color:#14213D}
#login input{width:100%;font-family:inherit;font-size:18px;padding:12px 14px;border:2px solid #D1D5DB;border-radius:12px;box-sizing:border-box}
#login input:focus{outline:none;border-color:#F2B705}
#login input.code{font-size:30px;letter-spacing:10px;text-align:center;font-weight:800}
#login .go{width:100%;margin-top:14px;background:#14213D;color:#fff;border:none;border-radius:12px;padding:13px;font-size:18px;font-weight:800;font-family:inherit;cursor:pointer}#login .go:disabled{opacity:.6}
#login .hint{color:#6B7280;font-size:13px;margin:10px 0 0;text-align:center}
#login .sent{background:#EEF6FF;border-radius:12px;padding:10px;text-align:center;margin:0 0 6px;font-size:15px}
#login .row2{display:flex;justify-content:space-between;margin-top:10px}
#login .msg{min-height:22px;margin-top:10px;font-size:15px;text-align:center;font-weight:600}#login .msg.err{color:#C0392B}#login .msg.ok{color:#1E8449}
#login .link{background:none;border:none;color:#2F5D9B;font-size:14px;text-decoration:underline;padding:0;font-family:inherit;cursor:pointer}#login .link:disabled{color:#9CA3AF;text-decoration:none;cursor:default}
#ubox{display:flex;align-items:center;gap:6px;font-size:13px}
#ubox .sc{background:#E8F8EF;color:#1E8449;border-radius:999px;padding:2px 10px;font-weight:700}`;
  document.head.appendChild(css);

  const L = document.createElement("div");
  L.id = "login";
  L.innerHTML = `<form class="lbox" autocomplete="on" novalidate>
  <div class="lhead"><span class="llogo">🖥️</span><div><h2>مقدمة في الحاسوب</h2><div class="sub">إعداد: سارة حرب</div></div></div>
  <div class="step s1"><label>إيميلك الجامعي</label><input name="email" type="email" placeholder="name@ppu.edu.ps" autocomplete="email" dir="ltr" inputmode="email">
    <button class="go" type="submit">ابعتلي كود الدخول</button><p class="hint">رح يوصلك إيميل على إيميل الجامعة (Gmail): اضغط على الرابط اللي فيه، أو اكتب الكود إذا فيه كود.</p></div>
  <div class="step s2" hidden><p class="sent">بعتنا إيميل على<br><b dir="ltr" class="em"></b><br>اضغط على الرابط اللي فيه وبتدخل مباشرة.</p><label>أو اكتب الكود (إذا وصلك كود)</label>
    <input name="code" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="10" dir="ltr" placeholder="••••••">
    <button class="go" type="submit">دخول</button>
    <div class="row2"><button type="button" class="link" id="back">← غيّر الإيميل</button><button type="button" class="link" id="resend">ابعت الكود مرة ثانية</button></div>
    <p class="hint">ما وصلك؟ شوف مجلد الـ Spam أو «جميع الرسائل».</p></div>
  <div class="step s3" hidden><p class="sent">أهلاً فيك 👋 أول مرة بتدخل.</p><label>اسمك الكامل</label><input name="full_name" autocomplete="name">
    <button class="go" type="submit">يلّا نبلّش</button></div>
  <div class="msg"></div></form>`;
  document.body.appendChild(L);
  const F = L.querySelector("form"), msg = L.querySelector(".msg");
  let step = 1, email = "", wait = 0, tmr = 0;
  const say = (t, ok) => { msg.textContent = t; msg.className = "msg " + (ok ? "ok" : "err"); };
  const show = (n) => { step = n; L.querySelectorAll(".step").forEach((x, k) => (x.hidden = k + 1 !== n)); say(""); const f = L.querySelector(".s" + n + " input"); if (f) setTimeout(() => f.focus(), 50); };
  const AR = (e) => {
    const m = (e && e.message) || String(e);
    if (m === "PPU_ONLY" || /Database error saving new user|signups not allowed/i.test(m)) return "الدخول بس بالإيميل الجامعي اللي بينتهي بـ ‎@ppu.edu.ps";
    if (/expired|invalid/i.test(m)) return "الكود غلط أو خلص وقته. تأكّد منه أو اطلب كود جديد.";
    if (/after (\d+) seconds/i.test(m)) return `استنى ${m.match(/after (\d+) seconds/i)[1]} ثانية وبعدين اطلب كود جديد.`;
    if (/rate limit|too many/i.test(m)) return "انبعتت رسائل كتير هلّق. جرّب بعد شوي.";
    if (/Error sending|smtp/i.test(m)) return "ما قدرنا نبعت الإيميل هلّق. خبّر المعلمة.";
    return "صار خطأ: " + m;
  };
  const tick = () => { const r = L.querySelector("#resend"); clearInterval(tmr); wait = 60; const f = () => { r.disabled = wait > 0; r.textContent = wait > 0 ? `ابعت الكود مرة ثانية (${wait})` : "ابعت الكود مرة ثانية"; if (wait-- <= 0) clearInterval(tmr); }; f(); tmr = setInterval(f, 1000); };
  const send = async () => {
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname, data: { student_no: email.split("@")[0] } } });
    if (error) throw error;
  };
  F.onsubmit = async (e) => {
    e.preventDefault();
    const go = L.querySelector(".s" + step + " .go"); go.disabled = true; say("لحظة…", true);
    try {
      if (step === 1) {
        email = F.email.value.trim().toLowerCase();
        if (!/^[^@\s]+@ppu\.edu\.ps$/i.test(email)) throw new Error("PPU_ONLY");
        await send(); L.querySelector(".em").textContent = email; F.code.value = ""; show(2); tick();
      } else if (step === 2) {
        const token = F.code.value.replace(/\D/g, "");
        if (token.length < 6) return say("الكود لازم يكون 6 أرقام أو أكثر.");
        const { data, error } = await sb.auth.verifyOtp({ email, token, type: "email" });
        if (error) throw error;
        await start(data.user);
      } else {
        const n = F.full_name.value.trim();
        if (n.split(/\s+/).length < 2) return say("اكتب اسمك الأول واسم العائلة.");
        await sb.auth.updateUser({ data: { full_name: n } });
        const { error } = await sb.rpc("set_my_name", { n });
        if (error) console.warn(error);
        profile.full_name = n; finish();
      }
    } catch (err) { say(AR(err)); } finally { go.disabled = false; }
  };
  F.code.addEventListener("input", () => { F.code.value = F.code.value.replace(/\D/g, ""); if (F.code.value.length >= 6 && F.code.value.length === (+F.code.dataset.len || 8)) F.requestSubmit(); });
  L.querySelector("#back").onclick = () => { clearInterval(tmr); show(1); };
  L.querySelector("#resend").onclick = async () => { try { say("لحظة…", true); await send(); say("بعتنا كود جديد ✅", true); tick(); } catch (err) { say(AR(err)); } };
  show(1);

  async function start(u) {
    user = u;
    const { data } = await sb.from("profiles").select("*").eq("id", u.id).maybeSingle();
    profile = data || { full_name: (u.user_metadata || {}).full_name || u.email, role: "student" };
    const { data: at } = await sb.from("attempts").select("is_correct").eq("user_id", u.id);
    stats = { ok: (at || []).filter((x) => x.is_correct).length, all: (at || []).length };
    if (!profile.full_name || profile.full_name === u.email) {
      const meta = (u.user_metadata || {}).full_name;
      if (meta) profile.full_name = meta; else { show(3); return; }
    }
    finish();
  }
  function finish() {
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

  sb.auth.getSession().then(({ data }) => { if (data.session) start(data.session.user); });
})();
