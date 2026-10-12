const templates = {
  在线互动: {
    invoke: "在线",
    session: false,
    contextLimit: "8 条",
    schema: "文案 + 笔记列表",
    prompt: "用户给出场合后，给出 3 套穿搭。",
    passToken: "笔记",
    tools: [{ name: "社区笔记检索", api: "POST /tools/notes/search", credential: "团队凭证 note-read", permission: "只读笔记", timeout: "300ms", version: "v2" }],
    knowledge: { name: "未挂载", version: "—", citation: "无" },
    quota: "在线 200 QPS"
  },
  批量判定: {
    invoke: "批量",
    session: false,
    contextLimit: "不保留",
    schema: "类别 + 理由",
    prompt: "对输入内容输出类别。",
    passToken: "理由",
    tools: [{ name: "政策规则", api: "POST /tools/policy/match", credential: "团队凭证 policy-read", permission: "只读现行政策", timeout: "800ms", version: "2026-10" }],
    knowledge: { name: "社区政策库", version: "2026-10", citation: "须引用规则编号" },
    quota: "批量独立配额"
  },
  多轮知识问答: {
    invoke: "在线",
    session: true,
    contextLimit: "20 条",
    schema: "答复 + 政策引用",
    prompt: "根据已挂载知识回答退换货和物流问题。",
    passToken: "政策",
    tools: [{ name: "售后政策库", api: "POST /tools/policy/query", credential: "客服凭证 cs-read", permission: "只读已发布政策", timeout: "500ms", version: "v2" }],
    knowledge: { name: "售后政策库", version: "v2", citation: "须引用条款" },
    quota: "在线 80 QPS"
  }
};

function tool(name, api, credential, permission, timeout, version) {
  return { name, api, credential, permission, timeout, version };
}

function seed() {
  return {
    view: "home",
    agentId: null,
    logId: null,
    notice: "",
    confirmRollback: false,
    grayDraft: null,
    trial: { input: "", output: "", error: "", pending: false, shadow: false },
    create: { template: "在线互动", name: "", error: "" },
    done: { create: false, retest: false, gray: false, rollback: false, gate: false, log: false },
    focusId: null,
    agents: [
      {
        id: "a",
        name: "社区穿搭灵感 Agent",
        team: "A 团队 · 社区",
        template: "在线互动",
        invoke: "在线",
        session: false,
        contextLimit: "8 条",
        status: "stable",
        grayPercent: 100,
        stableVersion: "v1.9",
        previousStable: "v1.8",
        candidateVersion: "v1.9",
        editable: false,
        summary: "在线调用，不保留会话。已全量 v1.9，上一稳定版 v1.8 仍可回滚。",
        prompt: "用户给出场合后，给出 3 套可执行穿搭，并附上可追溯的社区笔记。",
        passedPrompt: "用户给出场合后，给出 3 套可执行穿搭，并附上可追溯的社区笔记。",
        schema: "灵感文案 + 笔记列表",
        tools: [tool("社区笔记检索", "POST /tools/notes/search", "团队凭证 note-read", "只读笔记", "300ms", "v2")],
        knowledge: { name: "未挂载", version: "—", citation: "输出中的笔记链接" },
        quota: "在线 800 QPS",
        service: "POST /v1/agents/a:invoke",
        latencyBudgetMs: 200,
        candidateP95: 210,
        decision: "延迟预算 P95 ≤ 200ms。v1.9 为 210ms，已触线。采纳率上升不能抵消超预算，应回滚到 v1.8。",
        gate: { pass: true, title: "格式与安全已通过", detail: "发布前检查已通过。能否承接正式流量，还要看有没有越过延迟预算。", samples: [] },
        experiment: "用户哈希分组，曝光归因到版本，记录样本量和 48 小时观察窗口。本原型不展示显著性结论。",
        metrics: [
          { name: "采纳率", online: "31%", candidate: "36%", better: true },
          { name: "点击率", online: "4.2%", candidate: "4.8%", better: true },
          { name: "次日留存", online: "22.0%", candidate: "23.1%", better: true },
          { name: "P95", online: "180ms", candidate: "210ms", better: false }
        ],
        batch: null,
        policyNote: ""
      },
      {
        id: "b",
        name: "生态守护 Agent",
        team: "B 团队 · 社区生态",
        template: "批量判定",
        invoke: "批量",
        session: false,
        contextLimit: "不保留",
        status: "stable",
        grayPercent: 0,
        stableVersion: "v3.2",
        previousStable: null,
        candidateVersion: "v3.3",
        editable: false,
        summary: "批量调用。v3.2 承接全部正式流量。候选 v3.3 未过门禁。",
        prompt: "输出类别和理由。理由必须引用命中的现行规则。",
        passedPrompt: "输出类别和理由。理由必须引用命中的现行规则。",
        schema: "类别 + 理由",
        tools: [tool("政策规则", "POST /tools/policy/match", "团队凭证 policy-read", "只读现行政策", "800ms", "2026-10")],
        knowledge: { name: "社区政策库", version: "2026-10", citation: "规则编号" },
        quota: "批量独立配额，不占用在线容量",
        service: "POST /v1/agents/b:invoke  请求带 batch_id",
        latencyBudgetMs: null,
        candidateP95: null,
        decision: "红线召回 91% 低于门槛 99%，总体准确率 96.1% 也低于 98%。不能把 v3.3 保存成任何正式流量。",
        gate: {
          pass: false,
          title: "评测未通过",
          detail: "政策回归集 320 条。总体准确率 96.1%（门槛 98%），红线类别召回 91%（门槛 99%），误判率 2.4%，漏判率 8.9%，隐晦导流切片召回 86%。正常样本会抬高总体准确率，召回未达标就不能灰度。",
          samples: [{ input: "笔记用谐音引导去评论区取链接。", output: "类别：正常。", reason: "隐晦导流漏判。红线召回被这一类切片拉低。" }]
        },
        experiment: "",
        metrics: [
          { name: "总体准确率", online: "98.6%", candidate: "96.1%", better: false },
          { name: "红线召回", online: "99.2%", candidate: "91%", better: false },
          { name: "漏判率", online: "0.8%", candidate: "8.9%", better: false }
        ],
        batch: { id: "batch_20261012_03", total: 320, failed: 14 },
        policyNote: "模型与提示词可以回到 v3.2。若对应政策已废止，不能把旧政策一起恢复，该切片降级人工。"
      },
      {
        id: "c",
        name: "电商售后答疑 Agent",
        team: "C 团队 · 客服",
        template: "多轮知识问答",
        invoke: "在线",
        session: true,
        contextLimit: "20 条",
        status: "stable",
        grayPercent: 0,
        stableVersion: "v2",
        previousStable: null,
        candidateVersion: "知识 v3",
        editable: false,
        summary: "在线调用，并保留会话。知识 v3 尚未通过关键政策门禁。",
        prompt: "基于已发布知识回答，引用政策条款。知识未覆盖或成色有争议时转人工。",
        passedPrompt: "基于已发布知识回答，引用政策条款。知识未覆盖或成色有争议时转人工。",
        schema: "答复 + 政策引用",
        tools: [tool("售后政策库", "POST /tools/policy/query", "客服凭证 cs-read", "只读已发布政策", "500ms", "v2"), tool("物流查询", "POST /tools/logistics/query", "客服凭证 cs-read", "只读物流状态", "500ms", "v4")],
        knowledge: { name: "售后政策库", version: "候选 v3 / 线上 v2", citation: "条款编号" },
        quota: "在线 120 QPS，大促可临时提额",
        service: "POST /v1/agents/c:invoke  请求带 session_id",
        latencyBudgetMs: null,
        candidateP95: null,
        decision: "总体命中 93%，门槛 95%。关键政策错误 2 条，门槛 0。知识 v3 不能灰度。",
        gate: {
          pass: false,
          title: "评测未通过",
          detail: "标准问 80 条。总体政策命中 93%（门槛 95%）。退换货、价格、时效三类关键政策错误 2 条（门槛 0）。一次解决率 71%、转人工率 18% 是线上 v2 的观察值，不能代替这次门禁。",
          samples: [{ input: "鞋子穿了两次还能退吗？", output: "可以七天无理由退货。", reason: "关键政策错误：已拆封试穿的鞋靴不适用无理由退货。" }]
        },
        experiment: "",
        metrics: [
          { name: "一次解决率", online: "71%", candidate: "观察值", better: null },
          { name: "转人工率", online: "18%", candidate: "观察值", better: null }
        ],
        batch: null,
        policyNote: "新政策生效后，只能回退模型或提示词，不能恢复已失效政策。答不上来就转人工。"
      }
    ],
    logs: [
      { id: "req_8f21", agentId: "b", version: "v3.2", mode: "批量", latency: "640ms", time: "10-12 09:14:22", input: "笔记正文：这件外套真的闭眼入，链接我放在评论里了。", tool: "政策规则 · 商业导流", output: "类别：商业导流。理由：正文引导读者到评论区获取交易链接，且未见商业报备。" },
      { id: "req_1c07", agentId: "a", version: "v1.9", mode: "在线", latency: "206ms", time: "10-12 09:16:03", input: "场景：周五晚上约会，微凉，想看起来轻松一点。", tool: "社区笔记检索", output: "灵感：浅色衬衫配深色直筒裤，外套选短款夹克。附同款笔记 2 篇。版本 v1.9。" },
      { id: "req_77aa", agentId: "c", version: "v2", mode: "在线 + 会话", latency: "890ms", time: "10-12 09:18:40", input: "用户：鞋子穿了两次不想要了，能退吗？", tool: "售后政策库 v2", output: "答复：已拆封试穿、影响二次销售的鞋靴，不支持无理由退货。引用：鞋靴类退换货政策第 3 条。成色有争议时转人工。" }
    ]
  };
}

let state = seed();
let noticeTimer = 0;

const steps = [
  { id: "create", label: "从模板新建", view: "create" },
  { id: "retest", label: "失败后重测通过", view: "home" },
  { id: "gray", label: "把新 Agent 灰度", view: "home" },
  { id: "rollback", label: "全量后回滚 A", view: "detail", agentId: "a" },
  { id: "gate", label: "B 不能进流量", view: "detail", agentId: "b" },
  { id: "log", label: "打开一条日志", view: "logs" }
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function agentById(id) {
  return state.agents.find((item) => item.id === id);
}

function specFingerprint(agent) {
  return [agent.prompt, agent.invoke, agent.session ? "session" : "stateless", agent.contextLimit, agent.schema].join("\n");
}

function gateOpen(agent) {
  if (!agent.gate.pass) return false;
  if (!agent.passedFingerprint) return true;
  return agent.passedFingerprint === specFingerprint(agent);
}

function markSpecDirty(agent) {
  if (!agent || !agent.editable || !agent.passedFingerprint) return;
  if (specFingerprint(agent) === agent.passedFingerprint) return;
  agent.gate = {
    pass: false,
    title: "规格已改，需重新评测",
    detail: "评测绑定整份规格。调用方式、会话或提示词变化后，上次结果作废。本原型模拟评测结果，不代表模型质量判断。",
    samples: agent.gate.samples || []
  };
  agent.passedFingerprint = "";
  agent.evalState = "stale";
}

function bumpVersion(version) {
  const matched = /^v(\d+)\.(\d+)$/.exec(version);
  if (!matched) return version + ".1";
  return "v" + matched[1] + "." + (Number(matched[2]) + 1);
}

function overBudget(agent) {
  return agent.latencyBudgetMs && agent.candidateP95 > agent.latencyBudgetMs;
}

function statusLabel(agent) {
  if (agent.status === "offline") return "已下线";
  if (agent.liveVersion && agent.candidateVersion !== agent.liveVersion) return "新版本 " + agent.candidateVersion;
  if (agent.status === "gray") return "灰度 " + agent.grayPercent + "%";
  if (agent.status === "rolled") return "已回滚至 " + agent.stableVersion;
  if (agent.status === "draft") return "草稿";
  if (agent.status === "stable" && agent.candidateVersion !== agent.stableVersion) return "线上 " + agent.stableVersion;
  if (agent.status === "stable") return "全量 " + agent.stableVersion;
  return agent.status;
}

function pillClass(agent) {
  if (agent.status === "offline") return "info";
  if (overBudget(agent) && agent.stableVersion === agent.candidateVersion) return "bad";
  if (agent.status === "gray") return "gray";
  if (agent.status === "draft") return "draft";
  return "stable";
}

function flash(message) {
  state.notice = message;
  render();
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    state.notice = "";
    render();
  }, 3200);
}

function openAgent(id) {
  const agent = agentById(id);
  state.view = "detail";
  state.agentId = id;
  state.confirmRollback = false;
  state.grayDraft = agent.grayPercent;
  state.trial = {
    input: agent.invoke === "批量" ? "评论：私我领取优惠" : agent.session ? "快递显示签收了但我没收到" : "通勤，下雨",
    output: "",
    error: "",
    pending: false,
    shadow: false
  };
  if (id === "b") state.done.gate = true;
}

function scriptedOutput(agent, input, shadow) {
  const prefix = shadow ? "【影子验证，未接入正式流量】" : "【离线试跑】";
  if (agent.invoke === "批量") {
    return prefix + "类别：商业导流嫌疑。理由：输入「" + input + "」含私下交易表达。当前正式版本：" + agent.stableVersion + "。";
  }
  if (agent.session) {
    return prefix + "答复：签收未收到时先按物流异常受理。引用：物流异常处理第 2 条。会话将保留这条引用。当前知识版本：" + agent.stableVersion + "。";
  }
  return prefix + "灵感：防水面料外套，深色长裤，短靴。输入：" + input + "。";
}

function trafficBlockReason(agent) {
  if (!gateOpen(agent)) return "未过门禁。可以离线试跑或影子验证，不能接入正式流量。";
  if (overBudget(agent)) return "P95 " + agent.candidateP95 + "ms 超过预算 " + agent.latencyBudgetMs + "ms，不能承接正式流量。应回滚到 " + agent.previousStable + "。";
  return "";
}

function freezeSpec(agent) {
  agent.editable = false;
  agent.published = true;
  agent.passedFingerprint = specFingerprint(agent);
}

function saveGray(agent) {
  const next = state.grayDraft == null ? agent.grayPercent : state.grayDraft;
  if (next === 0) {
    if (agent.previousStable) {
      flash("切回上一稳定版请点「回滚」，不要把回滚记成流量 0。");
      return;
    }
    if (agent.published) {
      flash("首次发布没有上一稳定版，不能记成回滚。停止服务请点「下线」。");
      return;
    }
    flash("当前没有正式流量。未过门禁时，把比例调到 10% 再保存，会看到被拒绝。");
    return;
  }
  const reason = trafficBlockReason(agent);
  if (reason) {
    flash(reason);
    return;
  }
  const previousLive = agent.liveVersion && agent.liveVersion !== agent.candidateVersion ? agent.liveVersion : "";
  if (previousLive) agent.previousStable = previousLive;
  agent.liveVersion = agent.candidateVersion;
  agent.livePercent = next;
  agent.grayPercent = next;
  state.grayDraft = next;
  freezeSpec(agent);
  if (String(agent.id).indexOf("d") === 0) state.done.gray = true;
  if (next === 100) {
    if (agent.stableVersion && agent.stableVersion !== "—" && agent.stableVersion !== agent.candidateVersion) {
      agent.previousStable = agent.stableVersion;
    }
    agent.stableVersion = agent.candidateVersion;
    agent.status = "stable";
    agent.decision = agent.previousStable
      ? "已全量到 " + agent.candidateVersion + "。回滚目标仍是 " + agent.previousStable + "。"
      : "已全量到 " + agent.candidateVersion + "。这是第一个正式版本，没有上一稳定版。停止服务请下线，不要当成回滚。";
    flash(agent.decision);
    return;
  }
  agent.status = "gray";
  if (!agent.previousStable) {
    agent.decision = agent.candidateVersion + " 承接 " + next + "%。其余 " + (100 - next) + "% 不进入本 Agent，继续原有业务流程；没有原流程时转人工。";
  } else {
    agent.decision = agent.candidateVersion + " 承接 " + next + "%。其余流量留在 " + agent.previousStable + "。";
  }
  flash(agent.decision);
}

function offline(agent) {
  const version = agent.liveVersion || agent.candidateVersion;
  agent.livePercent = 0;
  agent.grayPercent = 0;
  state.grayDraft = 0;
  agent.status = "offline";
  agent.editable = false;
  agent.published = true;
  agent.decision = "已停止新请求。未进入本 Agent 的流量继续原有业务流程；没有原流程时转人工。版本 " + version + " 保留。这不是回滚。";
  flash("已下线 " + version + "。新请求不再进入该 Agent。");
}

function forkVersion(agent) {
  agent.candidateVersion = bumpVersion(agent.candidateVersion);
  agent.editable = true;
  agent.grayPercent = 0;
  state.grayDraft = 0;
  agent.status = "draft";
  agent.gate = {
    pass: false,
    title: "新版本尚未评测",
    detail: "已发布规格已冻结。新版本要重新评测后才能承接正式流量。评测绑定整份规格。",
    samples: []
  };
  agent.passedFingerprint = "";
  agent.evalState = "none";
  agent.decision = "正在编辑 " + agent.candidateVersion + "。已发布的 " + (agent.liveVersion || "上一版") + " 不能直接改。";
  flash("已创建 " + agent.candidateVersion + "。改完规格后需要重新评测。");
}

function rollback(agent) {
  if (!agent.previousStable) {
    flash("没有上一稳定版，不能回滚。第一次发布只能下线。");
    return;
  }
  const from = agent.stableVersion;
  agent.candidateVersion = from;
  agent.stableVersion = agent.previousStable;
  agent.previousStable = null;
  agent.grayPercent = 0;
  state.grayDraft = 0;
  agent.status = "rolled";
  agent.decision = from + " 已停止承接正式流量。线上回到 " + agent.stableVersion + "。";
  state.confirmRollback = false;
  if (agent.id === "a") state.done.rollback = true;
  flash("已回滚到 " + agent.stableVersion + "。" + from + " 仍保留，可备查。");
}

function simulatedResult(agent) {
  const prompt = agent.prompt || "";
  const negative = /不要|不用|别引用|勿引用|禁止引用/.test(prompt);
  const cites = /引用/.test(prompt);
  if (agent.template === "批量判定") {
    if (negative || prompt.indexOf("理由") < 0) {
      return { pass: false, passed: 286, total: 320, samples: [{ input: "评论：私我领取优惠。", output: "类别：商业导流。", reason: "失败样例只有类别，没有可核对的理由。" }] };
    }
    return { pass: true, passed: 320, total: 320, samples: [] };
  }
  if (agent.template === "多轮知识问答") {
    if (negative || prompt.indexOf("政策") < 0) {
      return { pass: false, passed: 74, total: 80, samples: [{ input: "鞋子穿了两次还能退吗？", output: "可以七天无理由退货。", reason: "失败样例答错关键退换货政策，且没有引用条款。" }] };
    }
    return { pass: true, passed: 80, total: 80, samples: [] };
  }
  if (negative) {
    return { pass: false, passed: 5, total: 8, samples: [{ input: "周五约会，微凉。", output: "三套穿搭，未附社区内容。", reason: "规格要求不引用社区内容，输出无法追溯。" }] };
  }
  if (cites) return { pass: true, passed: 8, total: 8, samples: [] };
  return { pass: false, passed: 5, total: 8, samples: [{ input: "通勤，下雨。", output: "防水面料外套，深色长裤。", reason: "失败样例只有文案，没有可追溯的社区内容。补充引用要求后可以重测。" }] };
}

function runEval(agent) {
  agent.evalState = "running";
  render();
  setTimeout(() => {
    const result = simulatedResult(agent);
    const failed = result.total - result.passed;
    const note = "评测集共 " + result.total + " 条，通过 " + result.passed + " 条，失败 " + failed + " 条。本原型模拟评测结果，不代表模型质量判断。";
    if (!result.pass) {
      agent.gate = { pass: false, title: "评测未通过", detail: note, samples: result.samples };
      agent.passedFingerprint = "";
      agent.evalState = "fail";
    } else {
      agent.gate = { pass: true, title: "评测通过", detail: note + " 可以保存正式流量。改调用方式、会话或提示词后要重测。", samples: [] };
      agent.passedFingerprint = specFingerprint(agent);
      agent.evalState = "pass";
      if (String(agent.id).indexOf("d") === 0) state.done.retest = true;
    }
    render();
  }, 450);
}

function createDraft() {
  const field = document.querySelector("#create-name");
  if (field) state.create.name = field.value;
  const name = state.create.name.trim();
  if (!name) {
    state.create.error = "先写一个名称。";
    render();
    return;
  }
  const preset = templates[state.create.template];
  const id = "d" + Date.now();
  state.agents.unshift({
    id,
    name,
    team: "新草稿",
    template: state.create.template,
    invoke: preset.invoke,
    session: preset.session,
    contextLimit: preset.contextLimit,
    status: "draft",
    grayPercent: 0,
    stableVersion: "—",
    previousStable: null,
    candidateVersion: "v0.1",
    editable: true,
    allowFork: true,
    published: false,
    liveVersion: "",
    livePercent: 0,
    summary: "由「" + state.create.template + "」模板生成。调用方式是" + preset.invoke + (preset.session ? "，并保留会话。" : "，不保留会话。") + "尚未承接正式流量。",
    prompt: preset.prompt,
    passedPrompt: "",
    schema: preset.schema,
    tools: preset.tools.map((item) => Object.assign({}, item)),
    knowledge: Object.assign({}, preset.knowledge),
    quota: preset.quota,
    service: "POST /v1/agents/" + id + ":invoke",
    latencyBudgetMs: null,
    candidateP95: null,
    decision: "先离线试跑或发起评测。未通过不能保存正式流量。",
    gate: { pass: false, title: "尚未评测", detail: "发起评测后才能知道能不能灰度。未评测和未通过一样，不能接入正式流量。", samples: [] },
    experiment: "",
    metrics: [],
    batch: preset.invoke === "批量" ? { id: "batch_draft", total: 0, failed: 0 } : null,
    policyNote: preset.invoke === "批量" || preset.session ? "若知识或政策已失效，回滚不能恢复旧内容，覆盖不到就降级人工。" : "",
    evalState: "none"
  });
  state.done.create = true;
  state.focusId = id;
  state.create.name = "";
  state.create.error = "";
  openAgent(id);
  flash("草稿已生成。先评测，通过后再保存流量。");
}

function onClick(event) {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const agent = state.agentId ? agentById(state.agentId) : null;

  if (action === "nav") {
    state.view = el.dataset.view;
    state.agentId = null;
    state.logId = null;
    state.confirmRollback = false;
    render();
    return;
  }
  if (action === "open") {
    openAgent(el.dataset.id);
    render();
    return;
  }
  if (action === "step") {
    const step = steps.find((item) => item.id === el.dataset.step);
    state.logId = null;
    state.confirmRollback = false;
    if (step.agentId) openAgent(step.agentId);
    else if (step.id === "retest" || step.id === "gray") {
      if (state.focusId && agentById(state.focusId)) openAgent(state.focusId);
      else state.view = "create";
    } else state.view = step.view;
    render();
    return;
  }
  if (action === "reset") {
    state = seed();
    render();
    return;
  }
  if (action === "save-gray" && agent) return saveGray(agent);
  if (action === "ask-rollback") {
    state.confirmRollback = true;
    render();
    return;
  }
  if (action === "cancel-rollback") {
    state.confirmRollback = false;
    render();
    return;
  }
  if (action === "rollback" && agent) return rollback(agent);
  if (action === "offline" && agent) return offline(agent);
  if (action === "fork" && agent) return forkVersion(agent);
  if (action === "trial" && agent) return runTrial(agent, false);
  if (action === "shadow" && agent) return runTrial(agent, true);
  if (action === "eval" && agent) return runEval(agent);
  if (action === "retry-batch" && agent) {
    flash("已把 " + agent.batch.failed + " 条失败提交重试。调度仍走既有离线任务，平台记下批次 " + agent.batch.id + "。");
    return;
  }
  if (action === "search-knowledge" && agent) {
    const hit = agent.template === "多轮知识问答" ? "命中《鞋靴类退换货》第 3 条，引用会随答案返回。" : agent.invoke === "批量" ? "命中现行规则「商业导流」。废止规则不会被检索返回。" : "命中社区笔记 2 篇。检索测试不接入正式流量。";
    state.trial.output = "【检索测试，未接入正式流量】" + hit;
    state.trial.shadow = true;
    render();
    return;
  }
  if (action === "open-log") {
    state.view = "log";
    state.logId = el.dataset.id;
    state.done.log = true;
    render();
    return;
  }
  if (action === "pick-template") {
    state.create.template = el.dataset.template;
    render();
    return;
  }
  if (action === "create") createDraft();
}

function runTrial(agent, shadow) {
  const inputEl = document.querySelector("#trial-input");
  const input = inputEl ? inputEl.value.trim() : state.trial.input.trim();
  state.trial.input = input;
  if (!input) {
    state.trial.error = "先写一条输入。";
    state.trial.output = "";
    render();
    return;
  }
  state.trial.error = "";
  state.trial.pending = true;
  state.trial.shadow = shadow;
  state.trial.output = "";
  render();
  setTimeout(() => {
    state.trial.pending = false;
    state.trial.output = scriptedOutput(agent, input, shadow);
    render();
  }, 350);
}

function onInput(event) {
  const el = event.target;
  if (el.dataset.action === "gray-input") {
    state.grayDraft = Number(el.value);
    const label = document.querySelector("[data-gray-label]");
    if (label) label.textContent = state.grayDraft + "%";
    return;
  }
  if (el.id === "create-name") state.create.name = el.value;
  if (el.id === "trial-input") state.trial.input = el.value;
  if (el.id === "prompt-input") {
    const agent = agentById(state.agentId);
    if (agent && agent.editable) {
      agent.prompt = el.value;
      markSpecDirty(agent);
    }
  }
}

function onChange(event) {
  const el = event.target;
  const agent = state.agentId ? agentById(state.agentId) : null;
  if (!agent || !agent.editable) return;
  if (el.id === "invoke-input") agent.invoke = el.value;
  if (el.id === "session-input") {
    agent.session = el.value === "yes";
    agent.contextLimit = agent.session ? "20 条" : "不保留";
  }
  if (el.id === "prompt-input" || el.id === "invoke-input" || el.id === "session-input") {
    markSpecDirty(agent);
    render();
  }
}

function metricTable(agent) {
  if (!agent.metrics.length) return "<p>草稿还没有线上对照。</p>";
  const rows = agent.metrics.map((item) => {
    const klass = item.better == null ? "" : item.better ? "better" : "worse";
    return "<tr><td>" + esc(item.name) + "</td><td>" + esc(item.online) + "</td><td class=\"" + klass + "\">" + esc(item.candidate) + "</td></tr>";
  }).join("");
  const right = agent.previousStable ? "当前 " + agent.candidateVersion : "候选 " + agent.candidateVersion;
  const left = agent.previousStable ? "上一稳定版 " + agent.previousStable : "线上 " + agent.stableVersion;
  return "<table><thead><tr><th>指标</th><th>" + esc(left) + "</th><th>" + esc(right) + "</th></tr></thead><tbody>" + rows + "</tbody></table>";
}

function homeView() {
  const cards = state.agents.map((agent) => {
    const warn = !gateOpen(agent) ? " · 未过门禁" : overBudget(agent) ? " · 延迟超预算" : "";
    return "<button class=\"card\" data-action=\"open\" data-id=\"" + agent.id + "\">" +
      "<div class=\"row\"><span class=\"pill " + pillClass(agent) + "\">" + esc(statusLabel(agent)) + "</span><span class=\"pill\">" + esc(agent.invoke) + (agent.session ? " · 保留会话" : "") + "</span></div>" +
      "<h3>" + esc(agent.name) + "</h3><p>" + esc(agent.team) + esc(warn) + "</p>" +
      "<div class=\"meta\"><span class=\"pill\">线上 " + esc(agent.stableVersion) + "</span><span class=\"pill\">" + (agent.previousStable ? "可回滚至 " + esc(agent.previousStable) : "候选 " + esc(agent.candidateVersion)) + "</span></div>" +
      "<p style=\"margin-top:12px\">" + esc(agent.decision) + "</p></button>";
  }).join("");
  return "<div class=\"grid\">" + cards + "</div>";
}

function specBlock(agent) {
  const toolText = agent.tools.map((item) => item.name + " · " + item.api + " · 凭证 " + item.credential + " · " + item.permission + " · 超时 " + item.timeout + " · " + item.version).join("；");
  if (!agent.editable) {
    return "<section class=\"panel\"><h3>规格</h3><div class=\"kv\">" +
      "<span>调用</span><b>" + esc(agent.invoke) + (agent.session ? "，保留会话，上下文 " + esc(agent.contextLimit) : "，不保留会话") + "</b>" +
      "<span>提示词</span><b>" + esc(agent.prompt) + "</b>" +
      "<span>输出</span><b>" + esc(agent.schema) + "</b>" +
      "<span>工具</span><b>" + esc(toolText) + "</b>" +
      "<span>知识</span><b>" + esc(agent.knowledge.name) + " · " + esc(agent.knowledge.version) + " · 引用 " + esc(agent.knowledge.citation) + "</b>" +
      "<span>接入</span><b>" + esc(agent.service) + "</b>" +
      "<span>配额</span><b>" + esc(agent.quota) + "</b></div>" +
      "<div class=\"row\" style=\"margin-top:10px\"><button class=\"btn\" data-action=\"search-knowledge\">检索测试</button>" +
      (agent.allowFork && agent.published ? "<button class=\"btn\" data-action=\"fork\">创建新版本</button>" : "") +
      "</div>" + (agent.allowFork && agent.published ? "<p style=\"margin-top:8px\">已发布规格已冻结。要改提示词、调用方式或会话，先创建新版本。</p>" : "") + "</section>";
  }
  return "<section class=\"panel\"><h3>规格 " + esc(agent.candidateVersion) + "</h3>" +
    "<div class=\"field\"><label for=\"prompt-input\">提示词</label><textarea id=\"prompt-input\">" + esc(agent.prompt) + "</textarea><p>发布后整份规格冻结。调用方式、会话和提示词的改动都会让已有评测作废。</p></div>" +
    "<div class=\"field\"><label for=\"invoke-input\">调用方式</label><select id=\"invoke-input\"><option " + (agent.invoke === "在线" ? "selected" : "") + ">在线</option><option " + (agent.invoke === "批量" ? "selected" : "") + ">批量</option></select></div>" +
    "<div class=\"field\"><label for=\"session-input\">会话</label><select id=\"session-input\"><option value=\"no\" " + (!agent.session ? "selected" : "") + ">不保留</option><option value=\"yes\" " + (agent.session ? "selected" : "") + ">保留，上下文 " + esc(agent.contextLimit) + "</option></select></div>" +
    "<div class=\"kv\"><span>工具</span><b>" + esc(toolText) + "</b><span>知识</span><b>" + esc(agent.knowledge.name) + " · " + esc(agent.knowledge.version) + "</b><span>接入</span><b>" + esc(agent.service) + (agent.session ? "，带 session_id" : "") + (agent.invoke === "批量" ? "，带 batch_id" : "") + "</b></div>" +
    "<div class=\"row\" style=\"margin-top:10px\"><button class=\"btn\" data-action=\"search-knowledge\">检索测试</button></div></section>";
}

function detailView() {
  const agent = agentById(state.agentId);
  const gray = state.grayDraft == null ? agent.grayPercent : state.grayDraft;
  const blocked = trafficBlockReason(agent);
  const gateClass = gateOpen(agent) && !overBudget(agent) ? "ok" : "bad";
  const canRollback = Boolean(agent.previousStable);
  const showOffline = agent.published && !agent.previousStable && agent.status !== "offline" && (agent.livePercent > 0 || agent.status === "stable" || agent.status === "gray");
  const rollbackBlock = !canRollback ? "" : state.confirmRollback ? "" : "<button class=\"btn\" data-action=\"ask-rollback\">回滚到 " + esc(agent.previousStable) + "</button>";
  const offlineBlock = showOffline ? "<button class=\"btn\" data-action=\"offline\">下线</button>" : "";
  const rollbackConfirm = canRollback && state.confirmRollback
    ? "<div class=\"callout bad\"><p>正式流量切回 " + esc(agent.previousStable) + "。" + esc(agent.stableVersion) + " 保留备查，不删除。</p><div class=\"row\" style=\"margin-top:8px\"><button class=\"btn danger\" data-action=\"rollback\">确认回滚</button><button class=\"btn\" data-action=\"cancel-rollback\">取消</button></div></div>"
    : "";
  const samples = (agent.gate.samples || []).map((item) => "<li><b>输入</b> " + esc(item.input) + "<br><b>输出</b> " + esc(item.output) + "<br><b>原因</b> " + esc(item.reason) + "</li>").join("");
  const output = state.trial.pending ? "执行中…" : (state.trial.output || "离线试跑和影子验证都不会写入正式流量。");
  const batch = agent.batch ? "<section class=\"panel\"><h3>批次</h3><p>批次 " + esc(agent.batch.id) + "，共 " + agent.batch.total + " 条，失败 " + agent.batch.failed + " 条。调度沿用既有离线任务，平台保留失败状态和重试入口。</p><div class=\"row\" style=\"margin-top:10px\"><button class=\"btn\" data-action=\"retry-batch\">重试失败条</button></div></section>" : "";
  const policy = agent.policyNote ? "<div class=\"callout\">" + esc(agent.policyNote) + "</div>" : "";
  const experiment = agent.experiment ? "<p style=\"margin-top:8px\">" + esc(agent.experiment) + "</p>" : "";
  return "<div class=\"layout\"><div class=\"stack\">" +
    "<section class=\"panel\"><div class=\"callout" + (overBudget(agent) || !gateOpen(agent) ? " bad" : "") + "\">" + esc(agent.decision) + "</div>" + metricTable(agent) + experiment + "</section>" +
    "<section class=\"panel\"><h3>发布</h3><p>" + (blocked ? esc(blocked) : "门禁已通过，可以保存正式流量。") + "</p><p>没有旧版本时，未分给本 Agent 的流量继续原有业务流程；没有原流程时转人工。有上一稳定版时才回滚。首次停止服务用下线。</p><div class=\"slider-row\"><label>候选版本的正式流量</label><strong data-gray-label>" + gray + "%</strong></div>" +
    "<input type=\"range\" min=\"0\" max=\"100\" step=\"10\" value=\"" + gray + "\" data-action=\"gray-input\" />" +
    "<div class=\"row\" style=\"margin-top:10px\"><button class=\"btn primary\" data-action=\"save-gray\">保存流量</button>" + offlineBlock + rollbackBlock + "</div>" + rollbackConfirm + "</section>" +
    "<section class=\"panel\"><h3>试跑</h3><label for=\"trial-input\">一条输入</label><textarea id=\"trial-input\">" + esc(state.trial.input) + "</textarea>" +
    (state.trial.error ? "<p class=\"error\">" + esc(state.trial.error) + "</p>" : "") +
    "<div class=\"row\" style=\"margin:10px 0\"><button class=\"btn primary\" data-action=\"trial\">离线试跑</button><button class=\"btn\" data-action=\"shadow\">影子验证</button></div><div class=\"output\">" + esc(output) + "</div></section>" +
    batch + "</div><div class=\"stack\">" +
    "<section class=\"panel\"><h3>评测门禁</h3>" + policy + "<div class=\"callout " + gateClass + "\"><b>" + esc(agent.gate.title) + "</b><p>" + esc(agent.gate.detail) + "</p></div>" +
    (samples ? "<ul class=\"samples\">" + samples + "</ul>" : "") +
    (agent.editable ? "<div class=\"row\" style=\"margin-top:10px\"><button class=\"btn primary\" data-action=\"eval\">" + (agent.evalState === "running" ? "评测中…" : agent.evalState === "fail" || agent.evalState === "stale" ? "重新评测" : "发起评测") + "</button></div>" : "") +
    "</section>" + specBlock(agent) + "</div></div>";
}

function logsView() {
  const items = state.logs.map((item) => {
    const owner = agentById(item.agentId);
    return "<button class=\"log\" data-action=\"open-log\" data-id=\"" + item.id + "\"><b>" + esc(item.id) + "</b><span>" + esc(owner ? owner.name : item.agentId) + " · " + esc(item.input) + "</span><span>" + esc(item.version) + "</span></button>";
  }).join("");
  return "<section class=\"panel\"><h3>最近调用</h3>" + items + "</section>";
}

function logView() {
  const item = state.logs.find((log) => log.id === state.logId);
  return "<section class=\"panel\"><h3>" + esc(item.id) + "</h3><div class=\"kv\">" +
    "<span>版本</span><b>" + esc(item.version) + "</b><span>调用</span><b>" + esc(item.mode) + "</b>" +
    "<span>时间</span><b>" + esc(item.time) + "</b><span>耗时</span><b>" + esc(item.latency) + "</b>" +
    "<span>输入</span><b>" + esc(item.input) + "</b><span>工具</span><b>" + esc(item.tool) + "</b>" +
    "<span>输出</span><b>" + esc(item.output) + "</b></div></section>";
}

function createView() {
  const cards = Object.keys(templates).map((name) => {
    const preset = templates[name];
    const on = state.create.template === name ? " on" : "";
    const sessionText = preset.session ? "保留会话" : "不保留会话";
    return "<button class=\"template" + on + "\" data-action=\"pick-template\" data-template=\"" + esc(name) + "\"><b>" + esc(name) + "</b><p>" + esc(preset.invoke) + " · " + sessionText + "</p></button>";
  }).join("");
  return "<section class=\"panel\"><h3>选择模板</h3><div class=\"templates\">" + cards + "</div>" +
    "<label for=\"create-name\">Agent 名称</label><input id=\"create-name\" type=\"text\" value=\"" + esc(state.create.name) + "\" placeholder=\"例如：周末出行灵感\" />" +
    (state.create.error ? "<p class=\"error\">" + esc(state.create.error) + "</p>" : "") +
    "<div class=\"row\" style=\"margin-top:12px\"><button class=\"btn primary\" data-action=\"create\">生成草稿</button></div>" +
    "<p style=\"margin-top:10px\">模板只预填调用方式、会话开关和输出结构。第一次评测会给出模拟的失败样例。按失败原因补充规格后再重测，通过后才能放流量。</p></section>";
}

function content() {
  if (state.view === "detail") return detailView();
  if (state.view === "logs") return logsView();
  if (state.view === "log") return logView();
  if (state.view === "create") return createView();
  return homeView();
}

function heading() {
  if (state.view === "detail") {
    const agent = agentById(state.agentId);
    return { crumb: "工作台 / " + agent.name, title: agent.name, sub: agent.summary };
  }
  if (state.view === "logs") return { crumb: "观测", title: "调用日志", sub: "按一次请求回溯版本、输入、工具和输出。" };
  if (state.view === "log") return { crumb: "调用日志 / 详情", title: "单次调用", sub: "这条记录用于复核、质检和坏案例回放。" };
  if (state.view === "create") return { crumb: "创建", title: "从模板新建", sub: "三种模板预填配置。调用方式只有在线和批量，多轮是会话开关。" };
  return { crumb: "一期评审原型", title: "工作台", sub: "先新建并发布一个 Agent。A、B、C 用来看不同的门禁和回滚。" };
}

function render() {
  const head = heading();
  const guide = steps.map((step) => {
    const on = state.done[step.id] ? " on" : "";
    const mark = state.done[step.id] ? "✓" : "";
    return "<button data-action=\"step\" data-step=\"" + step.id + "\"><i class=\"tick" + on + "\">" + mark + "</i><span>" + step.label + "</span></button>";
  }).join("");
  const navView = state.view === "log" ? "logs" : state.view === "detail" ? "home" : state.view;
  document.getElementById("app").innerHTML =
    "<div class=\"shell\"><aside class=\"nav\"><div class=\"brand\"><i class=\"mark\"></i><div><b>Agent 基建平台</b><span>构建、评测、发布</span></div></div>" +
    "<button class=\"nav-item" + (navView === "home" ? " active" : "") + "\" data-action=\"nav\" data-view=\"home\">工作台</button>" +
    "<button class=\"nav-item" + (navView === "logs" ? " active" : "") + "\" data-action=\"nav\" data-view=\"logs\">调用日志</button>" +
    "<button class=\"nav-item" + (navView === "create" ? " active" : "") + "\" data-action=\"nav\" data-view=\"create\">从模板新建</button>" +
    "<div class=\"guide\"><h2>评审路径</h2>" + guide + "</div></aside>" +
    "<main class=\"main\"><div class=\"top\"><div><p class=\"crumb\">" + esc(head.crumb) + "</p><h1>" + esc(head.title) + "</h1><p class=\"sub\">" + esc(head.sub) + "</p></div>" +
    "<button class=\"btn\" data-action=\"reset\">恢复演示数据</button></div>" + content() + "</main></div>" +
    (state.notice ? "<div class=\"toast\">" + esc(state.notice) + "</div>" : "");
}

document.body.addEventListener("click", onClick);
document.body.addEventListener("input", onInput);
document.body.addEventListener("change", onChange);
render();
