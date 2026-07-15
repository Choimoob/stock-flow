function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (typeof text === "string") {
    element.textContent = text;
  }
  return element;
}

function createSectionHeading(eyebrow, title, copy) {
  const heading = createElement("div", "section-heading");
  heading.append(
    createElement("p", "section-eyebrow", eyebrow),
    createElement("h2", "", title),
    createElement("p", "section-text", copy)
  );
  return heading;
}

function createBarRow(label, value, toneClass) {
  const safeValue = typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(value, 100)) : 0;
  const wrapper = createElement("div", "");
  const head = createElement("div", "bar-head");
  head.append(createElement("span", "", label), createElement("span", "bar-value", `${safeValue}%`));

  const track = createElement("div", "bar-track");
  const fill = createElement("div", `bar-fill ${toneClass}`);
  fill.style.width = `${safeValue}%`;
  track.appendChild(fill);

  wrapper.append(head, track);
  return wrapper;
}

function scaleOutlookValue(value, min, max, rangeBottom, rangeTop) {
  if (max === min) {
    return (rangeTop + rangeBottom) / 2;
  }
  const ratio = (value - min) / (max - min);
  return rangeBottom - ratio * (rangeBottom - rangeTop);
}

function buildOutlookPath(values, xs, min, max, rangeBottom, rangeTop) {
  return values
    .map((value, index) => {
      const x = xs[index];
      const y = scaleOutlookValue(value, min, max, rangeBottom, rangeTop).toFixed(1);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y}`;
    })
    .join(" ");
}

function createOutlookChart(outlook) {
  const width = 560;
  const height = 200;
  const chartTop = 16;
  const chartBottom = height - 26;
  const padX = 6;

  const horizons = outlook.horizons;
  const count = horizons.length;
  const xs = horizons.map((_, index) => padX + (index * (width - padX * 2)) / (count - 1));

  const allValues = [...outlook.scenarios.bull, ...outlook.scenarios.base, ...outlook.scenarios.bear];
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const cushion = Math.max(4, (rawMax - rawMin) * 0.12);
  const min = Math.floor(rawMin - cushion);
  const max = Math.ceil(rawMax + cushion);

  const bullPath = buildOutlookPath(outlook.scenarios.bull, xs, min, max, chartBottom, chartTop);
  const basePath = buildOutlookPath(outlook.scenarios.base, xs, min, max, chartBottom, chartTop);
  const bearPath = buildOutlookPath(outlook.scenarios.bear, xs, min, max, chartBottom, chartTop);
  const baseArea = `${basePath} L ${xs[count - 1].toFixed(1)} ${chartBottom} L ${xs[0].toFixed(1)} ${chartBottom} Z`;

  const gridLines = [0, 1, 2, 3]
    .map((step) => {
      const y = (chartTop + (step * (chartBottom - chartTop)) / 3).toFixed(1);
      return `<line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" class="outlook-grid" />`;
    })
    .join("");

  const axisLabels = horizons
    .map((label, index) => {
      const anchor = index === 0 ? "start" : index === count - 1 ? "end" : "middle";
      return `<text x="${xs[index].toFixed(1)}" y="${height - 6}" text-anchor="${anchor}" class="outlook-axis-label">${label}</text>`;
    })
    .join("");

  function endpoint(values, key) {
    const x = xs[count - 1];
    const y = scaleOutlookValue(values[count - 1], min, max, chartBottom, chartTop);
    return (
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" class="outlook-dot-${key}" />` +
      `<text x="${(x - 7).toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="end" class="outlook-endpoint-label outlook-label-${key}">${values[count - 1]}</text>`
    );
  }

  const svgMarkup = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="시나리오별 전망 지수 추이" class="outlook-svg" preserveAspectRatio="xMidYMid meet">
    ${gridLines}
    <path d="${baseArea}" class="outlook-area"></path>
    <path d="${bearPath}" class="outlook-line outlook-line-bear"></path>
    <path d="${bullPath}" class="outlook-line outlook-line-bull"></path>
    <path d="${basePath}" class="outlook-line outlook-line-base"></path>
    ${endpoint(outlook.scenarios.bear, "bear")}
    ${endpoint(outlook.scenarios.bull, "bull")}
    ${endpoint(outlook.scenarios.base, "base")}
    ${axisLabels}
  </svg>`;

  const wrapper = createElement("div", "outlook-chart-wrap");
  wrapper.innerHTML = svgMarkup;
  return wrapper;
}

function createOutlookLegendItem(label, key) {
  const item = createElement("span", "outlook-legend-item");
  item.append(createElement("span", `outlook-legend-swatch outlook-swatch-${key}`), createElement("span", "", label));
  return item;
}

function createScenarioNarrativeCard(key, label, copy) {
  const card = createElement("article", `narrative-card narrative-${key}`);
  card.append(createElement("p", `narrative-label narrative-label-${key}`, label), createElement("p", "narrative-copy", copy));
  return card;
}

function createOutlookPanel(outlook) {
  const panel = createElement("div", "sub-panel outlook-panel");
  const head = createElement("div", "source-head");
  head.append(createElement("p", "card-eyebrow", "재무 기반 시나리오 전망"), createElement("span", "mini-label", `기준일 ${outlook.asOf}`));
  panel.append(head, createElement("p", "source-note", outlook.basis));

  const legend = createElement("div", "outlook-legend");
  legend.append(
    createOutlookLegendItem(`Bull · ${outlook.unit}`, "bull"),
    createOutlookLegendItem("Base", "base"),
    createOutlookLegendItem("Bear", "bear")
  );
  panel.append(legend, createOutlookChart(outlook));

  const fundamentalsList = createElement("ul", "bullet-list compact-list");
  outlook.fundamentals.forEach((item) => {
    fundamentalsList.appendChild(createElement("li", "", item));
  });
  panel.appendChild(fundamentalsList);

  if (outlook.scenarioNarratives) {
    panel.appendChild(createElement("p", "card-eyebrow compact-list", "시나리오별로 이렇게 봅니다"));
    const narrativeGrid = createElement("div", "narrative-grid");
    narrativeGrid.append(
      createScenarioNarrativeCard("bull", "Bull이 되려면", outlook.scenarioNarratives.bull),
      createScenarioNarrativeCard("base", "Base(기본) 경로", outlook.scenarioNarratives.base),
      createScenarioNarrativeCard("bear", "Bear로 갈 조건", outlook.scenarioNarratives.bear)
    );
    panel.appendChild(narrativeGrid);
  }

  const sourceGrid = createElement("div", "sources-grid compact-grid");
  outlook.sources.forEach((source) => {
    sourceGrid.appendChild(createSourceCard(source));
  });
  panel.appendChild(sourceGrid);

  return panel;
}

function createMetricCard(metric) {
  const card = createElement("article", "metric-card");
  const title = createElement("p", "card-eyebrow", metric.label || "-");
  const head = createElement("div", "metric-head");
  const value = createElement("p", "metric-value", metric.value || "-");

  let moveClass = "move-flat";
  if (typeof metric.move === "string" && metric.move.includes("-")) {
    moveClass = "move-down";
  } else if (typeof metric.move === "string" && metric.move.includes("+")) {
    moveClass = "move-up";
  }

  const move = createElement("span", `move-pill ${moveClass}`, metric.move || "-");
  const note = createElement("p", "muted-text", metric.note || "-");
  head.append(value, move);
  card.append(title, head, note);
  return card;
}

function createSourceCard(source) {
  const link = createElement("a", "source-card");
  link.href = source.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.append(
    createElement("p", "card-eyebrow", `${source.publisher} · ${source.publishedOn}`),
    createElement("h4", "source-title", source.title),
    createElement("p", "source-note", source.note)
  );
  return link;
}

function createScenarioCard(item) {
  const card = createElement("article", "scenario-card");
  const head = createElement("div", "source-head");
  head.append(createElement("h4", "scenario-title", item.title), createElement("span", "scenario-probability", `${item.probability}%`));
  card.append(head, createElement("p", "scenario-copy", item.copy));
  return card;
}

function createStatusCard(item) {
  const card = createElement("article", "status-card");
  card.append(createElement("h4", "status-title", item.title), createElement("p", "source-note", item.copy));
  return card;
}

function createSignalPill(signal) {
  const normalized = typeof signal === "string" ? signal : "혼합";
  let className = "signal-mixed";

  if (normalized.includes("강세") || normalized.includes("추매")) {
    className = "signal-positive";
  } else if (normalized.includes("관망") || normalized.includes("경계") || normalized.includes("하락")) {
    className = "signal-negative";
  }

  return createElement("span", `signal-pill ${className}`, normalized);
}

function createFrameworkCard(item) {
  const card = createElement("article", "framework-card");
  const head = createElement("div", "source-head");
  head.append(createElement("h4", "status-title", item.title), createElement("span", "weight-pill", `${item.weightPercent}%`));
  card.append(head, createElement("p", "source-note", item.summary));
  return card;
}

function createEvidenceBucket(bucket) {
  const card = createElement("article", "bucket-card");
  card.append(createElement("p", "card-eyebrow", bucket.title), createElement("h4", "source-title", bucket.summary));

  const sourceGrid = createElement("div", "sources-grid compact-grid");
  bucket.sources.forEach((source) => {
    sourceGrid.appendChild(createSourceCard(source));
  });

  card.appendChild(sourceGrid);
  return card;
}

function createKeyPointCard(point) {
  const card = createElement("article", "key-point-card");
  const head = createElement("div", "source-head");
  head.append(createElement("h4", "status-title", point.category), createSignalPill(point.signal));
  card.append(head, createElement("p", "mini-label", `중요도 ${point.importance}`), createElement("p", "source-note", point.summary));
  return card;
}

function createExpertViewCard(view) {
  const card = createElement("article", "expert-card");
  const head = createElement("div", "source-head");
  head.append(createElement("h4", "status-title", view.source), createElement("span", "weight-pill", view.stance));
  card.append(head, createElement("p", "mini-label", `중요도 ${view.importance}`), createElement("p", "source-note", view.summary));
  return card;
}

function createConsensusPanel(consensus) {
  const panel = createElement("div", "sub-panel");
  const head = createElement("div", "source-head");
  head.append(createElement("p", "card-eyebrow", "애널리스트 해석"), createSignalPill(consensus.signal));
  panel.append(head, createElement("p", "section-text", consensus.summary));

  const list = createElement("ul", "bullet-list compact-list");
  consensus.highlights.forEach((item) => {
    list.appendChild(createElement("li", "", item));
  });
  panel.appendChild(list);
  return panel;
}

function createRecommendationCard(recommendation) {
  const section = createElement("section", "recommendation-card");

  const meta = createElement("div", "recommendation-meta");
  meta.append(createElement("span", "section-eyebrow", recommendation.group), createElement("span", "focus-pill", recommendation.focusLabel));

  const titleRow = createElement("div", "title-with-pill");
  titleRow.append(createElement("h3", "", recommendation.company), createElement("span", "dominant-pill", recommendation.dominant));

  const headingWrap = createElement("div", "");
  headingWrap.append(
    meta,
    createElement("p", "section-eyebrow", recommendation.ticker),
    titleRow,
    createElement("p", "section-text", recommendation.headline)
  );

  const barGrid = createElement("div", "two-column");
  const actionPanel = createElement("div", "sub-panel");
  actionPanel.append(
    createElement("p", "card-eyebrow", "행동 추천 퍼센트"),
    createBarRow("추매", recommendation.action.accumulate, "tone-accumulate"),
    createBarRow("보유", recommendation.action.hold, "tone-hold"),
    createBarRow("비중축소", recommendation.action.trim, "tone-trim")
  );

  const directionPanel = createElement("div", "sub-panel");
  directionPanel.append(
    createElement("p", "card-eyebrow", "방향 확률"),
    createBarRow("상승", recommendation.direction.rise, "tone-rise"),
    createBarRow("하락", recommendation.direction.fall, "tone-fall"),
    createBarRow("혼합", recommendation.direction.mixed, "tone-mixed")
  );
  barGrid.append(actionPanel, directionPanel);

  const consensusGrid = createElement("div", "two-column");
  const reasonPanel = createElement("div", "sub-panel");
  reasonPanel.append(createElement("p", "card-eyebrow", "핵심 근거"));
  const reasonList = createElement("ul", "bullet-list");
  recommendation.reasons.forEach((reason) => {
    reasonList.appendChild(createElement("li", "", reason));
  });
  reasonPanel.appendChild(reasonList);
  consensusGrid.append(reasonPanel, createConsensusPanel(recommendation.analystConsensus));

  const keyPointSection = createElement("div", "sub-panel");
  keyPointSection.append(createElement("p", "card-eyebrow", "회사별 중요 포인트"));
  const keyPointGrid = createElement("div", "key-points-grid");
  recommendation.keyPoints.forEach((point) => {
    keyPointGrid.appendChild(createKeyPointCard(point));
  });
  keyPointSection.appendChild(keyPointGrid);

  const expertSection = createElement("div", "sub-panel");
  expertSection.append(createElement("p", "card-eyebrow", "전문가별 체크 포인트"));
  const expertGrid = createElement("div", "expert-grid");
  recommendation.expertViews.forEach((view) => {
    expertGrid.appendChild(createExpertViewCard(view));
  });
  expertSection.appendChild(expertGrid);

  const scenarioAndResearch = createElement("div", "two-column");
  const scenarioPanel = createElement("div", "sub-panel");
  scenarioPanel.append(createElement("p", "card-eyebrow", "케이스 기반 시나리오"));
  const scenarioGrid = createElement("div", "scenario-grid");
  recommendation.scenarios.forEach((scenario) => {
    scenarioGrid.appendChild(createScenarioCard(scenario));
  });
  scenarioPanel.appendChild(scenarioGrid);

  const researchPanel = createElement("div", "sub-panel");
  researchPanel.append(createElement("p", "card-eyebrow", "장기 문서·IR·연구"));
  const researchGrid = createElement("div", "sources-grid compact-grid");
  recommendation.researchNotes.forEach((source) => {
    researchGrid.appendChild(createSourceCard(source));
  });
  researchPanel.appendChild(researchGrid);
  scenarioAndResearch.append(scenarioPanel, researchPanel);

  const sourceWrap = createElement("div", "sub-panel");
  sourceWrap.append(createElement("p", "card-eyebrow", "최신 뉴스·공식 근거"));
  const sourcesGrid = createElement("div", "sources-grid compact-grid");
  recommendation.sources.forEach((source) => {
    sourcesGrid.appendChild(createSourceCard(source));
  });
  sourceWrap.appendChild(sourcesGrid);

  const sections = [headingWrap, barGrid];
  if (recommendation.outlook) {
    sections.push(createOutlookPanel(recommendation.outlook));
  }
  sections.push(consensusGrid, keyPointSection, expertSection, scenarioAndResearch, sourceWrap);

  section.append(...sections);
  return section;
}

function createOverviewCard(recommendation) {
  const card = createElement("article", "overview-card");
  const eyebrow = createElement("p", "card-eyebrow", `${recommendation.group} · ${recommendation.ticker}`);

  const titleRow = createElement("div", "title-with-pill");
  titleRow.append(createElement("h4", "source-title", recommendation.company), createElement("span", "dominant-pill", recommendation.dominant));

  const summary = createElement("p", "source-note", recommendation.headline);
  const actionBars = createElement("div", "bar-list");
  actionBars.append(
    createBarRow("추매", recommendation.action.accumulate, "tone-accumulate"),
    createBarRow("보유", recommendation.action.hold, "tone-hold"),
    createBarRow("비중축소", recommendation.action.trim, "tone-trim")
  );

  const detailLink = createElement("a", "detail-link", "종목 상세 보기");
  detailLink.href = `#${recommendation.ticker.toLowerCase()}`;

  card.append(eyebrow, titleRow, summary, actionBars, detailLink);
  return card;
}

function groupRecommendations(items) {
  const grouped = new Map();
  items.forEach((item) => {
    const key = typeof item.group === "string" ? item.group : "기타";
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(item);
  });
  return grouped;
}

function normalizeView(data) {
  const hash = window.location.hash.replace("#", "").trim().toUpperCase();
  if (!hash || hash === "OVERVIEW") {
    return "overview";
  }
  const exists = data.recommendations.some((item) => item.ticker === hash);
  return exists ? hash : "overview";
}

function createNavButton(viewId, primary, secondary, activeView) {
  const button = createElement("a", `lnb-button${activeView === viewId ? " is-active" : ""}`);
  button.href = viewId === "overview" ? "#overview" : `#${viewId.toLowerCase()}`;
  button.append(createElement("span", "lnb-primary", primary), createElement("span", "lnb-secondary", secondary));
  return button;
}

function createSidebar(data, activeView) {
  const aside = createElement("aside", "lnb");
  const sticky = createElement("div", "sticky-panel");

  const brand = createElement("div", "lnb-brand");
  brand.append(
    createElement("p", "lnb-brand-name", data.projectTitle || "주식 flow"),
    createElement("p", "lnb-brand-sub", "상품별로 나눠서 보는 정적 대시보드")
  );
  sticky.appendChild(brand);

  const overviewGroup = createElement("div", "lnb-group");
  overviewGroup.append(createElement("p", "lnb-title", "전체"));
  const overviewList = createElement("div", "lnb-list");
  overviewList.appendChild(createNavButton("overview", "전체 시장", "거시환경 · 종목 비교", activeView));
  overviewGroup.appendChild(overviewList);
  sticky.appendChild(overviewGroup);

  const grouped = groupRecommendations(data.recommendations);
  grouped.forEach((items, groupName) => {
    const group = createElement("div", "lnb-group");
    group.appendChild(createElement("p", "lnb-title", groupName));
    const list = createElement("div", "lnb-list");
    items.forEach((item) => {
      list.appendChild(createNavButton(item.ticker, item.ticker, `${item.company} · ${item.dominant}`, activeView));
    });
    group.appendChild(list);
    sticky.appendChild(group);
  });

  const footer = createElement("div", "lnb-footer");
  footer.append(
    createElement("p", "card-eyebrow", `${data.dataMode || "static snapshot"} · ${data.generatedAtKst || "-"}`),
    createElement("p", "source-note", "브라우저에서 외부 API를 직접 호출하지 않고 저장소 스냅샷만 읽습니다.")
  );
  sticky.appendChild(footer);

  aside.appendChild(sticky);
  return aside;
}

function buildFrameworkSection(data) {
  const section = createElement("section", "panel");
  section.append(
    createSectionHeading("분석 프레임", "퍼센트가 어떻게 나왔는지 먼저 보여주기", data.methodologyNote)
  );

  const frameworkGrid = createElement("div", "framework-grid");
  data.analysisFramework.forEach((item) => {
    frameworkGrid.appendChild(createFrameworkCard(item));
  });

  section.appendChild(frameworkGrid);
  return section;
}

function buildMarketSection(data) {
  const section = createElement("section", "panel");
  section.append(
    createSectionHeading("시장 스냅샷", "현재 뉴스와 시장 레짐", data.marketSummary)
  );

  const metricGrid = createElement("div", "metrics-grid");
  data.marketMetrics.forEach((metric) => {
    metricGrid.appendChild(createMetricCard(metric));
  });
  section.appendChild(metricGrid);
  return section;
}

function buildSynthesisSection(data) {
  const section = createElement("section", "panel");
  section.append(
    createSectionHeading("종합 의견", data.globalSynthesis.headline, data.globalSynthesis.summary)
  );

  const synthesisGrid = createElement("div", "two-column");
  const actionPanel = createElement("div", "sub-panel");
  actionPanel.append(
    createElement("p", "card-eyebrow", "관심 종목군 행동 퍼센트"),
    createBarRow("추매", data.globalSynthesis.action.accumulate, "tone-accumulate"),
    createBarRow("보유", data.globalSynthesis.action.hold, "tone-hold"),
    createBarRow("비중축소", data.globalSynthesis.action.trim, "tone-trim")
  );

  const directionPanel = createElement("div", "sub-panel");
  directionPanel.append(
    createElement("p", "card-eyebrow", "관심 종목군 방향 확률"),
    createBarRow("상승", data.globalSynthesis.direction.rise, "tone-rise"),
    createBarRow("하락", data.globalSynthesis.direction.fall, "tone-fall"),
    createBarRow("혼합", data.globalSynthesis.direction.mixed, "tone-mixed")
  );
  synthesisGrid.append(actionPanel, directionPanel);

  const scenarioGrid = createElement("div", "two-column");
  const scenarioPanel = createElement("div", "sub-panel");
  scenarioPanel.append(createElement("p", "card-eyebrow", "전체 시나리오"));
  const scenarioCards = createElement("div", "scenario-grid");
  data.globalSynthesis.scenarios.forEach((scenario) => {
    scenarioCards.appendChild(createScenarioCard(scenario));
  });
  scenarioPanel.appendChild(scenarioCards);

  const notesPanel = createElement("div", "sub-panel");
  notesPanel.append(createElement("p", "card-eyebrow", "지금 꼭 같이 볼 메모"));
  const notes = createElement("ul", "bullet-list");
  data.globalSynthesis.notes.forEach((item) => {
    notes.appendChild(createElement("li", "", item));
  });
  notesPanel.appendChild(notes);
  scenarioGrid.append(scenarioPanel, notesPanel);

  section.append(synthesisGrid, scenarioGrid);
  return section;
}

function buildComparisonSection(data) {
  const section = createElement("section", "panel");
  section.append(
    createSectionHeading("종목 비교", "한 화면에서 추매 우선순위를 먼저 훑기", "상세 뉴스는 종목 화면에서 더 깊게 보되, 전체 화면에서는 어느 회사가 상대적으로 유리한지 먼저 비교합니다.")
  );

  const grid = createElement("div", "overview-grid");
  data.recommendations.forEach((item) => {
    grid.appendChild(createOverviewCard(item));
  });

  section.appendChild(grid);
  return section;
}

function buildEvidenceSection(data) {
  const section = createElement("section", "panel");
  section.append(
    createSectionHeading("근거 버킷", "현재 뉴스, 공식 문서, 장기 연구를 층으로 보기", "단일 기사 하나에 과도하게 기대지 않도록, 시장 기사와 회사 공식 문서, 장기 리서치 층을 분리했습니다.")
  );

  const grid = createElement("div", "bucket-grid");
  data.evidenceBuckets.forEach((bucket) => {
    grid.appendChild(createEvidenceBucket(bucket));
  });

  section.appendChild(grid);
  return section;
}

function buildChecklistSection(data) {
  const section = createElement("section", "panel");
  section.append(
    createSectionHeading("추가 검토 포인트", "매수·매도 전에 같이 봐야 할 체크리스트", "개별 종목 기사가 좋아 보여도, 가이던스·현금흐름·리더십 변화·거시 변수까지 함께 봐야 판단 오류를 줄일 수 있습니다.")
  );

  const grid = createElement("div", "check-grid");
  data.reviewChecklist.forEach((item) => {
    grid.appendChild(createStatusCard(item));
  });

  section.appendChild(grid);
  return section;
}

function buildRoadmapSection(data) {
  const section = createElement("section", "panel");
  section.append(
    createSectionHeading("업데이트 흐름", "지금은 정적 화면, 다음은 데이터 자동화", "현재는 GitHub Pages에 올릴 수 있는 정적 구조라서, 스냅샷을 갱신한 뒤 재배포하는 흐름을 기준으로 잡았습니다.")
  );

  const list = createElement("ul", "bullet-list");
  data.roadmap.forEach((item) => {
    list.appendChild(createElement("li", "", item));
  });
  section.appendChild(list);
  return section;
}

function buildFooter(data) {
  return createElement("p", "footer-note", data.disclaimer);
}

function buildOverviewContent(data) {
  return [
    buildFrameworkSection(data),
    buildMarketSection(data),
    buildSynthesisSection(data),
    buildComparisonSection(data),
    buildEvidenceSection(data),
    buildChecklistSection(data),
    buildRoadmapSection(data),
    buildFooter(data),
  ];
}

function buildRecommendationContext(data, recommendation) {
  const section = createElement("section", "panel");
  section.append(
    createSectionHeading("현재 맥락", `${recommendation.company}을 지금 어떤 프레임으로 볼지`, `${data.marketSummary} 이 안에서 ${recommendation.company}은 ${recommendation.focusLabel} 관점으로 따로 떼서 해석해야 합니다.`)
  );

  const contextGrid = createElement("div", "status-grid");
  contextGrid.append(
    createStatusCard({ title: "현재 판단", copy: recommendation.dominant }),
    createStatusCard({ title: "제품·포지션", copy: recommendation.focusLabel }),
    createStatusCard({ title: "시장 그룹", copy: recommendation.group })
  );

  section.appendChild(contextGrid);
  return section;
}

function buildCompanyContent(data, recommendation) {
  return [buildRecommendationContext(data, recommendation), createRecommendationCard(recommendation), buildFooter(data)];
}

function renderError(message) {
  const root = document.getElementById("app");
  if (!root) {
    return;
  }

  const card = createElement("section", "error-card");
  card.append(
    createElement("p", "section-eyebrow", "render error"),
    createElement("h2", "", "대시보드 데이터를 읽지 못했습니다."),
    createElement("p", "section-text", `${message} data/latest.js가 먼저 갱신됐는지 확인해 주세요.`)
  );
  root.replaceChildren(card);
}

function renderDashboard(data) {
  const root = document.getElementById("app");

  if (!root) {
    return;
  }

  const activeView = normalizeView(data);

  const layout = createElement("div", "dashboard-layout");
  layout.appendChild(createSidebar(data, activeView));

  const content = createElement("div", "content-stack");
  if (activeView === "overview") {
    buildOverviewContent(data).forEach((node) => content.appendChild(node));
  } else {
    const recommendation = data.recommendations.find((item) => item.ticker === activeView);
    if (!recommendation) {
      renderError("선택한 종목을 찾지 못했습니다.");
      return;
    }
    buildCompanyContent(data, recommendation).forEach((node) => content.appendChild(node));
  }

  layout.appendChild(content);
  root.replaceChildren(layout);
}

function bootstrap() {
  const data = window.STOCK_FLOW_DATA;

  if (!data || typeof data !== "object") {
    renderError("전역 스냅샷 객체가 비어 있습니다.");
    return;
  }

  if (!Array.isArray(data.marketMetrics) || !Array.isArray(data.recommendations) || !Array.isArray(data.analysisFramework)) {
    renderError("스냅샷 형식이 예상과 다릅니다.");
    return;
  }

  renderDashboard(data);
}

window.addEventListener("hashchange", bootstrap);

bootstrap();
