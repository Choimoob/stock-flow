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

  const insightGrid = createElement("div", "two-column");
  const reasonsPanel = createElement("div", "sub-panel");
  reasonsPanel.append(createElement("p", "card-eyebrow", "해석 근거"));
  const reasonList = createElement("ul", "bullet-list");
  recommendation.reasons.forEach((reason) => {
    reasonList.appendChild(createElement("li", "", reason));
  });
  reasonsPanel.appendChild(reasonList);

  const scenarioPanel = createElement("div", "sub-panel");
  scenarioPanel.append(createElement("p", "card-eyebrow", "케이스 기반 시나리오"));
  const scenarioGrid = createElement("div", "scenario-grid");
  recommendation.scenarios.forEach((scenario) => {
    scenarioGrid.appendChild(createScenarioCard(scenario));
  });
  scenarioPanel.appendChild(scenarioGrid);
  insightGrid.append(reasonsPanel, scenarioPanel);

  const sourcesGrid = createElement("div", "sources-grid");
  recommendation.sources.forEach((source) => {
    sourcesGrid.appendChild(createSourceCard(source));
  });

  section.append(top, barGrid, insightGrid, sourcesGrid);
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
    createElement("p", "section-text", `${message} 잠시 후 새로고침해 주세요.`)
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

  const marketSection = createElement("section", "panel");
  const marketHeading = createElement("div", "section-heading");
  marketHeading.append(
    createElement("p", "section-eyebrow", "시장 스냅샷"),
    createElement("h2", "", "지금 왜 같이 흔들리는지 먼저 보기"),
    createElement("p", "section-text", data.marketSummary)
  );
  const metricGrid = createElement("div", "metrics-grid");
  data.marketMetrics.forEach((metric) => {
    metricGrid.appendChild(createMetricCard(metric));
  });
  marketSection.append(marketHeading, metricGrid);

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
    createElement("p", "section-eyebrow", "시장 근거 URL"),
    createElement("h2", "", "뉴스와 공식 페이지 링크"),
    createElement("p", "section-text", "브라우저에서 외부를 재수집하지 않고, 검토된 링크만 정적으로 노출합니다.")
  );
  const evidenceGrid = createElement("div", "sources-grid");
  data.marketEvidence.forEach((source) => {
    evidenceGrid.appendChild(createSourceCard(source));
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

  const footer = createElement("p", "footer-note", data.disclaimer);

  root.replaceChildren(
    marketSection,
    portfolioSection,
    recommendationWrap,
    evidenceSection,
    checkSection,
    footer
  );
}

function bootstrap() {
  const data = window.STOCK_FLOW_DATA;

  if (!data || typeof data !== "object") {
    renderError("전역 스냅샷 객체가 비어 있습니다.");
    return;
  }

  if (!Array.isArray(data.marketMetrics) || !Array.isArray(data.recommendations)) {
    renderError("스냅샷 형식이 예상과 다릅니다.");
    return;
  }

  renderDashboard(data);
}

bootstrap();
