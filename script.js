/* =========================================================
   智造未来 / interactions
   Vanilla JS. Designed to degrade gracefully.
   ========================================================= */
(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;

  /* ---------------------------------------------------------
     Header, reading progress, active navigation
     --------------------------------------------------------- */
  const header = $("#siteHeader");
  const progress = $("#readProgress");
  const navLinks = $$(".primary-nav a");
  const navSections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      return id && id.startsWith("#") ? document.getElementById(id.slice(1)) : null;
    })
    .filter(Boolean);

  let scrollTicking = false;
  const updateScrollUI = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    header?.classList.toggle("is-scrolled", y > 24);

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(1, Math.max(0, y / scrollable)) : 0;
    if (progress) progress.style.width = `${ratio * 100}%`;
    scrollTicking = false;
  };

  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });
  updateScrollUI();

  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute("href") === `#${visible.target.id}`;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.01, 0.2, 0.5] }
    );
    navSections.forEach((section) => navObserver.observe(section));
  }

  /* ---------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------- */
  const navToggle = $("#navToggle");
  const nav = $("#primaryNav");
  const setNav = (open) => {
    document.body.classList.toggle("nav-open", open);
    navToggle?.setAttribute("aria-expanded", String(open));
    navToggle?.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  };
  navToggle?.addEventListener("click", () => {
    setNav(!document.body.classList.contains("nav-open"));
  });
  nav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setNav(false);
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("nav-open")) setNav(false);
  });

  /* ---------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------- */
  const revealItems = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ---------------------------------------------------------
     Very light cursor / hero parallax
     --------------------------------------------------------- */
  if (!isCoarse && !reduceMotion) {
    const light = $("#cursorLight");
    let pointerX = 0;
    let pointerY = 0;
    let lightFrame = null;

    window.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      document.body.classList.add("has-pointer");
      if (light && !lightFrame) {
        lightFrame = window.requestAnimationFrame(() => {
          light.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
          lightFrame = null;
        });
      }
    }, { passive: true });

    const hero = $(".hero");
    const visual = $("#heroVisual");
    if (hero && visual) {
      let heroFrame = null;
      hero.addEventListener("pointermove", (event) => {
        if (heroFrame) return;
        heroFrame = window.requestAnimationFrame(() => {
          const rect = hero.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
          const y = ((event.clientY - rect.top) / rect.height - 0.5) * 16;
          visual.style.setProperty("--orb-x", `${x.toFixed(2)}px`);
          visual.style.setProperty("--orb-y", `${y.toFixed(2)}px`);
          heroFrame = null;
        });
      }, { passive: true });
      hero.addEventListener("pointerleave", () => {
        visual.style.setProperty("--orb-x", "0px");
        visual.style.setProperty("--orb-y", "0px");
      });
    }
  }

  /* ---------------------------------------------------------
     Unmet-need dot matrix
     --------------------------------------------------------- */
  const gapDots = $("#gapDots");
  if (gapDots) {
    const highlighted = new Set([4, 8, 13, 22, 31, 37, 45, 52, 61]);
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 100; i += 1) {
      const dot = document.createElement("span");
      if (highlighted.has(i)) dot.dataset.highlight = "true";
      fragment.appendChild(dot);
    }
    gapDots.appendChild(fragment);

    let played = false;
    const playGap = () => {
      if (played) return;
      played = true;
      const dots = $$("span", gapDots);
      let sequence = 0;
      dots.forEach((dot) => {
        if (dot.dataset.highlight !== "true") return;
        dot.style.transitionDelay = reduceMotion ? "0ms" : `${sequence * 45}ms`;
        dot.classList.add("is-on");
        sequence += 1;
      });
    };

    if ("IntersectionObserver" in window) {
      const gapObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          playGap();
          gapObserver.disconnect();
        }
      }, { threshold: 0.2 });
      gapObserver.observe(gapDots);
    } else {
      playGap();
    }
  }

  /* ---------------------------------------------------------
     Material fingerprint
     --------------------------------------------------------- */
  const MATERIALS = {
    polymer: {
      code: "M–01",
      en: "POLYMERS",
      title: "高分子",
      tagline: "可编织的临时建筑",
      desc: "以酯键或肽键连接的长链分子，可以通过静电纺丝、挤出或 3D 打印形成纤维与多孔支架。它们为细胞提供临时附着面，并在体内逐步让位于新生组织。",
      examples: "PCL、PLGA、丝素、胶原",
      fit: "皮肤、血管、肌腱、骨",
      risk: "降解产物酸化、力学衰减与再生速率不匹配",
      note: "“可降解”不是越早越好，而是刚刚好。",
      color: "#62e7ff",
      values: [84, 92, 54, 89, 44],
    },
    hydrogel: {
      code: "M–02",
      en: "HYDROGELS",
      title: "水凝胶",
      tagline: "给细胞的水环境",
      desc: "由亲水网络包裹大量水分形成，可注射、可光固化，也能携带细胞与信号分子。它的高含水率接近天然基质，但力学强度通常需要第二相或复合结构来补足。",
      examples: "海藻酸、明胶、透明质酸、PEG",
      fit: "皮肤、软骨、心肌、神经界面",
      risk: "强度低、易溶胀、在动态载荷下疲劳",
      note: "水的存在让细胞舒服，也让材料更难“站稳”。",
      color: "#74f4dd",
      values: [94, 70, 26, 78, 66],
    },
    ceramic: {
      code: "M–03",
      en: "CERAMICS",
      title: "生物陶瓷",
      tagline: "坚硬的生物信号",
      desc: "羟基磷灰石、β-磷酸三钙与生物玻璃可以释放钙、磷、硅等离子，参与矿化并促进成骨。它们与骨的无机相相似，但脆性使其更适合涂层、颗粒或与高分子复合。",
      examples: "HA、β-TCP、生物玻璃",
      fit: "骨、牙、骨—植入体界面",
      risk: "脆性、降解速率难控、独立承重能力有限",
      note: "它提供的是矿化信号，而不只是“硬度”。",
      color: "#a8d7ff",
      values: [42, 52, 74, 48, 91],
    },
    metal: {
      code: "M–04",
      en: "METALS & COMPOSITES",
      title: "金属与复合",
      tagline: "承重与导电的骨架",
      desc: "钛合金、镁合金与形状记忆合金提供高比强度与耐疲劳性能，常用于承重植入物；当它们与高分子、陶瓷或碳纳米材料复合时，也能获得可调的降解与导电能力。",
      examples: "Ti-6Al-4V、镁合金、形状记忆合金",
      fit: "骨、关节、心血管支架、导电界面",
      risk: "应力屏蔽、腐蚀与离子释放、长期影像伪影",
      note: "承重是优势，也是与组织力学不匹配的来源。",
      color: "#74b9ff",
      values: [22, 30, 96, 66, 24],
    },
  };

  const materialTabs = $$("[data-material-tab]");
  const detailCode = $("#detailCode");
  const detailEn = $("#detailEn");
  const detailTitle = $("#detailTitle");
  const detailTagline = $("#detailTagline");
  const detailDesc = $("#detailDesc");
  const detailExamples = $("#detailExamples");
  const detailFit = $("#detailFit");
  const detailRisk = $("#detailRisk");
  const detailNote = $("#detailNote");

  const radar = $("#radar");
  const radarGrid = $("#radarGrid");
  const radarData = $("#radarData");
  const radarAxes = ["柔顺性", "降解性", "承载", "可加工", "生物活性"];
  const radarCenter = { x: 210, y: 190 };
  const radarRadius = 132;
  let radarPolygon = null;
  let radarDots = [];
  let radarCurrent = [0, 0, 0, 0, 0];
  let radarAnimation = null;
  let activeMaterial = "polymer";

  const radarPoint = (index, value) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / radarAxes.length;
    const radius = (radarRadius * value) / 100;
    return {
      x: radarCenter.x + Math.cos(angle) * radius,
      y: radarCenter.y + Math.sin(angle) * radius,
    };
  };

  const pointsToString = (values) => values
    .map((value, index) => {
      const point = radarPoint(index, value);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");

  if (radar && radarGrid && radarData) {
    const svgNS = "http://www.w3.org/2000/svg";
    const makeSvg = (tag, attributes = {}) => {
      const element = document.createElementNS(svgNS, tag);
      Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
      return element;
    };

    // Concentric rings and axes.
    [20, 40, 60, 80, 100].forEach((level, ringIndex) => {
      const polygon = makeSvg("polygon", {
        points: pointsToString(new Array(radarAxes.length).fill(level)),
        fill: ringIndex % 2 === 0 ? "rgba(98, 231, 255, 0.018)" : "none",
        stroke: "rgba(124, 177, 233, 0.15)",
        "stroke-width": "1",
      });
      radarGrid.appendChild(polygon);
    });
    radarAxes.forEach((label, index) => {
      const outer = radarPoint(index, 100);
      const line = makeSvg("line", {
        x1: radarCenter.x,
        y1: radarCenter.y,
        x2: outer.x,
        y2: outer.y,
        stroke: "rgba(124, 177, 233, 0.16)",
        "stroke-width": "1",
      });
      radarGrid.appendChild(line);

      const labelPoint = radarPoint(index, 119);
      const text = makeSvg("text", {
        x: labelPoint.x,
        y: labelPoint.y,
        fill: "rgba(145, 169, 198, 0.8)",
        "font-size": "9",
        "font-family": "var(--sans)",
        "text-anchor": index === 0 ? "middle" : (Math.cos(-Math.PI / 2 + index * Math.PI * 2 / 5) > 0 ? "start" : "end"),
        "dominant-baseline": "middle",
        "letter-spacing": "0.04em",
      });
      text.textContent = label;
      radarGrid.appendChild(text);
    });

    radarPolygon = makeSvg("polygon", {
      points: pointsToString(MATERIALS.polymer.values),
      fill: "currentColor",
      "fill-opacity": "0.12",
      stroke: "currentColor",
      "stroke-width": "1.6",
      "stroke-linejoin": "round",
    });
    radarPolygon.style.transition = "none";
    radarData.appendChild(radarPolygon);
    radarDots = radarAxes.map(() => {
      const dot = makeSvg("circle", {
        r: "3.2",
        fill: "currentColor",
        stroke: "#04101f",
        "stroke-width": "1.5",
      });
      radarData.appendChild(dot);
      return dot;
    });
    radar.style.color = MATERIALS.polymer.color;
  }

  const setRadarValues = (values) => {
    if (!radarPolygon) return;
    radarPolygon.setAttribute("points", pointsToString(values));
    radarDots.forEach((dot, index) => {
      const point = radarPoint(index, values[index]);
      dot.setAttribute("cx", point.x.toFixed(1));
      dot.setAttribute("cy", point.y.toFixed(1));
    });
  };

  radarCurrent = [...MATERIALS.polymer.values];
  setRadarValues(radarCurrent);

  const animateRadar = (target, duration = 620) => {
    if (!radarPolygon) return;
    if (radarAnimation) window.cancelAnimationFrame(radarAnimation);
    if (reduceMotion || duration === 0) {
      radarCurrent = [...target];
      setRadarValues(radarCurrent);
      return;
    }
    const from = [...radarCurrent];
    const started = performance.now();
    const frame = (now) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      radarCurrent = from.map((value, index) => value + (target[index] - value) * eased);
      setRadarValues(radarCurrent);
      if (t < 1) radarAnimation = window.requestAnimationFrame(frame);
    };
    radarAnimation = window.requestAnimationFrame(frame);
  };

  const selectTab = (key) => {
    materialTabs.forEach((tab) => {
      const selected = tab.dataset.materialTab === key;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
  };

  const renderMaterial = (key, animate = true) => {
    const data = MATERIALS[key];
    if (!data) return;
    activeMaterial = key;
    selectTab(key);

    if (detailCode) detailCode.textContent = data.code;
    if (detailEn) detailEn.textContent = data.en;
    if (detailTitle) detailTitle.textContent = data.title;
    if (detailTagline) detailTagline.textContent = data.tagline;
    if (detailDesc) detailDesc.textContent = data.desc;
    if (detailExamples) detailExamples.textContent = data.examples;
    if (detailFit) detailFit.textContent = data.fit;
    if (detailRisk) detailRisk.textContent = data.risk;
    if (detailNote) detailNote.textContent = data.note;
    if (radar) radar.style.color = data.color;

    animateRadar(data.values, animate ? 620 : 0);
  };

  materialTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => renderMaterial(tab.dataset.materialTab));
    tab.addEventListener("keydown", (event) => {
      const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % materialTabs.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + materialTabs.length) % materialTabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = materialTabs.length - 1;
      const next = materialTabs[nextIndex];
      next.focus();
      renderMaterial(next.dataset.materialTab);
    });
  });

  $$("[data-material-link]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      renderMaterial(card.dataset.materialLink, true);
      $("#fingerprint")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  renderMaterial("polymer", false);

  /* ---------------------------------------------------------
     Organ–material matcher
     --------------------------------------------------------- */
  const ORGANS = {
    skin: {
      index: "01",
      name: "皮肤",
      en: "SKIN",
      icon: "#i-skin",
      accent: "#62e7ff",
      readiness: "临床常规",
      function: "覆盖与屏障，同时承担感觉、免疫与体温调节。",
      conflict: "快速血管化 vs 立即封闭",
      conflictDetail: "大面积创面需要立刻封闭以防止感染，但支架必须先被血管化，细胞才能长期存活。",
      evidence: 'Yannas & Burke 1980；Integra 双层皮肤模板已进入临床。<a href="#ref-13">[13]</a>',
      note: "材料先造土壤，细胞再长成森林。",
      stack: [
        { material: "多孔胶原 / 明胶支架", role: "真皮模板，引导成纤维细胞与血管长入" },
        { material: "硅胶 / 聚氨酯半透膜", role: "临时表皮屏障，控制水分与细菌" },
        { material: "角质形成细胞 / 成纤维细胞", role: "重建表皮与真皮微环境" },
      ],
    },
    vessel: {
      index: "02",
      name: "血管",
      en: "VESSEL",
      icon: "#i-vessel",
      accent: "#5fd8ff",
      readiness: "临床研究 / 有限应用",
      function: "承压、抗凝、顺应血流，并在接口处保持内皮完整性。",
      conflict: "抗血栓 vs 力学顺应",
      conflictDetail: "小口径移植物容易形成血栓与内膜增生；提高强度又可能牺牲顺应性，改变血流剪切。",
      evidence: '电纺小口径血管与内皮化策略仍在优化；抗凝涂层与生物力学是关键变量。<a href="#ref-9">[9]</a>',
      note: "血管的难点在“接口”，而不仅是管壁。",
      stack: [
        { material: "PCL / 丝素 / 胶原电纺层", role: "提供纤维取向、爆破强度与可缝合性" },
        { material: "肝素 / 抗凝肽表面", role: "降低早期血栓与蛋白吸附" },
        { material: "内皮细胞单层", role: "重建抗凝、抗炎的血流界面" },
      ],
    },
    heart: {
      index: "03",
      name: "心肌",
      en: "MYOCARDIUM",
      icon: "#i-heart",
      accent: "#ff9b82",
      readiness: "临床前研究",
      function: "同步电活动、节律收缩，并在负荷下持续泵血。",
      conflict: "电耦合 vs 免疫与长期稳定",
      conflictDetail: "导电材料能改善补片内的电信号传导，但碳纳米管、导电聚合物与降解产物可能带来长期免疫与毒性问题。",
      evidence: '碳纳米管—明胶水凝胶补片可在体外支持心肌细胞同步搏动；仍以动物与体外模型为主。<a href="#ref-8">[8]</a>',
      note: "心跳需要同步，而不只是“活着”。",
      stack: [
        { material: "导电水凝胶 / 纳米复合", role: "降低补片内电阻，改善电信号传播" },
        { material: "心肌细胞 / 心肌类器官", role: "提供收缩单元与旁分泌信号" },
        { material: "微血管网络 / 灌流通道", role: "解决厚组织中段的氧供" },
      ],
    },
    cornea: {
      index: "04",
      name: "角膜",
      en: "CORNEA",
      icon: "#i-cornea",
      accent: "#a9ecff",
      readiness: "早期临床研究",
      function: "透明、折射、屏障，并维持规则的基质层排列。",
      conflict: "透明 vs 力学与缝合",
      conflictDetail: "胶原水凝胶可以做到高透明，但缝合强度、降解速度与宿主细胞长入之间需要精细平衡。",
      evidence: '重组人胶原植入物完成 I 期临床与 24 个月随访；部分患者视力改善。<a href="#ref-7">[7]</a>',
      note: "透明是一种结构性能，不是材料名单。",
      stack: [
        { material: "重组人胶原水凝胶", role: "模拟角膜基质，提供透明与低免疫原性" },
        { material: "角膜上皮 / 基质细胞", role: "重建上皮屏障与基质重塑" },
        { material: "缝合 / 整合界面", role: "在早期固定植入物，允许后期细胞整合" },
      ],
    },
    bone: {
      index: "05",
      name: "骨",
      en: "BONE",
      icon: "#i-bone",
      accent: "#c2e4ff",
      readiness: "临床研究 / 产品化",
      function: "承重、矿化、重塑，并在应力下维持各向异性结构。",
      conflict: "初期承载 vs 降解与骨长入",
      conflictDetail: "支架需要在早期承担载荷，又要在后期被新骨替代。降解过快会失去支撑，过慢则阻碍骨长入。",
      evidence: 'PCL / HA 复合支架与 3D 打印个体化植入物已用于骨缺损修复研究；长期力学与降解匹配仍是核心问题。<a href="#ref-4">[4]</a>',
      note: "骨不需要被“填满”，它需要被“训练”。",
      stack: [
        { material: "PCL / HA 复合支架", role: "提供可打印结构与矿化信号" },
        { material: "BMP-2 / 成骨肽", role: "招募与促进成骨分化" },
        { material: "骨髓间充质干细胞", role: "参与骨形成与免疫调节" },
      ],
    },
    liver: {
      index: "06",
      name: "肝",
      en: "LIVER",
      icon: "#i-liver",
      accent: "#ffc28f",
      readiness: "临床前 / 体外支持",
      function: "代谢、解毒、合成蛋白，并维持门静脉与动脉的双重血供。",
      conflict: "氧供与代谢负荷 vs 规模化",
      conflictDetail: "肝细胞代谢旺盛，厚组织需要持续灌流；而脱细胞基质、细胞来源与生物反应器的规模化都受限。",
      evidence: '脱细胞肝基质再细胞化可在大鼠中短期支持肝功能；临床级肝支持系统仍处于研究阶段。<a href="#ref-14">[14]</a>',
      note: "肝的难点不是“像”，而是“持续工作”。",
      stack: [
        { material: "脱细胞肝 ECM / 水凝胶", role: "保留天然基质结构与生化线索" },
        { material: "肝细胞 / 肝类器官", role: "承担代谢、解毒与合成功能" },
        { material: "灌流生物反应器", role: "提供氧合、营养与代谢物清除" },
      ],
    },
  };

  const organButtons = $$("[data-organ]");
  const organPanel = $("#organPanel");
  const organFigure = $("#organFigure");
  const organIconUse = $("#organIconUse");
  const organStageLabel = $("#organStageLabel");
  const organReadiness = $("#organReadiness");
  const organCode = $("#organCode");
  const organName = $("#organName");
  const organFunction = $("#organFunction");
  const organConflict = $("#organConflict");
  const organConflictDetail = $("#organConflictDetail");
  const organEvidence = $("#organEvidence");
  const organNote = $("#organNote");
  const materialStack = $("#materialStack");
  let organSwitchToken = 0;

  const selectOrganButton = (key) => {
    organButtons.forEach((button) => {
      const selected = button.dataset.organ === key;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  };

  const renderOrgan = (key, animate = true) => {
    const data = ORGANS[key];
    if (!data) return;
    const token = ++organSwitchToken;
    selectOrganButton(key);

    if (organPanel) organPanel.style.setProperty("--organ-accent", data.accent);
    if (organStageLabel) organStageLabel.textContent = `SPECIMEN / ${data.index}`;
    if (organReadiness) organReadiness.textContent = data.readiness;
    if (organCode) organCode.textContent = `ORGAN / ${data.index} · ${data.en}`;
    if (organName) organName.textContent = data.name;
    if (organFunction) organFunction.textContent = data.function;
    if (organConflict) organConflict.textContent = data.conflict;
    if (organConflictDetail) organConflictDetail.textContent = data.conflictDetail;
    if (organEvidence) organEvidence.innerHTML = data.evidence;
    if (organNote) organNote.textContent = data.note;

    if (materialStack) {
      materialStack.innerHTML = data.stack
        .map((item, index) => `
          <div class="stack-item">
            <span class="stack-item-no">0${index + 1}</span>
            <div>
              <h5>${item.material}</h5>
              <p>${item.role}</p>
            </div>
          </div>
        `)
        .join("");
    }

    if (organFigure && organIconUse) {
      if (animate && !reduceMotion) {
        organFigure.classList.add("is-switching");
        window.setTimeout(() => {
          if (token !== organSwitchToken) return;
          organIconUse.setAttribute("href", data.icon);
          organFigure.classList.remove("is-switching");
        }, 150);
      } else {
        organIconUse.setAttribute("href", data.icon);
        organFigure.classList.remove("is-switching");
      }
    }
  };

  organButtons.forEach((button, index) => {
    button.addEventListener("click", () => renderOrgan(button.dataset.organ));
    button.addEventListener("keydown", (event) => {
      const keys = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % organButtons.length;
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + organButtons.length) % organButtons.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = organButtons.length - 1;
      const next = organButtons[nextIndex];
      next.focus();
      renderOrgan(next.dataset.organ);
    });
  });

  // Set initial selected state without animation.
  selectOrganButton("skin");
  if (organButtons.length) organButtons.forEach((button) => { button.tabIndex = button.dataset.organ === "skin" ? 0 : -1; });
  renderOrgan("skin", false);

  /* ---------------------------------------------------------
     Presentation deck
     --------------------------------------------------------- */
  const deck = $("#deck");
  const deckStage = $("#deckStage");
  const deckSlides = $$(".deck-slide", deck || document);
  const deckCounter = $("#deckCounter");
  const deckDotsWrap = $("#deckDots");
  const deckPrev = $("#deckPrev");
  const deckNext = $("#deckNext");
  const deckClose = $("#deckClose");
  const deckFullscreen = $("#deckFullscreen");
  const deckOpeners = [$("#deckOpen"), ...$$("[data-open-deck]")].filter(Boolean);
  const pageChrome = [$("#siteHeader"), $("#main"), $(".site-footer")].filter(Boolean);
  let deckIndex = 0;
  let deckLastFocus = null;
  let deckCloseTimer = null;

  const deckDots = deckSlides.map((slide, index) => {
    const dot = document.createElement("span");
    dot.className = "deck-dot";
    dot.dataset.index = String(index);
    deckDotsWrap?.appendChild(dot);
    return dot;
  });

  const updateDeck = () => {
    deckSlides.forEach((slide, index) => {
      const active = index === deckIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    deckDots.forEach((dot, index) => dot.classList.toggle("is-active", index === deckIndex));
    if (deckCounter) deckCounter.textContent = `${String(deckIndex + 1).padStart(2, "0")} / ${String(deckSlides.length).padStart(2, "0")}`;
    if (deckPrev) deckPrev.disabled = deckIndex === 0;
    if (deckNext) deckNext.disabled = deckIndex === deckSlides.length - 1;
    const activeSlide = deckSlides[deckIndex];
    if (activeSlide) activeSlide.scrollTop = 0;
  };

  const goToDeck = (index) => {
    deckIndex = Math.max(0, Math.min(deckSlides.length - 1, index));
    updateDeck();
  };

  const openDeck = () => {
    if (!deck) return;
    window.clearTimeout(deckCloseTimer);
    deckLastFocus = document.activeElement;
    deck.hidden = false;
    document.body.classList.add("deck-open");
    pageChrome.forEach((element) => element.setAttribute("inert", ""));
    goToDeck(0);
    window.requestAnimationFrame(() => {
      deck.classList.add("is-open");
      deckClose?.focus();
    });
  };

  const closeDeck = () => {
    if (!deck || deck.hidden) return;
    deck.classList.remove("is-open");
    document.body.classList.remove("deck-open");
    pageChrome.forEach((element) => element.removeAttribute("inert"));
    deckCloseTimer = window.setTimeout(() => {
      deck.hidden = true;
      if (deckLastFocus instanceof HTMLElement) deckLastFocus.focus();
    }, reduceMotion ? 0 : 360);
  };

  deckOpeners.forEach((button) => button.addEventListener("click", openDeck));
  deckClose?.addEventListener("click", closeDeck);
  deckPrev?.addEventListener("click", () => goToDeck(deckIndex - 1));
  deckNext?.addEventListener("click", () => goToDeck(deckIndex + 1));
  deckDots.forEach((dot) => {
    dot.addEventListener("click", () => goToDeck(Number(dot.dataset.index)));
  });

  deckFullscreen?.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (error) {
      // Fullscreen can be blocked by browser policy; presentation still works.
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (!deckFullscreen) return;
    deckFullscreen.setAttribute("aria-label", document.fullscreenElement ? "退出全屏演示" : "全屏演示");
  });

  document.addEventListener("keydown", (event) => {
    if (!deck || deck.hidden) return;
    if (event.key === "Escape") {
      if (document.fullscreenElement) return; // Let the browser exit fullscreen first.
      event.preventDefault();
      closeDeck();
      return;
    }
    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      goToDeck(deckIndex + 1);
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      goToDeck(deckIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goToDeck(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goToDeck(deckSlides.length - 1);
    } else if (event.key === "Tab") {
      const focusable = $$("button, a[href]", deck).filter((element) => !element.disabled && element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // Swipe on touch devices.
  let touchStartX = null;
  deckStage?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    touchStartX = event.clientX;
  }, { passive: true });
  deckStage?.addEventListener("pointerup", (event) => {
    if (touchStartX === null) return;
    const delta = event.clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) < 50) return;
    goToDeck(deckIndex + (delta < 0 ? 1 : -1));
  }, { passive: true });

  updateDeck();

  /* ---------------------------------------------------------
     Keyboard niceties
     --------------------------------------------------------- */
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
      setNav(false);
    }
  });

  // Keep the active material tab accessible when landing from a card.
  if (activeMaterial) selectTab(activeMaterial);

  // Optional deep link for QA / presentation prep: ?scroll=materials
  const scrollTarget = new URLSearchParams(window.location.search).get("scroll");
  if (scrollTarget) {
    window.setTimeout(() => {
      document.getElementById(scrollTarget)?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 120);
  }

  // If the script ran to completion, scroll-reveal can take over. If anything
  // above failed, the .no-js class remains and all content stays visible.
  revealItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) item.classList.add("is-visible");
  });
  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove("no-js");
  });
})();
