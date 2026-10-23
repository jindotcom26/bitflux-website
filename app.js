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
      nav_features: '功能', nav_card: 'BF Card', nav_security: '安全', nav_referral: '邀请', nav_faq: '常见问题', nav_cta: '开始使用',
      hero_pill: '加密 × 法币 · 一个账户', hero_title_1: '把加密货币', hero_title_2: '变成可花的钱',
      hero_sub: '一个账户，完成兑换、消费与提现。',
      hero_cta1: '立即开户', hero_cta2: '了解更多',
      bb_eyebrow: '品牌', bb_title: '让加密资产流动，付遍世界',
      ls_eyebrow: '真实场景', ls_title: '融入每一天的生活', ls_lead: '两种卡面，日常消费都合适。', ls_cap1: 'Golden · 流光金质', ls_cap2: 'Black · 极简曜黑',
      hl1_t: '多币种钱包', hl1_d: 'USDT · USD · BTC · ETH · USDC',
      hl2_t: '外汇兑换', hl2_d: '兑换前先看汇率',
      hl3_t: 'BF Card', hl3_d: '虚拟卡 / 实体卡',
      hl4_t: '全球提现', hl4_d: 'USD · SGD · HKD · GBP · EUR',
      card_more: '查看 BF Card 详情 →',
      cardp_title: '把余额，变成消费力', cardp_lead: '用余额消费的 Visa 卡，虚拟卡、实体卡都有。',
      cardp_cta1: '立即申请', cardp_cta2: '了解功能',
      tier_eyebrow: '三款卡面', tier_title: '选一张，属于你的卡', tier_lead: '同样的强大功能，不同的风格表达。',
      tier1_t: 'Golden', tier1_d: '金色卡面，旗舰款。',
      tier2_t: 'Black', tier2_d: '极简黑色卡面，带细线纹理。',
      tier3_t: 'Blue', tier3_d: '亮蓝色卡面，日常之选。',
      ben_eyebrow: '卡片权益', ben_title: '一张卡，连接链上与现实',
      b1_t: '虚拟 + 实体', b1_d: '虚拟卡线上用，实体卡线下刷。',
      b2_t: '全球受理', b2_d: '基于 Visa 网络，线上线下都能刷。',
      b3_t: '余额直付', b3_d: '用你的 BITFLUX 余额刷卡消费。',
      b4_t: '安全可控', b4_d: '交易 PIN 和账户提醒，帮你守住资金。',
      cardp_cta_title: '准备好你的 BF Card 了吗？', cardp_cta_sub: '开户后，在 App 里申请你的卡。',
      feat_eyebrow: '核心功能', feat_title: '一个 App，覆盖资金全流程', feat_lead: '从充值、兑换、消费到提现——每一步都在 BITFLUX 里完成。',
      f1_step: '功能 01', f2_step: '功能 02', f3_step: '功能 03', f4_step: '功能 04', f5_step: '功能 05', f6_step: '功能 06',
      f1_t: '多币种钱包', f1_d: '在一个账户里持有 USDT、USD、BTC、ETH、USDC。',
      f2_t: '外汇兑换 · Swap', f2_d: '把 USDT 或 USDC 兑换成美元，确认前先看汇率。', f2_tag: 'USDT→USD',
      f3_t: 'BF Card 银行卡', f3_d: '虚拟卡和实体卡，线上线下都能用余额消费。', f3_tag1: '虚拟卡', f3_tag2: '实体卡',
      f4_t: '全球法币提现', f4_d: '提现到全球银行账户，支持 USD、SGD、HKD、GBP、EUR。',
      f5_t: '多链充值与提现', f5_d: '在多条网络上充提加密货币，包括 ERC20、BEP20 和 TRC20。',
      f6_t: '邀请有礼', f6_d: '分享你的邀请链接，和好友一起拿奖励，最高 10%。', f6_tag: '最高 10%',
      why_eyebrow: '为什么选择 BITFLUX', why_title: '把掌控权交还给你', why_lead: '额度清楚、安全提醒、交易 PIN 保护。',
      w1_t: '分级 KYC，额度透明', w1_d: 'KYC-0 / 1 / 2 三级认证，每级的加密和法币额度都写得清楚。',
      w2_t: '交易记录与实时通知', w2_d: '查看完整交易记录，并接收交易和安全消息。',
      w3_t: '交易 PIN + 设备提醒', w3_d: '关键操作需要 6 位交易 PIN，新设备登录会提醒你。',
      w4_t: '深浅色 · 多语言 · 可安装', w4_d: '深色 / 浅色主题、多语言界面，还能作为 PWA 安装到桌面。',
      s1: '种资产', s2: '条充值网络', s3: '级 KYC 认证', s4: '最高邀请奖励',
      how_eyebrow: '三步开始', how_title: '三步开始使用',
      h1_t: '注册与认证', h1_d: '用手机或邮箱注册，完成 KYC 解锁更高额度。',
      h2_t: '充值与兑换', h2_d: '充值加密货币，再兑换成美元。',
      h3_t: '消费与提现', h3_d: '用 BF Card 消费，或提现到银行账户。',
      prot_eyebrow: '账户级防护',
      sec_title: '资金安全，写进每个细节', sec_lead: '身份认证、交易 PIN、设备提醒和消息通知，一起保护你的账户。',
      sc1_t: '分级 KYC 与清晰额度', sc1_d: 'KYC-0/1/2 三级认证，加密与法币额度透明，按需升级。',
      sc2_t: '6 位交易 PIN', sc2_d: '提现等关键操作需要输入 6 位交易 PIN。',
      sc3_t: '新设备登录提醒', sc3_d: '陌生设备登录立即通知，账户安全主动可控。',
      sc4_t: '实时消息中心', sc4_d: '交易和安全消息，按类别分好。',
      card_eyebrow: 'BF Card', card_title: '随行生活，自在掌控', card_lead: '把余额变成消费力，虚拟卡、实体卡都有。',
      ref_eyebrow: '邀请有礼', ref_title: '分享 BITFLUX，共享收益', ref_lead: '把邀请链接分享给好友，一起拿奖励，最高 10%。',
      ref_link_label: '你的专属邀请链接', ref_copy: '复制', ref_s1: '最高奖励',
      inv_badge: '敬请期待', inv_title: 'BF Invest 还未上线', inv_lead: '我们正在开发中，关注我们的 Twitter 获取最新消息。', inv_cta: '了解详情',
      faq_eyebrow: '常见问题', faq_title: '你可能想了解',
      q1: 'BITFLUX 是什么？', a1: 'BITFLUX 是加密与法币一体的账户：多币种钱包、货币兑换、BF Card、法币提现和加密充值。',
      q2: '支持哪些币种和网络？', a2: '可持有 USDT、USD、BTC、ETH、USDC。网络包括 ERC20、BEP20、TRC20 和 Polygon，各币种可用的网络以 App 内显示为准。',
      q3: '如何把加密货币换成法币？', a3: '在 App 里用 Swap 把 USDT 或 USDC 换成美元，再提现到银行账户，支持 USD、SGD、HKD、GBP、EUR。',
      q4: '账户额度如何确定？', a4: '额度与 KYC 等级挂钩。完成 KYC-1 / KYC-2 认证可解锁更高的加密与法币额度，认证状态可在「账户状态」中查看。',
      q5: '资金安全如何保障？', a5: '你的账户有 6 位交易 PIN、新设备登录提醒和安全通知保护。',
      q6: '邀请奖励怎么领？', a6: '在「邀请」页面拿到你的链接并分享，你和好友一起拿奖励，最高 10%。',
      ps_eyebrow: '完整产品线', ps_title: '一个账户，覆盖资金的每一步', ps_lead: '充值、兑换、消费、提现，一个 App 搞定。',
      ps_note: '* 产品功能分阶段开放，以 App 内实际上线为准；页面数字为界面示例。',
      bxp_t: '提现到全球银行账户', bxp_s: 'USD · SGD · HKD · GBP · EUR',
      bxp_from: '从', bxp_from_v: '香港', bxp_to: '到', bxp_to_v: '新加坡', bxp_btn: '立即转账',
      bxs_t: '加密 ⇄ 法币', bxs_s: '兑换前先看汇率', bxs_cap: 'USDT / USDC → USD',
      bxw_c: '币种', bxw_t: '多币种钱包', bxw_s: 'USDT · USD · BTC · ETH · USDC',
      bxc_t: '随处可刷', bxc_q: '基于 Visa 网络，线上线下都能刷。',
      bxi_t: '即将上线', bxi_s: 'BF Invest 还未上线，关注我们的 Twitter 获取最新消息。', bxi_stat_l: '状态',
      hw_eyebrow: '简单四步', hw_title: '四步开始使用',
      hw1_t: '注册开户', hw1_d: '用手机或邮箱注册，再完成身份认证。',
      hw2_t: '充值入金', hw2_d: '通过 ERC20、BEP20、TRC20 或 Polygon 充值加密货币。',
      hw3_t: '一键兑换', hw3_d: '把加密货币兑换成美元，确认前先看汇率。',
      hw4_t: '自由消费', hw4_d: '用 BF Card 消费，或提现到银行账户。',
      tr_eyebrow: '安全与信任', tr_title: '多重防护，守护你的账户', tr_lead: '身份认证、交易 PIN 和安全提醒，帮你守住账户。',
      tr1_t: '实名认证', tr1_d: '三级 KYC 认证，每级额度写得清楚。',
      tr2_t: '交易 PIN', tr2_d: '提现等关键操作需要输入 6 位交易 PIN。',
      tr3_t: '安全提醒', tr3_d: '新设备登录和账户变动都会提醒你。',
      tr4_t: '有问题，找我们', tr4_d: '通过邮箱或 Twitter 联系我们的团队。',
      ts1: '种支持资产', ts2: '条充值网络', ts3: '种法币提现', ts4: '最高邀请奖励',
      tr_more: '查看安全详情 →',
      cp_eyebrow: '登记', cp_title: '已在 FinCEN 登记', cp_lead: 'BitFlux Limited 已在美国登记为货币服务业务（MSB）。',
      cb1_c: '美国', cb1_n: '货币服务业务 (MSB)',
      cta_title: '让你的资产，真正流动起来', cta_sub: '开个账户，把加密货币变成可花的钱。', cta_b1: '立即开户', cta_b2: '关注 Twitter',
      foot_desc: '一站式加密与法币账户。把数字资产变成可花的钱。', foot_product: '功能', foot_invest: 'BF Invest（即将上线）',
      foot_resource: '资源', foot_support: '联系支持', foot_start: '开始', foot_login: '登录',
      foot_disclaimer: '加密资产存在价格波动风险，请理性参与。',
      foot_legal: '法律条款', foot_privacy: '隐私政策', foot_terms: '服务条款', foot_email_l: '邮箱：',
      foot_entity: '于英属维尔京群岛注册成立（公司编号 2189521），办公地址位于香港。',
      legal_updated: '最后更新：2026 年 10 月 23 日',
      bxd_pill: '充值', bxd_t: '4 条网络充值', bxi_stat_v: '开发中', reg_name_l: '登记名称', reg_no_l: 'MSB 登记号', reg_check_l: '查验', reg_check: 'FinCEN MSB 登记查询 →', reg_note: 'MSB 登记不是牌照，FinCEN 也不为任何登记机构背书。', reg_line: 'BitFlux Limited 已在美国 FinCEN 登记为货币服务业务（MSB），登记号 31000328099115。', feat_note: '* 本页的 App 界面为示意图，数据仅为示例。',
      title_home: 'BITFLUX · 把加密货币变成可花的钱',
      title_features: '功能详情 · BITFLUX',
      title_card: 'BF Card · BITFLUX',
      title_privacy: '隐私政策 · BITFLUX',
      title_terms: '服务条款 · BITFLUX',
      meta_home: 'BITFLUX 是一站式加密与法币账户：多币种钱包、外汇兑换、BF Card 银行卡、全球法币提现与多链充提。',
      meta_features: 'BITFLUX 核心功能：多币种钱包、外汇兑换、全球法币提现、多链充提、邀请奖励、分级 KYC 与安全防护。',
      meta_card: 'BITFLUX BF Card — Visa 虚拟卡与实体卡，用余额线上线下消费。三款卡面：Golden、Black、Blue。',
      meta_privacy: 'BitFlux Limited 如何在 BITFLUX 网站和 App 中收集、使用和保护你的个人资料。',
      meta_terms: '使用 BitFlux Limited 提供的 BITFLUX 网站、App 及相关服务的条款。',
      /* features.html 手机模拟界面内的演示文案 */
      mk_tab_home: '首页', mk_tab_card: '卡片', mk_tab_msg: '消息', mk_tab_set: '设置', mk_tab_hist: '记录', mk_tab_ref: '邀请',
      mk_w_title: '钱包', mk_w_bal: '可用余额', mk_w_send: '发送', mk_w_recv: '接收', mk_w_swap: '兑换', mk_w_invest: '投资', mk_w_assets: '我的资产',
      mk_s_title: '外汇兑换', mk_s_sell: '卖出', mk_s_buy: '买入', mk_s_rate: '参考汇率', mk_s_eta_l: '预计到账', mk_s_eta_v: '秒级', mk_s_btn: '确认兑换',
      mk_c_spent: '本月消费', mk_c_avail: '可用额度', mk_c_recent: '最近消费', mk_c_t1: '今天 14:22', mk_c_t2: '昨天 09:10',
      mk_wd_title: '法币提现', mk_wd_amt: '提现金额', mk_wd_cur: '到账币种', mk_wd_bank: '收款银行', mk_wd_eta: '预计 1 个工作日到账', mk_wd_btn: '确认提现',
      mk_h_title: '交易记录',
      mk_h_r1: '充值 · TRC20', mk_h_r1t: '今天 11:02', mk_h_r2: '兑换 USDT→USD', mk_h_r2t: '今天 10:48',
      mk_h_r3: '提现 · HSBC', mk_h_r3t: '昨天 18:30', mk_h_r4: '充值 · ERC20', mk_h_r5: '邀请奖励',
      mk_r_title: '邀请有礼', mk_r_cap: '邀请好友，共享最高 10% 收益', mk_r_link: '你的专属邀请链接', mk_r_copy: '复制',
      mk_r_invited: '已邀请', mk_r_earned: '累计奖励', mk_r_recent: '最近奖励', mk_r_row1: '好友 A 完成认证', mk_r_row1t: '今天 12:30',
      mk_k_title: '账户状态', mk_k_sec1: '身份认证等级',
      mk_k_l0: 'KYC-0 · 基础', mk_k_l0d: '注册即开通', mk_k_l1: 'KYC-1 · 标准', mk_k_l1d: '解锁更高额度',
      mk_k_l2: 'KYC-2 · 高级', mk_k_l2d: '最高额度 · 审核中', mk_k_done: '已完成', mk_k_prog: '进行中',
      mk_k_sec2: '当前额度', mk_k_dep: '加密充值 / 日', mk_k_wd: '法币提现 / 日'
    },
    en: {
      nav_features: 'Features', nav_card: 'BF Card', nav_security: 'Security', nav_referral: 'Refer', nav_faq: 'FAQ', nav_cta: 'Get started',
      hero_pill: 'Crypto × Fiat · one account', hero_title_1: 'Turn crypto into', hero_title_2: 'money you can spend',
      hero_sub: 'One account to swap, spend and withdraw.',
      hero_cta1: 'Open account', hero_cta2: 'Learn more',
      bb_eyebrow: 'Brand', bb_title: 'Flux your crypto, pay the world',
      ls_eyebrow: 'In real life', ls_title: 'Built for everyday life', ls_lead: 'Two looks for everyday spending.', ls_cap1: 'Golden finish', ls_cap2: 'Obsidian black',
      hl1_t: 'Multi-asset wallet', hl1_d: 'USDT · USD · BTC · ETH · USDC',
      hl2_t: 'Currency swap', hl2_d: 'See the rate before you swap',
      hl3_t: 'BF Card', hl3_d: 'Virtual / physical',
      hl4_t: 'Global withdrawal', hl4_d: 'USD · SGD · HKD · GBP · EUR',
      card_more: 'Explore BF Card →',
      cardp_title: 'Turn balance into spending power', cardp_lead: 'A Visa card for your balance — virtual or physical.',
      cardp_cta1: 'Apply now', cardp_cta2: 'Explore features',
      tier_eyebrow: 'Three finishes', tier_title: 'Pick the card that\u2019s you', tier_lead: 'The same powerful features, a different style.',
      tier1_t: 'Golden', tier1_d: 'A gold finish — our flagship look.',
      tier2_t: 'Black', tier2_d: 'A minimal black finish with a subtle line texture.',
      tier3_t: 'Blue', tier3_d: 'A bright blue finish for every day.',
      ben_eyebrow: 'Card benefits', ben_title: 'One card, bridging chain and reality',
      b1_t: 'Virtual + physical', b1_d: 'Use a virtual card online, or a physical card in stores.',
      b2_t: 'Accepted worldwide', b2_d: 'Pay online and in stores on the Visa network.',
      b3_t: 'Pay from balance', b3_d: 'Use your BITFLUX balance to pay with your card.',
      b4_t: 'Safe & in control', b4_d: 'Your transaction PIN and account alerts help keep your money safe.',
      cardp_cta_title: 'Ready for your BF Card?', cardp_cta_sub: 'Open an account, then apply for your card in the app.',
      feat_eyebrow: 'Core features', feat_title: 'One app for your entire money flow', feat_lead: 'From deposit and swap to spending and withdrawal — all inside BITFLUX.',
      f1_step: 'Feature 01', f2_step: 'Feature 02', f3_step: 'Feature 03', f4_step: 'Feature 04', f5_step: 'Feature 05', f6_step: 'Feature 06',
      f1_t: 'Multi-asset wallet', f1_d: 'Hold USDT, USD, BTC, ETH and USDC in one account.',
      f2_t: 'Currency Swap', f2_d: 'Swap USDT or USDC to USD. You see the rate before you confirm.', f2_tag: 'USDT→USD',
      f3_t: 'BF Card', f3_d: 'Virtual and physical cards let you spend your balance online and in stores.', f3_tag1: 'Virtual', f3_tag2: 'Physical',
      f4_t: 'Global fiat withdrawal', f4_d: 'Withdraw to bank accounts worldwide in USD, SGD, HKD, GBP or EUR.',
      f5_t: 'Multi-chain deposit & withdraw', f5_d: 'Deposit and withdraw crypto on several networks, including ERC20, BEP20 and TRC20.',
      f6_t: 'Referral rewards', f6_d: 'Share your invite link and earn rewards with friends — up to 10%.', f6_tag: 'Up to 10%',
      why_eyebrow: 'Why BITFLUX', why_title: 'Control, back in your hands', why_lead: 'Clear limits, security alerts and a transaction PIN.',
      w1_t: 'Tiered KYC, transparent limits', w1_d: 'Three KYC tiers (KYC-0, 1 and 2), each with clear crypto and fiat limits.',
      w2_t: 'History & real-time alerts', w2_d: 'See your full transaction history, and get transaction and security messages.',
      w3_t: 'Transaction PIN + device alerts', w3_d: 'A 6-digit PIN protects key actions, and you get an alert when a new device logs in.',
      w4_t: 'Dark / light · multilingual · installable', w4_d: 'Dark and light themes, several languages, and you can install it to your home screen (PWA).',
      s1: 'Assets', s2: 'Deposit networks', s3: 'KYC tiers', s4: 'Max referral reward',
      how_eyebrow: 'Three steps', how_title: 'Get started in three steps',
      h1_t: 'Sign up & verify', h1_d: 'Sign up with your phone or email, then complete KYC to unlock higher limits.',
      h2_t: 'Deposit & swap', h2_d: 'Deposit crypto, then swap it to USD.',
      h3_t: 'Spend & withdraw', h3_d: 'Spend with the BF Card, or withdraw to a bank account.',
      prot_eyebrow: 'Account protection',
      sec_title: 'Safety written into every detail', sec_lead: 'Identity checks, a transaction PIN, device alerts and notifications protect your account.',
      sc1_t: 'Tiered KYC & clear limits', sc1_d: 'KYC-0/1/2 verification with transparent crypto and fiat limits, upgrade on demand.',
      sc2_t: '6-digit transaction PIN', sc2_d: 'Key actions like withdrawals need your 6-digit PIN.',
      sc3_t: 'New-device login alerts', sc3_d: 'Unfamiliar logins are flagged immediately, keeping you in control.',
      sc4_t: 'Real-time message center', sc4_d: 'Transaction and security messages, sorted by category.',
      card_eyebrow: 'BF Card', card_title: 'Spend with confidence', card_lead: 'Turn your balance into spending power, with virtual and physical cards.',
      ref_eyebrow: 'Referral', ref_title: 'Share BITFLUX, earn together', ref_lead: 'Share your invite link with friends and earn rewards together — up to 10%.',
      ref_link_label: 'Your personal invite link', ref_copy: 'Copy', ref_s1: 'Max reward',
      inv_badge: 'Coming soon', inv_title: 'BF Invest is not live yet', inv_lead: 'We’re building it. Follow us on Twitter for updates.', inv_cta: 'Learn more',
      faq_eyebrow: 'FAQ', faq_title: 'You might be wondering',
      q1: 'What is BITFLUX?', a1: 'BITFLUX is a crypto and fiat account: multi-asset wallet, currency swap, BF Card, fiat withdrawals and crypto deposits.',
      q2: 'Which assets and networks are supported?', a2: 'You can hold USDT, USD, BTC, ETH and USDC. Networks include ERC20, BEP20, TRC20 and Polygon; check the app for the networks available for each asset.',
      q3: 'How do I turn crypto into fiat?', a3: 'Use Swap in the app to convert USDT or USDC to USD, then withdraw to a bank account in USD, SGD, HKD, GBP or EUR.',
      q4: 'How are account limits set?', a4: 'Limits are tied to your KYC tier. Completing KYC-1 / KYC-2 unlocks higher crypto and fiat limits; check your status under Account Status.',
      q5: 'How is my money kept safe?', a5: 'Your account is protected by a 6-digit transaction PIN, new-device login alerts and security notifications.',
      q6: 'How do referral rewards work?', a6: 'Get your invite link on the Refer page and share it. You and your friends earn rewards together, up to 10%.',
      ps_eyebrow: 'Full product suite', ps_title: 'One account for every step of your money', ps_lead: 'Deposit, swap, spend and send — all in one app.',
      ps_note: '* Features roll out in phases; availability is as shown in the app. On-page figures are UI examples.',
      bxp_t: 'Send to bank accounts worldwide', bxp_s: 'USD · SGD · HKD · GBP · EUR',
      bxp_from: 'From', bxp_from_v: 'Hong Kong', bxp_to: 'To', bxp_to_v: 'Singapore', bxp_btn: 'Send now',
      bxs_t: 'Crypto ⇄ Fiat', bxs_s: 'See the rate before you swap', bxs_cap: 'USDT / USDC → USD',
      bxw_c: 'assets', bxw_t: 'Multi-asset wallet', bxw_s: 'USDT · USD · BTC · ETH · USDC',
      bxc_t: 'Spend anywhere', bxc_q: 'Pay online and in stores on the Visa network.',
      bxi_t: 'Coming soon', bxi_s: 'BF Invest is not live yet. Follow us on Twitter for updates.', bxi_stat_l: 'Status',
      hw_eyebrow: 'Four simple steps', hw_title: 'Get started in four steps',
      hw1_t: 'Sign up', hw1_d: 'Sign up with your phone or email, then verify your identity.',
      hw2_t: 'Fund your account', hw2_d: 'Deposit crypto on ERC20, BEP20, TRC20 or Polygon.',
      hw3_t: 'Swap in one tap', hw3_d: 'Swap crypto to USD. You see the rate before you confirm.',
      hw4_t: 'Spend freely', hw4_d: 'Spend with the BF Card, or withdraw to a bank account.',
      tr_eyebrow: 'Security & trust', tr_title: 'Layered protection for your account', tr_lead: 'Identity checks, a transaction PIN and security alerts help keep your account safe.',
      tr1_t: 'Verified accounts', tr1_d: 'Three KYC tiers, with clear limits at each tier.',
      tr2_t: 'Transaction PIN', tr2_d: 'A 6-digit PIN protects key actions like withdrawals.',
      tr3_t: 'Security alerts', tr3_d: 'Get alerts for new-device logins and account activity.',
      tr4_t: 'Help when you need it', tr4_d: 'Reach our team by email or on Twitter.',
      ts1: 'Supported assets', ts2: 'Deposit networks', ts3: 'Fiat withdrawal currencies', ts4: 'Max referral reward',
      tr_more: 'More on security →',
      cp_eyebrow: 'Registration', cp_title: 'Registered with FinCEN', cp_lead: 'BitFlux Limited is registered in the United States as a Money Services Business (MSB).',
      cb1_c: 'United States', cb1_n: 'Money Services Business (MSB)',
      cta_title: 'Put your assets in motion', cta_sub: 'Open an account and turn crypto into money you can spend.', cta_b1: 'Open account', cta_b2: 'Follow on Twitter',
      foot_desc: 'An all-in-one crypto and fiat account. Turn digital assets into money you can spend.', foot_product: 'Features', foot_invest: 'BF Invest (soon)',
      foot_resource: 'Resources', foot_support: 'Contact support', foot_start: 'Start', foot_login: 'Log in',
      foot_disclaimer: 'Crypto assets carry price volatility risk. Please participate rationally.',
      foot_legal: 'Legal', foot_privacy: 'Privacy Policy', foot_terms: 'Terms of Service', foot_email_l: 'Email: ',
      foot_entity: 'Incorporated in the British Virgin Islands (Company No. 2189521), with its office in Hong Kong.',
      legal_updated: 'Last updated: 23 October 2026',
      bxd_pill: 'Deposit', bxd_t: 'Deposit on 4 networks', bxi_stat_v: 'In development', reg_name_l: 'Registered name', reg_no_l: 'MSB registration no.', reg_check_l: 'Verify', reg_check: 'FinCEN MSB Registrant Search →', reg_note: 'MSB registration is not a license. FinCEN does not endorse any registered business.', reg_line: 'BitFlux Limited is registered with FinCEN (United States) as a Money Services Business. Registration no. 31000328099115.', feat_note: '* App screens on this page are illustrations with sample data.',
      title_home: 'BITFLUX · Turn crypto into money you can spend',
      title_features: 'Features · BITFLUX',
      title_card: 'BF Card · BITFLUX',
      title_privacy: 'Privacy Policy · BITFLUX',
      title_terms: 'Terms of Service · BITFLUX',
      meta_home: 'BITFLUX is an all-in-one crypto and fiat account: multi-currency wallet, currency swap, BF Card, global fiat withdrawal and multi-chain deposit & withdraw.',
      meta_features: 'BITFLUX core features: multi-currency wallet, currency swap, global fiat withdrawal, multi-chain deposit & withdraw, referral rewards, tiered KYC and security.',
      meta_card: 'BITFLUX BF Card — Visa virtual and physical cards. Spend your balance online and in stores. Three designs: Golden, Black, Blue.',
      meta_privacy: 'How BitFlux Limited collects, uses and protects your personal data across the BITFLUX website and app.',
      meta_terms: 'The terms that govern your use of the BITFLUX website, app and related services provided by BitFlux Limited.',
      /* Demo copy inside the phone mockups on features.html */
      mk_tab_home: 'Home', mk_tab_card: 'Card', mk_tab_msg: 'Messages', mk_tab_set: 'Settings', mk_tab_hist: 'History', mk_tab_ref: 'Refer',
      mk_w_title: 'Wallet', mk_w_bal: 'Available balance', mk_w_send: 'Send', mk_w_recv: 'Receive', mk_w_swap: 'Swap', mk_w_invest: 'Invest', mk_w_assets: 'My assets',
      mk_s_title: 'Currency swap', mk_s_sell: 'You sell', mk_s_buy: 'You get', mk_s_rate: 'Indicative rate', mk_s_eta_l: 'Settlement', mk_s_eta_v: 'Seconds', mk_s_btn: 'Confirm swap',
      mk_c_spent: 'Spent this month', mk_c_avail: 'Available limit', mk_c_recent: 'Recent spending', mk_c_t1: 'Today 14:22', mk_c_t2: 'Yesterday 09:10',
      mk_wd_title: 'Fiat withdrawal', mk_wd_amt: 'Withdrawal amount', mk_wd_cur: 'Receive currency', mk_wd_bank: 'Recipient bank', mk_wd_eta: 'Arrives in ~1 business day', mk_wd_btn: 'Confirm withdrawal',
      mk_h_title: 'Transactions',
      mk_h_r1: 'Deposit · TRC20', mk_h_r1t: 'Today 11:02', mk_h_r2: 'Swap USDT→USD', mk_h_r2t: 'Today 10:48',
      mk_h_r3: 'Withdrawal · HSBC', mk_h_r3t: 'Yesterday 18:30', mk_h_r4: 'Deposit · ERC20', mk_h_r5: 'Referral reward',
      mk_r_title: 'Referral rewards', mk_r_cap: 'Invite friends and earn up to 10% together', mk_r_link: 'Your personal invite link', mk_r_copy: 'Copy',
      mk_r_invited: 'Invited', mk_r_earned: 'Total rewards', mk_r_recent: 'Recent rewards', mk_r_row1: 'Friend A passed KYC', mk_r_row1t: 'Today 12:30',
      mk_k_title: 'Account status', mk_k_sec1: 'Verification level',
      mk_k_l0: 'KYC-0 · Basic', mk_k_l0d: 'Active on sign-up', mk_k_l1: 'KYC-1 · Standard', mk_k_l1d: 'Higher limits unlocked',
      mk_k_l2: 'KYC-2 · Advanced', mk_k_l2d: 'Top limits · in review', mk_k_done: 'Done', mk_k_prog: 'In review',
      mk_k_sec2: 'Current limits', mk_k_dep: 'Crypto deposit/day', mk_k_wd: 'Fiat withdrawal/day'
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
    var titleKey = document.body.getAttribute('data-i18n-title');
    if (titleKey && dict[titleKey]) document.title = dict[titleKey];
    var descKey = document.body.getAttribute('data-i18n-desc');
    var descTag = document.querySelector('meta[name="description"]');
    if (descKey && dict[descKey] && descTag) descTag.setAttribute('content', dict[descKey]);
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
