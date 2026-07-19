/* ===================== BITFLUX site — interactions + i18n ===================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var raf = window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };

  /* ---------- scroll progress bar ---------- */
  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);

  /* ---------- sticky nav + auto-hide + progress (single rAF loop) ---------- */
  var nav = document.getElementById('nav');
  var lastY = window.scrollY;
  var ticking = false;
  function frame() {
    var y = window.scrollY;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (docH > 0 ? Math.min(y / docH, 1) : 0) + ')';
    if (nav) {
      if (y > 12) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
      if (y > 420 && y > lastY + 4) nav.classList.add('nav-hidden');
      else if (y < lastY - 4 || y < 200) nav.classList.remove('nav-hidden');
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; raf(frame); }
  }, { passive: true });
  frame();

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burger');
  var navMobile = document.getElementById('navMobile');
  if (burger && navMobile) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('open');
      navMobile.classList.toggle('open');
    });
    navMobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('open');
        navMobile.classList.remove('open');
      });
    });
  }

  /* ---------- staggered scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) {
      return c.classList && c.classList.contains('reveal');
    });
    var idx = sibs.indexOf(el);
    if (idx > 0) el.style.transitionDelay = Math.min(idx, 7) * 75 + 'ms';
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- count-up numbers ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var dur = 1200, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) raf(step);
    }
    raf(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ---------- scrollspy: active nav link ---------- */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var spyMap = {};
  spyLinks.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var sec = document.getElementById(id);
    if (sec) spyMap[id] = a;
  });
  if ('IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = spyMap[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          spyLinks.forEach(function (l) { l.classList.remove('active'); });
          a.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(spyMap).forEach(function (id) { sio.observe(document.getElementById(id)); });
  }

  /* ---------- buttery momentum scroll (desktop, Lenis-lite) ---------- */
  var smooth = finePointer && !reduceMotion;
  var sTarget = window.scrollY, sCurrent = sTarget, sActive = false;
  function maxScroll() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
  function sStep() {
    sCurrent += (sTarget - sCurrent) * 0.115;
    if (Math.abs(sTarget - sCurrent) < 0.4) { sCurrent = sTarget; sActive = false; }
    window.scrollTo(0, sCurrent);
    if (sActive) raf(sStep);
  }
  function scrollToY(y) {
    sTarget = Math.max(0, Math.min(y, maxScroll()));
    if (smooth) { if (!sActive) { sActive = true; sCurrent = window.scrollY; raf(sStep); } }
    else window.scrollTo({ top: y, behavior: 'smooth' });
  }
  if (smooth) {
    document.documentElement.classList.add('has-smooth');
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;
      e.preventDefault();
      if (!sActive) sCurrent = window.scrollY;
      var mult = e.deltaMode === 1 ? 18 : (e.deltaMode === 2 ? window.innerHeight : 1);
      sTarget = Math.max(0, Math.min(sTarget + e.deltaY * mult, maxScroll()));
      if (!sActive) { sActive = true; raf(sStep); }
    }, { passive: false });
    var resync = function () { sActive = false; sTarget = window.scrollY; };
    window.addEventListener('keydown', resync);
    window.addEventListener('mousedown', resync);
    window.addEventListener('touchstart', resync, { passive: true });
    window.addEventListener('resize', function () { sTarget = window.scrollY; });
  }

  /* ---------- in-page anchor smooth routing ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href.length < 2) return;
    a.addEventListener('click', function (e) {
      var el = document.getElementById(href.slice(1));
      if (!el) return;
      e.preventDefault();
      var y = el.getBoundingClientRect().top + window.scrollY - 74;
      scrollToY(y);
      if (navMobile) { navMobile.classList.remove('open'); if (burger) burger.classList.remove('open'); }
    });
  });

  /* ---------- global cursor light ---------- */
  if (finePointer && !reduceMotion) {
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2, gtx = gx, gty = gy, gOn = false;
    function gStep() {
      gx += (gtx - gx) * 0.16; gy += (gty - gy) * 0.16;
      glow.style.transform = 'translate3d(' + (gx - 250) + 'px,' + (gy - 250) + 'px,0)';
      if (Math.abs(gtx - gx) > 0.5 || Math.abs(gty - gy) > 0.5) raf(gStep); else gOn = false;
    }
    window.addEventListener('mousemove', function (e) {
      gtx = e.clientX; gty = e.clientY;
      document.body.classList.add('cursor-on');
      if (!gOn) { gOn = true; raf(gStep); }
    });
    window.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-on'); });
  }

  /* ---------- hero parallax (mouse) ---------- */
  var hero = document.querySelector('.hero');
  var heroDevice = document.querySelector('.hero-device');
  if (hero && finePointer && !reduceMotion) {
    var mx = 0, my = 0, cx = 0, cy = 0, parking = false;
    hero.addEventListener('mousemove', function (ev) {
      var r = hero.getBoundingClientRect();
      mx = (ev.clientX - r.left) / r.width - 0.5;
      my = (ev.clientY - r.top) / r.height - 0.5;
      if (!parking) { parking = true; raf(parallaxStep); }
    });
    hero.addEventListener('mouseleave', function () { mx = 0; my = 0; });
    function parallaxStep() {
      cx += (mx - cx) * 0.07;
      cy += (my - cy) * 0.07;
      if (heroDevice) heroDevice.style.transform = 'translate3d(' + (cx * -26) + 'px,' + (cy * -18) + 'px,0)';
      if (Math.abs(mx - cx) > 0.001 || Math.abs(my - cy) > 0.001) raf(parallaxStep);
      else parking = false;
    }
  }

  /* ---------- spotlight follow on cards ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.fcard, .why-card, .preview-frame, .step').forEach(function (card) {
      card.addEventListener('mousemove', function (ev) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        card.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- 3D tilt on BF cards ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.bfcard').forEach(function (card) {
      card.addEventListener('mousemove', function (ev) {
        var r = card.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'translateY(-8px) rotateX(' + (py * -10) + 'deg) rotateY(' + (px * 14) + 'deg)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- magnetic primary buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.btn-primary').forEach(function (btn) {
      btn.addEventListener('mousemove', function (ev) {
        var r = btn.getBoundingClientRect();
        var x = (ev.clientX - r.left - r.width / 2) * 0.25;
        var y = (ev.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = 'translate(' + x + 'px,' + (y - 2) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---------- silky FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', function () {
      var open = item.classList.contains('open');
      if (!open) {
        document.querySelectorAll('.faq-item.open').forEach(function (other) {
          if (other !== item) {
            other.classList.remove('open');
            var oq = other.querySelector('.faq-q');
            if (oq) oq.setAttribute('aria-expanded', 'false');
          }
        });
      }
      item.classList.toggle('open');
      q.setAttribute('aria-expanded', String(!open));
    });
  });

  /* ---------- copy referral link ---------- */
  var copyRef = document.getElementById('copyRef');
  var refLink = document.getElementById('refLink');
  if (copyRef && refLink) {
    copyRef.addEventListener('click', function () {
      var text = refLink.textContent.trim();
      var done = function () {
        var old = copyRef.textContent;
        copyRef.textContent = (LANG === 'zh') ? '已复制' : 'Copied';
        setTimeout(function () { copyRef.textContent = I18N[LANG].ref_copy || old; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  }

  /* ===================== i18n ===================== */
  var I18N = {
    zh: {
      nav_features: '功能', nav_card: 'BF Card', nav_security: '安全', nav_referral: '邀请', nav_preview: '应用预览', nav_faq: '常见问题', nav_cta: '开始使用',
      hero_pill: '加密 × 法币 · 一个账户', hero_title_1: '把加密货币', hero_title_2: '变成可花的钱',
      hero_sub: '一个账户，完成兑换、消费与提现。',
      hero_cta1: '立即开户', hero_cta2: '了解更多', hero_stat1: '支持资产', hero_stat2_v: '即时', hero_stat2: '兑换到账', hero_stat3: '最高邀请奖励',
      htr1: '全球合规网络', htr2: '全球受理', htr3: '安全认证',
      gb_eyebrow: '全球可用 · 合规可信', gb_title: '服务 173 个国家与地区', gb_lead: '受全球持牌合规网络支持，安全合规运营。', gb_c1: '全球合规网络', gb_more: '查看安全与合规',
      bb_eyebrow: '品牌实景', bb_title: '把 BITFLUX 带到真实世界',
      ls_eyebrow: '真实场景', ls_title: '融入每一天的生活', ls_lead: '无论金质还是曜黑，都让链上资产自然融入日常消费。', ls_cap1: 'Golden · 流光金质', ls_cap2: 'Black · 极简曜黑',
      strip_label: '支持的资产与网络',
      hl1_t: '多币种钱包', hl1_d: 'USDT · USD · BTC · ETH · USDC',
      hl2_t: '外汇兑换', hl2_d: '秒级到账，汇率透明',
      hl3_t: 'BF Card', hl3_d: '虚拟卡 / 实体卡',
      hl4_t: '全球提现', hl4_d: 'USD · SGD · HKD · GBP · EUR',
      card_more: '查看 BF Card 详情 →',
      cardp_title: '把余额，变成消费力', cardp_lead: 'Visa Platinum 卡，虚拟卡即开即用，实体卡触手可及。链上资产，随处可花。',
      cardp_cta1: '立即申请', cardp_cta2: '了解功能',
      tier_eyebrow: '三款卡面', tier_title: '选一张，属于你的卡', tier_lead: '同样的强大功能，不同的风格表达。',
      tier1_t: 'Golden', tier1_d: '流光金质卡面，质感旗舰。Visa Platinum 等级，彰显身份。',
      tier2_t: 'Black', tier2_d: '极简曜黑，低调内敛。线条暗纹，经典耐看的商务之选。',
      tier3_t: 'Blue', tier3_d: '极光蓝调，年轻活力。鲜明配色，张扬个性的日常之选。',
      ben_eyebrow: '卡片权益', ben_title: '一张卡，连接链上与现实',
      b1_t: '虚拟 + 实体', b1_d: '虚拟卡即开即用，绑定钱包扫码消费；实体卡随身携带，线下刷卡同样顺手。',
      b2_t: '全球受理', b2_d: '基于 Visa 网络，全球数千万商户线上线下广泛受理。',
      b3_t: '余额直付', b3_d: '直接用账户余额消费，链上资产无需提前换汇，所花即所见。',
      b4_t: '安全可控', b4_d: '交易 PIN 与实时通知守护每一笔支出，卡片状态自主管理。',
      cardp_cta_title: '准备好你的 BF Card 了吗？', cardp_cta_sub: '开户即可申请虚拟卡，几步开始消费。',
      feat_eyebrow: '核心功能', feat_title: '一个 App，覆盖资金全流程', feat_lead: '从充值、兑换、消费到提现——每一步都在 BITFLUX 里完成。',
      f1_step: '功能 01', f2_step: '功能 02', f3_step: '功能 03', f4_step: '功能 04', f5_step: '功能 05', f6_step: '功能 06',
      f1_t: '多币种钱包', f1_d: '在同一个账户里持有 USDT、USD、BTC、ETH、USDC，余额与资产价值实时刷新。',
      f2_t: '外汇兑换 · Swap', f2_d: 'USDT / USDC 一键兑换为 USD，汇率清晰透明，秒级到账，所见即所得。', f2_tag: 'USDT→USD',
      f3_t: 'BF Card 银行卡', f3_d: '虚拟与实体卡，用余额随时随地消费，把链上资产花在真实世界。', f3_tag1: '虚拟卡', f3_tag2: '实体卡',
      f4_t: '全球法币提现', f4_d: '向全球多个国家的银行账户即时转账，支持 USD、SGD、HKD、GBP、EUR 多币种。',
      f5_t: '多链充值与提现', f5_d: '支持 ERC20、BEP20、TRC20、Polygon 多条网络充提，扫码即可收款，提现费率透明。',
      f6_t: '邀请有礼', f6_d: '分享专属邀请链接，与好友共享收益，最高可得 10% 奖励。', f6_tag: '最高 10%',
      why_eyebrow: '为什么选择 BITFLUX', why_title: '把掌控权交还给你', why_lead: '透明额度、实时通知、多重防护——细节之处更安心。',
      w1_t: '分级 KYC，额度透明', w1_d: 'KYC-0 / 1 / 2 三级身份认证，每一级的加密与法币额度清清楚楚，升级即时生效。',
      w2_t: '交易记录与实时通知', w2_d: '完整交易流水随时可查，交易、安全消息实时推送，账户动态尽在掌握。',
      w3_t: '交易 PIN + 设备提醒', w3_d: '6 位交易密码保护每一笔操作，新设备登录立即提醒，异常第一时间察觉。',
      w4_t: '深浅色 · 多语言 · 可安装', w4_d: '深色 / 浅色主题、多语言界面，支持 PWA 安装到桌面，随处都是顺手的体验。',
      s1: '种资产', s2: '条充值网络', s3: '级 KYC 认证', s4: '最高邀请奖励',
      pv_eyebrow: '应用预览', pv_title: '每一屏，皆为真实界面', pv_lead: '以下截图均来自 BITFLUX 正式 App。',
      pv1_t: '钱包总览', pv1_d: '资产与余额一目了然', pv2_t: '外汇兑换', pv2_d: '汇率透明，秒级到账',
      pv3_t: 'BF Card', pv3_d: '随行生活，自在掌控', pv4_t: '交易记录', pv4_d: '流水清晰可追溯',
      how_eyebrow: '三步开始', how_title: '几分钟，资产开始流动',
      h1_t: '注册与认证', h1_d: '手机或邮箱注册，完成 KYC 认证解锁更高额度。',
      h2_t: '充值与兑换', h2_d: '多链充值加密资产，一键兑换为可用的法币余额。',
      h3_t: '消费与提现', h3_d: '用 BF Card 消费，或提现到全球银行账户。',
      secx_eyebrow: '安全 · 合规 · 信任', secx_title_1: '全球合规，', secx_title_2: '无界信任',
      secx_lead: '受全球持牌合规网络支持，安全合规运营，值得信赖。',
      tm1: '合作网络资产托管规模', tm2: '合作网络累计交易处理', tm3: '合作网络覆盖国家与地区', tm4: '合规牌照覆盖区域',
      comp_badge: '全球合规网络', lic_more: '查看完整证照', lic_pending: '完整证照资料更新中，即将上线',
      lic1_r: '美国 · United States', lic1_s: '货币服务业务（FinCEN）',
      lic2_r: '香港 · Hong Kong', lic2_s: '证券牌照 Type 1 / 4 / 5 / 9',
      lic3_r: '香港 · Hong Kong', lic3_s: '金钱服务经营者牌照',
      lic4_r: '香港 · Hong Kong', lic4_s: '信托及公司服务提供者',
      lic5_r: '英国 · United Kingdom', lic5_s: '金融行为监管局',
      lic6_r: '阿联酋 · UAE', lic6_s: '资本市场管理局',
      lic7_r: '伯利兹 · Belize', lic7_s: '金融服务委员会',
      lic8_r: '塞舌尔 · Seychelles', lic8_s: '金融服务管理局',
      lic9_r: '南非 · South Africa', lic9_s: '金融行为监管局',
      lic10_r: '瑞士 · Switzerland', lic10_s: 'VQF 自律组织会员',
      prot_eyebrow: '账户级防护',
      sec_eyebrow: '安全与合规', sec_title: '资金安全，写进每个细节', sec_lead: '分级认证、交易密码、设备提醒与实时通知，构成多重防线。',
      sc1_t: '分级 KYC 与清晰额度', sc1_d: 'KYC-0/1/2 三级认证，加密与法币额度透明，按需升级。',
      sc2_t: '6 位交易 PIN', sc2_d: '关键操作需输入交易密码，为每笔资金流动加锁。',
      sc3_t: '新设备登录提醒', sc3_d: '陌生设备登录立即通知，账户安全主动可控。',
      sc4_t: '实时消息中心', sc4_d: '交易、安全消息分类推送，账户动态一手掌握。',
      part_eyebrow: '基础设施与安全', part_title_1: '由世界级伙伴', part_title_2: '提供支持',
      part_lead: '从支付结算、资产托管到合规风控，每个环节都由行业领先机构承载。',
      pc1: '支付与结算', pc2: '托管与钱包', pc3: '合规与风控', cert_label: '安全认证',
      card_eyebrow: 'BF Card', card_title: '随行生活，自在掌控', card_lead: '把余额变成消费力——虚拟卡即开即用，实体卡触手可及。',
      ref_eyebrow: '邀请有礼', ref_title: '分享 BITFLUX，共享收益', ref_lead: '把专属邀请链接分享给好友，你与好友一起获得奖励，最高可得 10%。',
      ref_link_label: '你的专属邀请链接', ref_copy: '复制', ref_s1: '最高奖励', ref_s2: '邀请人数', ref_s3_v: '实时', ref_s3: '奖励到账',
      inv_badge: '敬请期待', inv_title: 'BF Invest 即将上线', inv_lead: '让闲置资产为你工作。投资功能正在打造中，敬请关注 Twitter 抢先体验。', inv_cta: '了解详情',
      faq_eyebrow: '常见问题', faq_title: '你可能想了解',
      q1: 'BITFLUX 是什么？', a1: 'BITFLUX 是一站式加密与法币账户，支持多币种钱包、外汇兑换、BF Card 银行卡、全球法币提现与多链充提，让你的数字资产真正可花、可用。',
      q2: '支持哪些币种和网络？', a2: '目前支持 USDT、USD、BTC、ETH、USDC，充提网络覆盖 ERC20、BEP20、TRC20、Polygon。',
      q3: '如何把加密货币换成法币？', a3: '在 App 内使用 Swap 把 USDT/USDC 一键兑换为 USD，再通过法币提现转账到全球银行账户，支持 USD、SGD、HKD、GBP、EUR。',
      q4: '账户额度如何确定？', a4: '额度与 KYC 等级挂钩。完成 KYC-1 / KYC-2 认证可解锁更高的加密与法币额度，认证状态可在「账户状态」中查看。',
      q5: '资金安全如何保障？', a5: 'BITFLUX 提供 6 位交易 PIN、新设备登录提醒与实时安全通知等多重防护，关键操作均需二次验证。',
      q6: '邀请奖励怎么领？', a6: '在「邀请」页面获取专属链接分享给好友，你与好友可共享收益，最高可得 10%。',
      ps_eyebrow: '完整产品线', ps_title: '一个账户，覆盖资金的每一步', ps_lead: '存、兑、花、转、赚、投——把全球金融能力，装进一个 App。',
      p1_t: 'BF Wallet · 多币种钱包', p1_d: 'USDT、USD、BTC、ETH、USDC 集中管理，资产与余额实时刷新。', p1_tag: '多链支持',
      p2_t: 'BF Swap · 闪兑', p2_d: '加密与法币一键互换，汇率清晰透明，秒级到账。', p2_tag: '秒级到账',
      p3_t: 'BF Card · 银行卡', p3_d: 'Visa 虚拟卡与实体卡，把余额变成全球通行的消费力。', p3_tag1: '虚拟卡', p3_tag2: '实体卡',
      p4_t: 'BF Pay · 全球转账', p4_d: '提现转账至全球银行账户，支持 USD、SGD、HKD、GBP、EUR。', p4_tag: '多币种',
      p5_t: 'BF Earn · 稳健增值', p5_d: '让闲置资产为你工作，灵活存取，收益透明可查。', p5_tag: '灵活存取',
      p6_t: 'BF Invest · 投资', p6_d: '一站式投资入口，轻松配置加密与多元优质资产。', p6_tag: '一站式',
      ps_note: '* 产品功能分阶段开放，以 App 内实际上线为准；页面数字为界面示例。',
      bxp_t: '全球转账，秒级到账', bxp_s: '提现转账至全球银行账户 · USD · SGD · HKD · GBP · EUR',
      bxp_from: '从', bxp_from_v: '香港', bxp_to: '到', bxp_to_v: '新加坡', bxp_btn: '立即转账',
      bxs_t: '加密 ⇄ 法币', bxs_s: '一键互换 · 汇率透明', bxs_cap: 'USDT → USD · 秒级到账',
      bxw_c: '币种', bxw_t: '多币种钱包', bxw_s: 'USDT · USD · BTC · ETH · USDC',
      bxc_t: '随处可刷', bxc_q: '基于 Visa 网络，全球数千万商户线上线下受理。', bxc_v: '虚拟卡 · 实体卡',
      bxe_t: '让闲置资产为你工作', bxe_s: '灵活存取 · 收益透明可查',
      bxi_t: '财富，青睐有准备的人', bxi_s: '一站式投资入口，轻松配置加密与多元优质资产。', bxi_stat_l: '累计收益 · 示例',
      hw_eyebrow: '简单四步', hw_title: '几分钟，开启你的全球账户',
      hw1_t: '注册开户', hw1_d: '手机或邮箱注册，按引导几分钟完成身份认证。',
      hw2_t: '充值入金', hw2_d: '多链充值加密资产，扫码即可收款，汇入同一余额。',
      hw3_t: '一键兑换', hw3_d: '加密与法币随时互换，汇率透明，所见即所得。',
      hw4_t: '自由消费', hw4_d: '用 BF Card 全球消费，或提现到全球银行账户。',
      tr_eyebrow: '安全与信任', tr_title: '以银行级标准，守护每一笔资产', tr_lead: '合规流程、多重防护与全天候网络——让每个人都能放心使用。',
      tr1_t: '合规运营', tr1_d: '严格执行 KYC / AML 流程，分级认证，额度清晰透明。',
      tr2_t: '多重资金防护', tr2_d: '6 位交易 PIN 与二次验证，关键操作层层加锁。',
      tr3_t: '实时安全提醒', tr3_d: '新设备登录与账户动态即时通知，异常第一时间掌握。',
      tr4_t: '7×24 全天候', tr4_d: '全年无休的全球网络，资产随时可存、可兑、可动。',
      ts1: '种支持资产', ts2: '条充值网络', ts3: '种法币提现', ts4: '最高邀请奖励',
      tr_more: '了解安全与合规详情 →',
      cp_eyebrow: '合规监管', cp_title: '持牌合规，为全球金融而建', cp_lead: '在多个司法管辖区持牌运营，以机构级标准建设基础设施。',
      cb1_c: '美国', cb1_n: '货币服务业务注册 (MSB)',
      cb2_c: '香港', cb2_n: '证券牌照 1 / 4 / 5 / 9 号',
      cb3_c: '香港', cb3_n: '金钱服务经营者牌照',
      cb4_c: '英国', cb4_n: '金融行为监管局',
      cb5_c: '瑞士', cb5_n: 'VQF 自律组织会员',
      cb6_c: '阿联酋', cb6_n: '资本市场管理局',
      cb7_c: '塞舌尔', cb7_n: '金融服务管理局',
      cs1_l: '项合规牌照与注册', cs2_l: '个司法管辖区', cs3_l: '服务国家与地区', cs4_l: '全天候服务与风控',
      cta_title: '让你的资产，真正流动起来', cta_sub: '几分钟开户，把加密货币变成可花的钱。', cta_b1: '立即开户', cta_b2: '关注 Twitter',
      foot_desc: '一站式加密与法币账户。把数字资产变成可花的钱。', foot_product: '功能', foot_invest: 'BF Invest（即将上线）',
      foot_resource: '资源', foot_support: '联系支持', foot_start: '开始', foot_login: '登录',
      foot_disclaimer: '加密资产存在价格波动风险，请理性参与。'
    },
    en: {
      nav_features: 'Features', nav_card: 'BF Card', nav_security: 'Security', nav_referral: 'Refer', nav_preview: 'Preview', nav_faq: 'FAQ', nav_cta: 'Get started',
      hero_pill: 'Crypto × Fiat · one account', hero_title_1: 'Turn crypto into', hero_title_2: 'money you can spend',
      hero_sub: 'One account to swap, spend and withdraw.',
      hero_cta1: 'Open account', hero_cta2: 'Learn more', hero_stat1: 'Assets', hero_stat2_v: 'Instant', hero_stat2: 'Settlement', hero_stat3: 'Max referral reward',
      htr1: 'Compliance network', htr2: 'Accepted', htr3: 'Certified',
      gb_eyebrow: 'Global & compliant', gb_title: 'Serving 173 countries & regions', gb_lead: 'Backed by a global licensed compliance network, operating securely and compliantly.', gb_c1: 'Global compliance network', gb_more: 'Security & compliance',
      bb_eyebrow: 'In the world', bb_title: 'BITFLUX out in the real world',
      ls_eyebrow: 'In real life', ls_title: 'Built for everyday life', ls_lead: 'Golden or obsidian — both bring on-chain assets naturally into daily spending.', ls_cap1: 'Golden finish', ls_cap2: 'Obsidian black',
      strip_label: 'Supported assets & networks',
      hl1_t: 'Multi-asset wallet', hl1_d: 'USDT · USD · BTC · ETH · USDC',
      hl2_t: 'Currency swap', hl2_d: 'Instant, transparent rates',
      hl3_t: 'BF Card', hl3_d: 'Virtual / physical',
      hl4_t: 'Global withdrawal', hl4_d: 'USD · SGD · HKD · GBP · EUR',
      card_more: 'Explore BF Card →',
      cardp_title: 'Turn balance into spending power', cardp_lead: 'A Visa Platinum card — virtual instantly, physical within reach. Spend on-chain assets anywhere.',
      cardp_cta1: 'Apply now', cardp_cta2: 'Explore features',
      tier_eyebrow: 'Three finishes', tier_title: 'Pick the card that\u2019s you', tier_lead: 'The same powerful features, a different style.',
      tier1_t: 'Golden', tier1_d: 'A flowing gold finish — flagship feel. Visa Platinum tier that makes a statement.',
      tier2_t: 'Black', tier2_d: 'Minimal obsidian, understated. Subtle line texture — a timeless business choice.',
      tier3_t: 'Blue', tier3_d: 'Aurora blue, full of energy. A bold everyday card with personality.',
      ben_eyebrow: 'Card benefits', ben_title: 'One card, bridging chain and reality',
      b1_t: 'Virtual + physical', b1_d: 'Virtual cards work instantly via your wallet; physical cards swipe just as smoothly offline.',
      b2_t: 'Accepted worldwide', b2_d: 'Built on the Visa network — accepted by tens of millions of merchants, online and offline.',
      b3_t: 'Pay from balance', b3_d: 'Spend straight from your account balance — no pre-conversion, what you spend is what you see.',
      b4_t: 'Safe & in control', b4_d: 'A transaction PIN and real-time alerts guard every spend; manage card status yourself.',
      cardp_cta_title: 'Ready for your BF Card?', cardp_cta_sub: 'Open an account to get a virtual card and start spending in a few steps.',
      feat_eyebrow: 'Core features', feat_title: 'One app for your entire money flow', feat_lead: 'From deposit and swap to spending and withdrawal — all inside BITFLUX.',
      f1_step: 'Feature 01', f2_step: 'Feature 02', f3_step: 'Feature 03', f4_step: 'Feature 04', f5_step: 'Feature 05', f6_step: 'Feature 06',
      f1_t: 'Multi-asset wallet', f1_d: 'Hold USDT, USD, BTC, ETH and USDC in one account, with balances and values refreshed in real time.',
      f2_t: 'Currency Swap', f2_d: 'Swap USDT / USDC to USD in one tap — transparent rates, instant settlement, what you see is what you get.', f2_tag: 'USDT→USD',
      f3_t: 'BF Card', f3_d: 'Virtual and physical cards let you spend your balance anywhere — bringing on-chain assets to the real world.', f3_tag1: 'Virtual', f3_tag2: 'Physical',
      f4_t: 'Global fiat withdrawal', f4_d: 'Send instant transfers to bank accounts worldwide, supporting USD, SGD, HKD, GBP and EUR.',
      f5_t: 'Multi-chain deposit & withdraw', f5_d: 'Deposit and withdraw across ERC20, BEP20, TRC20 and Polygon — scan to receive, with transparent fees.',
      f6_t: 'Referral rewards', f6_d: 'Share your personal invite link and earn together with friends — up to 10% reward.', f6_tag: 'Up to 10%',
      why_eyebrow: 'Why BITFLUX', why_title: 'Control, back in your hands', why_lead: 'Transparent limits, real-time alerts and layered protection — peace of mind in the details.',
      w1_t: 'Tiered KYC, transparent limits', w1_d: 'KYC-0 / 1 / 2 verification with clear crypto and fiat limits at every tier — upgrades take effect instantly.',
      w2_t: 'History & real-time alerts', w2_d: 'Full transaction history at your fingertips, with transaction and security messages pushed in real time.',
      w3_t: 'Transaction PIN + device alerts', w3_d: 'A 6-digit PIN protects every action, and new-device logins are flagged instantly.',
      w4_t: 'Dark / light · multilingual · installable', w4_d: 'Dark and light themes, multilingual UI, and PWA install to your desktop — a smooth experience everywhere.',
      s1: 'Assets', s2: 'Deposit networks', s3: 'KYC tiers', s4: 'Max referral reward',
      pv_eyebrow: 'App preview', pv_title: 'Every screen is the real thing', pv_lead: 'All screenshots are from the live BITFLUX app.',
      pv1_t: 'Wallet overview', pv1_d: 'Assets and balances at a glance', pv2_t: 'Currency swap', pv2_d: 'Transparent rates, instant',
      pv3_t: 'BF Card', pv3_d: 'Spend with confidence', pv4_t: 'Transactions', pv4_d: 'Clear, traceable history',
      how_eyebrow: 'Three steps', how_title: 'Assets moving in minutes',
      h1_t: 'Sign up & verify', h1_d: 'Register by phone or email, complete KYC to unlock higher limits.',
      h2_t: 'Deposit & swap', h2_d: 'Deposit crypto across chains and swap to a usable fiat balance.',
      h3_t: 'Spend & withdraw', h3_d: 'Spend with the BF Card or withdraw to bank accounts worldwide.',
      secx_eyebrow: 'Security · Compliance · Trust', secx_title_1: 'Global compliance, ', secx_title_2: 'borderless trust',
      secx_lead: 'Backed by a global licensed compliance network — secure, compliant, and trustworthy.',
      tm1: 'Partner network assets secured', tm2: 'Partner network volume processed', tm3: 'Partner network countries served', tm4: 'Compliance coverage regions',
      comp_badge: 'Global compliance network', lic_more: 'View all licenses', lic_pending: 'Full license documentation is being updated — coming soon',
      lic1_r: 'United States', lic1_s: 'Money Services Business (FinCEN)',
      lic2_r: 'Hong Kong', lic2_s: 'SFC License · Type 1 / 4 / 5 / 9',
      lic3_r: 'Hong Kong', lic3_s: 'Money Service Operator',
      lic4_r: 'Hong Kong', lic4_s: 'Trust & Company Service Provider',
      lic5_r: 'United Kingdom', lic5_s: 'Financial Conduct Authority',
      lic6_r: 'United Arab Emirates', lic6_s: 'Capital Market Authority',
      lic7_r: 'Belize', lic7_s: 'Financial Services Commission',
      lic8_r: 'Seychelles', lic8_s: 'Financial Services Authority',
      lic9_r: 'South Africa', lic9_s: 'Financial Sector Conduct Authority',
      lic10_r: 'Switzerland', lic10_s: 'VQF SRO Membership',
      prot_eyebrow: 'Account protection',
      sec_eyebrow: 'Security & compliance', sec_title: 'Safety written into every detail', sec_lead: 'Tiered verification, transaction PIN, device alerts and real-time notifications form a layered defense.',
      sc1_t: 'Tiered KYC & clear limits', sc1_d: 'KYC-0/1/2 verification with transparent crypto and fiat limits, upgrade on demand.',
      sc2_t: '6-digit transaction PIN', sc2_d: 'Key actions require your PIN, locking every movement of funds.',
      sc3_t: 'New-device login alerts', sc3_d: 'Unfamiliar logins are flagged immediately, keeping you in control.',
      sc4_t: 'Real-time message center', sc4_d: 'Transaction and security messages, categorized and pushed in real time.',
      part_eyebrow: 'Infrastructure & security', part_title_1: 'Powered by', part_title_2: 'the best',
      part_lead: 'From payments and custody to compliance and risk — every layer runs on industry-leading providers.',
      pc1: 'Payments & settlement', pc2: 'Custody & wallets', pc3: 'Compliance & risk', cert_label: 'Certifications',
      card_eyebrow: 'BF Card', card_title: 'Spend with confidence', card_lead: 'Turn your balance into spending power — virtual cards instantly, physical cards within reach.',
      ref_eyebrow: 'Referral', ref_title: 'Share BITFLUX, earn together', ref_lead: 'Share your personal invite link with friends and earn together — up to 10% reward.',
      ref_link_label: 'Your personal invite link', ref_copy: 'Copy', ref_s1: 'Max reward', ref_s2: 'Invites', ref_s3_v: 'Real-time', ref_s3: 'Rewards in',
      inv_badge: 'Coming soon', inv_title: 'BF Invest is coming', inv_lead: 'Put idle assets to work. The invest feature is in the making — follow us on Twitter for early access.', inv_cta: 'Learn more',
      faq_eyebrow: 'FAQ', faq_title: 'You might be wondering',
      q1: 'What is BITFLUX?', a1: 'BITFLUX is an all-in-one crypto and fiat account: multi-asset wallet, currency swap, BF Card, global fiat withdrawals and multi-chain deposits — making your digital assets truly spendable.',
      q2: 'Which assets and networks are supported?', a2: 'Currently USDT, USD, BTC, ETH and USDC, with deposit/withdraw networks covering ERC20, BEP20, TRC20 and Polygon.',
      q3: 'How do I turn crypto into fiat?', a3: 'Use Swap in the app to convert USDT/USDC to USD in one tap, then withdraw to bank accounts worldwide — USD, SGD, HKD, GBP, EUR.',
      q4: 'How are account limits set?', a4: 'Limits are tied to your KYC tier. Completing KYC-1 / KYC-2 unlocks higher crypto and fiat limits; check your status under Account Status.',
      q5: 'How is my money kept safe?', a5: 'BITFLUX offers a 6-digit transaction PIN, new-device login alerts and real-time security notifications; key actions require second verification.',
      q6: 'How do referral rewards work?', a6: 'Grab your personal link on the Refer page and share it — you and your friends earn together, up to 10%.',
      ps_eyebrow: 'Full product suite', ps_title: 'One account for every step of your money', ps_lead: 'Deposit, swap, spend, send, earn, invest — global finance in one app.',
      p1_t: 'BF Wallet · Multi-asset', p1_d: 'Hold USDT, USD, BTC, ETH and USDC in one place, with balances refreshed in real time.', p1_tag: 'Multi-chain',
      p2_t: 'BF Swap', p2_d: 'Swap between crypto and fiat in one tap — transparent rates, instant settlement.', p2_tag: 'Instant',
      p3_t: 'BF Card', p3_d: 'Visa virtual and physical cards turn your balance into global spending power.', p3_tag1: 'Virtual', p3_tag2: 'Physical',
      p4_t: 'BF Pay · Global transfers', p4_d: 'Withdraw to bank accounts worldwide — USD, SGD, HKD, GBP and EUR supported.', p4_tag: 'Multi-currency',
      p5_t: 'BF Earn', p5_d: 'Put idle assets to work with flexible access and transparent returns.', p5_tag: 'Flexible',
      p6_t: 'BF Invest', p6_d: 'A one-stop gateway to crypto and a diversified range of quality assets.', p6_tag: 'One-stop',
      ps_note: '* Features roll out in phases; availability is as shown in the app. On-page figures are UI examples.',
      bxp_t: 'Global transfers, in seconds', bxp_s: 'Withdraw to bank accounts worldwide · USD · SGD · HKD · GBP · EUR',
      bxp_from: 'From', bxp_from_v: 'Hong Kong', bxp_to: 'To', bxp_to_v: 'Singapore', bxp_btn: 'Send now',
      bxs_t: 'Crypto ⇄ Fiat', bxs_s: 'One-tap swap · transparent rates', bxs_cap: 'USDT → USD · instant settlement',
      bxw_c: 'assets', bxw_t: 'Multi-asset wallet', bxw_s: 'USDT · USD · BTC · ETH · USDC',
      bxc_t: 'Spend anywhere', bxc_q: 'On the Visa network — accepted by tens of millions of merchants, online and offline.', bxc_v: 'Virtual · Physical',
      bxe_t: 'Put idle assets to work', bxe_s: 'Flexible access · transparent returns',
      bxi_t: 'Wealth favors the prepared', bxi_s: 'A one-stop gateway to crypto and a diversified range of quality assets.', bxi_stat_l: 'Total earned · demo',
      hw_eyebrow: 'Four simple steps', hw_title: 'Your global account, in minutes',
      hw1_t: 'Sign up', hw1_d: 'Register by phone or email and complete verification in minutes.',
      hw2_t: 'Fund your account', hw2_d: 'Deposit crypto across chains — scan to receive, into one unified balance.',
      hw3_t: 'Swap in one tap', hw3_d: 'Convert between crypto and fiat anytime, with transparent rates.',
      hw4_t: 'Spend freely', hw4_d: 'Spend globally with the BF Card, or withdraw to bank accounts worldwide.',
      tr_eyebrow: 'Security & trust', tr_title: 'Bank-grade standards for every asset', tr_lead: 'Compliant processes, layered protection and an always-on network — built for everyone to use with confidence.',
      tr1_t: 'Compliant by design', tr1_d: 'Strict KYC / AML processes, tiered verification, transparent limits.',
      tr2_t: 'Layered fund protection', tr2_d: 'A 6-digit transaction PIN and second verification lock down key actions.',
      tr3_t: 'Real-time safety alerts', tr3_d: 'New-device logins and account activity flagged the moment they happen.',
      tr4_t: 'Always on, 7×24', tr4_d: 'A network that never closes — deposit, swap and move assets anytime.',
      ts1: 'Supported assets', ts2: 'Deposit networks', ts3: 'Fiat withdrawal currencies', ts4: 'Max referral reward',
      tr_more: 'Security & compliance →',
      cp_eyebrow: 'Regulatory compliance', cp_title: 'Licensed, trusted, built for global finance', cp_lead: 'Operating across multiple jurisdictions with institutional-grade infrastructure.',
      cb1_c: 'United States', cb1_n: 'Money Services Business (MSB)',
      cb2_c: 'Hong Kong', cb2_n: 'SFC License Type 1 / 4 / 5 / 9',
      cb3_c: 'Hong Kong', cb3_n: 'Money Service Operator',
      cb4_c: 'United Kingdom', cb4_n: 'Financial Conduct Authority',
      cb5_c: 'Switzerland', cb5_n: 'VQF SRO Membership',
      cb6_c: 'UAE', cb6_n: 'Capital Market Authority',
      cb7_c: 'Seychelles', cb7_n: 'Financial Services Authority',
      cs1_l: 'Licenses & registrations', cs2_l: 'Jurisdictions', cs3_l: 'Countries & regions served', cs4_l: 'Always-on service & risk control',
      cta_title: 'Put your assets in motion', cta_sub: 'Open an account in minutes and turn crypto into money you can spend.', cta_b1: 'Open account', cta_b2: 'Follow on Twitter',
      foot_desc: 'An all-in-one crypto and fiat account. Turn digital assets into money you can spend.', foot_product: 'Features', foot_invest: 'BF Invest (soon)',
      foot_resource: 'Resources', foot_support: 'Contact support', foot_start: 'Start', foot_login: 'Log in',
      foot_disclaimer: 'Crypto assets carry price volatility risk. Please participate rationally.'
    }
  };

  var LANG = 'en';
  try {
    var saved = localStorage.getItem('bitflux_lang');
    if (saved === 'zh' || saved === 'en') LANG = saved;
  } catch (e) {}

  function applyLang(lang) {
    LANG = lang;
    var dict = I18N[lang] || I18N.zh;
    document.documentElement.lang = (lang === 'zh') ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] != null) el.textContent = dict[key];
    });
    var toggleLabel = (lang === 'zh') ? 'EN' : '中文';
    var toggle = document.getElementById('langToggle');
    if (toggle) toggle.textContent = toggleLabel;
    var toggleM = document.getElementById('langToggleMobile');
    if (toggleM) {
      toggleM.textContent = (lang === 'zh') ? 'English' : '中文';
    }
    try { localStorage.setItem('bitflux_lang', lang); } catch (e) {}
  }

  function bindLangToggle(id, closeMenu) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', function () {
      applyLang(LANG === 'zh' ? 'en' : 'zh');
      if (closeMenu && navMobile) {
        navMobile.classList.remove('open');
        if (burger) burger.classList.remove('open');
      }
    });
  }
  bindLangToggle('langToggle', false);
  bindLangToggle('langToggleMobile', true);

  applyLang(LANG);
})();
