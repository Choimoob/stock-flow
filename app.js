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

function formatNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }
  return new Intl.NumberFormat("ko-KR").format(value);
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

function createPositionRow(position) {
  const toneClass =
    position.ticker === "STX" ? "tone-stx" : position.ticker === "SNDK" ? "tone-sndk" : "tone-other";

  const wrapper = createElement("div", "");
  const head = createElement("div", "position-head");
  head.append(
    createElement("span", "", `${position.ticker} · ${position.company}`),
    createElement("span", "position-weight", `${position.weightPercent}%`)
  );

  const track = createElement("div", "bar-track");
  const fill = createElement("div", `bar-fill ${toneClass}`);
  fill.style.width = `${Math.max(0, Math.min(position.weightPercent, 100))}%`;
  track.appendChild(fill);

  const detail = createElement(
    "p",
    "muted-text",
    `손익 ${position.profitLossPercent}% · 평가금액 ${formatNumber(position.marketValueKrw)}원`
  );

  wrapper.append(head, track, detail);
  return wrapper;
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
  const value = typeof signal === "string" ? signal : "mixed";
  let className = "signal-mixed";
  if (value === "positive") {
    className = "signal-positive";
  } else if (value === "negative") {
    className = "signal-negative";
  }
  return createElement("span", `signal-pill ${className}`, value === "positive" ? "긍정" : value === "negative" ? "부정" : "혼합");
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
  card.append(
    createElement("p", "card-eyebrow", bucket.title),
    createElement("h4", "source-title", bucket.summary)
  );

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
  card.append(head);
  card.append(createElement("p", "mini-label", `중요도 ${point.importance}`));
  card.append(createElement("p", "source-note", point.summary));
  return card;
}

function createExpertViewCard(view) {
  const card = createElement("article", "expert-card");
  const head = createElement("div", "source-head");
  head.append(createElement("h4", "status-title", view.source), createElement("span", "weight-pill", view.stance));
  card.append(head);
  card.append(createElement("p", "mini-label", `중요도 ${view.importance}`));
  card.append(createElement("p", "source-note", view.summary));
  return card;
}

function createConsensusPanel(consensus) {
  const panel = createElement("div", "sub-panel");
  panel.append(createElement("p", "card-eyebrow", "애널리스트 합의"));

  const stats = createElement("div", "status-grid compact-grid");
  [
    { title: "커버리지 수", copy: `${consensus.coverageCount}개사` },
    { title: "긍정", copy: `${consensus.bullish}` },
    { title: "중립", copy: `${consensus.neutral}` },
    { title: "부정", copy: `${consensus.bearish}` },
  ].forEach((item) => {
    stats.appendChild(createStatusCard(item));
  });

  panel.append(stats, createElement("p", "section-text", consensus.summary));
  return panel;
}

function createRecommendationCard(recommendation) {
  const section = createElement("section", "recommendation-card");

  const top = createElement("div", "recommendation-top");
  const headingWrap = createElement("div", "");
  headingWrap.append(
    createElement("p", "section-eyebrow", recommendation.ticker),
    createElement("h3", "", recommendation.company),
    createElement("p", "section-text", recommendation.headline)
  );
  top.append(headingWrap, createElement("div", "dominant-pill", recommendation.dominant));

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
    createElement("p", "card-eyebrow", "주가 방향 확률"),
    createBarRow("상승", recommendation.direction.rise, "tone-rise"),
    createBarRow("하락", recommendation.direction.fall, "tone-fall"),
    createBarRow("혼합", recommendation.direction.mixed, "tone-mixed")
  );
  barGrid.append(actionPanel, directionPanel);

  const consensusGrid = createElement("div", "two-column");
  const reasonPanel = createElement("div", "sub-panel");
  reasonPanel.append(createElement("p", "card-eyebrow", "종합 해석"));
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
  researchPanel.append(createElement("p", "card-eyebrow", "장기 리서치·장문 문서"));
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

  section.append(top, barGrid, consensusGrid, keyPointSection, expertSection, scenarioAndResearch, sourceWrap);
  return section;
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
  const modeNode = document.getElementById("data-mode");
  const generatedAtNode = document.getElementById("generated-at");

  if (!root || !modeNode || !generatedAtNode) {
    return;
  }

  modeNode.textContent = data.dataMode || "static snapshot";
  generatedAtNode.textContent = data.generatedAtKst || "-";

  const frameworkSection = createElement("section", "panel");
  const frameworkHeading = createElement("div", "section-heading");
  frameworkHeading.append(
    createElement("p", "section-eyebrow", "분석 프레임"),
    createElement("h2", "", "퍼센트가 어떻게 나왔는지 먼저 보여주기"),
    createElement("p", "section-text", data.methodologyNote)
  );
  const frameworkGrid = createElement("div", "framework-grid");
  data.analysisFramework.forEach((item) => {
    frameworkGrid.appendChild(createFrameworkCard(item));
  });
  frameworkSection.append(frameworkHeading, frameworkGrid);

  const marketSection = createElement("section", "panel");
  const marketHeading = createElement("div", "section-heading");
  marketHeading.append(
    createElement("p", "section-eyebrow", "시장 스냅샷"),
    createElement("h2", "", "현재 뉴스와 시장 레짐"),
    createElement("p", "section-text", data.marketSummary)
  );
  const metricGrid = createElement("div", "metrics-grid");
  data.marketMetrics.forEach((metric) => {
    metricGrid.appendChild(createMetricCard(metric));
  });
  marketSection.append(marketHeading, metricGrid);

  const synthesisSection = createElement("section", "panel");
  const synthesisHeading = createElement("div", "section-heading");
  synthesisHeading.append(
    createElement("p", "section-eyebrow", "종합 의견"),
    createElement("h2", "", data.globalSynthesis.headline),
    createElement("p", "section-text", data.globalSynthesis.summary)
  );

  const synthesisGrid = createElement("div", "two-column");
  const synthesisAction = createElement("div", "sub-panel");
  synthesisAction.append(
    createElement("p", "card-eyebrow", "전체 행동 퍼센트"),
    createBarRow("추매", data.globalSynthesis.action.accumulate, "tone-accumulate"),
    createBarRow("보유", data.globalSynthesis.action.hold, "tone-hold"),
    createBarRow("비중축소", data.globalSynthesis.action.trim, "tone-trim")
  );

  const synthesisDirection = createElement("div", "sub-panel");
  synthesisDirection.append(
    createElement("p", "card-eyebrow", "전체 방향 확률"),
    createBarRow("상승", data.globalSynthesis.direction.rise, "tone-rise"),
    createBarRow("하락", data.globalSynthesis.direction.fall, "tone-fall"),
    createBarRow("혼합", data.globalSynthesis.direction.mixed, "tone-mixed")
  );
  synthesisGrid.append(synthesisAction, synthesisDirection);

  const synthesisScenario = createElement("div", "two-column");
  const scenarioPanel = createElement("div", "sub-panel");
  scenarioPanel.append(createElement("p", "card-eyebrow", "전체 시나리오"));
  const scenarioGrid = createElement("div", "scenario-grid");
  data.globalSynthesis.scenarios.forEach((scenario) => {
    scenarioGrid.appendChild(createScenarioCard(scenario));
  });
  scenarioPanel.appendChild(scenarioGrid);

  const notePanel = createElement("div", "sub-panel");
  notePanel.append(createElement("p", "card-eyebrow", "지금 꼭 같이 볼 메모"));
  const noteList = createElement("ul", "bullet-list");
  data.globalSynthesis.notes.forEach((item) => {
    noteList.appendChild(createElement("li", "", item));
  });
  notePanel.appendChild(noteList);
  synthesisScenario.append(scenarioPanel, notePanel);
  synthesisSection.append(synthesisHeading, synthesisGrid, synthesisScenario);

  const portfolioSection = createElement("section", "panel");
  const portfolioHeading = createElement("div", "section-heading");
  portfolioHeading.append(
    createElement("p", "section-eyebrow", "포트폴리오 집중도"),
    createElement("h2", "", "현재 보유 예시 기준 비중 해석"),
    createElement(
      "p",
      "section-text",
      `총 손익 ${data.portfolio.totalProfitLossPercent}% (${formatNumber(Math.abs(data.portfolio.totalProfitLossKrw))}원)`
    )
  );

  const statusGrid = createElement("div", "status-grid");
  [
    { title: "총 투자금", copy: `${formatNumber(data.portfolio.totalInvestedKrw)}원` },
    { title: "평가금액", copy: `${formatNumber(data.portfolio.totalMarketValueKrw)}원` },
    { title: "핵심 메모", copy: data.portfolio.summaryNote },
  ].forEach((item) => {
    statusGrid.appendChild(createStatusCard(item));
  });

  const portfolioGrid = createElement("div", "two-column");
  const positionPanel = createElement("div", "sub-panel");
  positionPanel.append(createElement("p", "card-eyebrow", "보유 비중"));
  const positionList = createElement("div", "position-list");
  data.portfolio.positions.forEach((position) => {
    positionList.appendChild(createPositionRow(position));
  });
  positionPanel.appendChild(positionList);

  const warningPanel = createElement("div", "sub-panel");
  warningPanel.append(createElement("p", "card-eyebrow", "집중 리스크 해석"));
  const warningList = createElement("ul", "bullet-list");
  data.portfolio.warnings.forEach((warning) => {
    warningList.appendChild(createElement("li", "", warning));
  });
  warningPanel.appendChild(warningList);
  portfolioGrid.append(positionPanel, warningPanel);
  portfolioSection.append(portfolioHeading, statusGrid, portfolioGrid);

  const recommendationWrap = createElement("section", "");
  data.recommendations.forEach((recommendation) => {
    recommendationWrap.appendChild(createRecommendationCard(recommendation));
  });

  const evidenceSection = createElement("section", "panel");
  const evidenceHeading = createElement("div", "section-heading");
  evidenceHeading.append(
    createElement("p", "section-eyebrow", "근거 버킷"),
    createElement("h2", "", "현재 뉴스, 공식 문서, 리서치 자료를 층으로 보기"),
    createElement("p", "section-text", "이제는 기사 링크만 모으는 것이 아니라, 어떤 층의 근거인지 분리해서 보는 구조입니다.")
  );
  const evidenceGrid = createElement("div", "bucket-grid");
  data.evidenceBuckets.forEach((bucket) => {
    evidenceGrid.appendChild(createEvidenceBucket(bucket));
  });
  evidenceSection.append(evidenceHeading, evidenceGrid);

  const checkSection = createElement("section", "panel");
  const checkHeading = createElement("div", "section-heading");
  checkHeading.append(
    createElement("p", "section-eyebrow", "추가 검토 포인트"),
    createElement("h2", "", "매수·매도 전에 같이 봐야 할 체크리스트"),
    createElement("p", "section-text", "종목 뉴스만 보면 놓치기 쉬운 항목들을 같이 묶었습니다.")
  );
  const checkGrid = createElement("div", "check-grid");
  data.reviewChecklist.forEach((item) => {
    checkGrid.appendChild(createStatusCard(item));
  });
  checkSection.append(checkHeading, checkGrid);

  const roadmapSection = createElement("section", "panel");
  const roadmapHeading = createElement("div", "section-heading");
  roadmapHeading.append(
    createElement("p", "section-eyebrow", "업데이트 흐름"),
    createElement("h2", "", "지금은 템플릿을 강화했고, 다음엔 데이터 층을 늘리기"),
    createElement("p", "section-text", "현재 페이지는 20년 누적 데이터가 아니라, 그 데이터를 담기 위한 구조까지 넓힌 버전입니다.")
  );
  const roadmapList = createElement("ul", "bullet-list");
  data.roadmap.forEach((step) => {
    roadmapList.appendChild(createElement("li", "", step));
  });
  roadmapSection.append(roadmapHeading, roadmapList);

  const footer = createElement("p", "footer-note", data.disclaimer);

  root.replaceChildren(
    frameworkSection,
    marketSection,
    synthesisSection,
    portfolioSection,
    recommendationWrap,
    evidenceSection,
    checkSection,
    roadmapSection,
    footer
  );
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

bootstrap();
