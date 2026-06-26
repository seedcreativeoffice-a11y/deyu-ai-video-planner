import type { CSSProperties, ChangeEvent, ReactNode, WheelEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

import problemsImage from './assets/ai-generation-problems.png';
import homeWorkflowImage from './assets/home-workflow.png';
import basicsImage from './assets/basics-admin.png';
import materialImage from './assets/material-docs.png';
import materialReviewImage from './assets/material-review.png';
import audienceImage from './assets/audience-personas.png';
import strategyImage from './assets/communication-strategy.png';
import highlightsImage from './assets/highlights-campus.png';
import styleImage from './assets/style-moodboard.png';
import outputImage from './assets/output-platform.png';

export const design: DesignSystem = {
  palette: {
    bg: '#f7f9fc',
    text: '#172033',
    accent: '#2563eb',
  },
  fonts: {
    display: '"Noto Sans TC", "Inter", "SF Pro Display", system-ui, sans-serif',
    body: '"Noto Sans TC", "Inter", "SF Pro Text", system-ui, sans-serif',
  },
  typeScale: {
    hero: 76,
    body: 28,
  },
  radius: 14,
};

const palette = {
  bg: design.palette.bg,
  text: design.palette.text,
  accent: design.palette.accent,
  surface: '#ffffff',
  surfaceSoft: '#eef4ff',
  line: '#d8e0ee',
  lineStrong: '#b9c6d9',
  muted: '#637089',
  soft: '#f1f5f9',
  green: '#0f9f6e',
  greenSoft: '#e6f7f0',
  amber: '#b7791f',
  amberSoft: '#fff7df',
  red: '#b42318',
  redSoft: '#fff1f0',
  inkBlue: '#102a56',
};

const font = {
  body: design.fonts.body,
  display: design.fonts.display,
  mono: '"SF Mono", "JetBrains Mono", Consolas, ui-monospace, monospace',
};

const storageKey = 'seed-ai-video-planner-v2';

const departmentOptions = [
  '高齡照顧福祉系',
  '食品保健系',
  '幼兒保育系',
  '餐旅廚藝管理系',
  '美容流行設計系',
  '護理系',
  '觀光休閒與健康系',
  '通識中心',
  '招生組',
  '國際處',
  '圖資中心',
];

const topicOptions = [
  '科系特色介紹',
  '招生形象影片',
  '實作課程介紹',
  '學生學習成果展示',
  '職涯出路介紹',
  '校園生活與學習環境',
  '產學合作與實習成果',
  '其他',
];

const communicationGoalOptions = ['快速理解科系特色', '建立專業信任', '產生就讀興趣', '記住學習成果', '看見職涯方向', '願意進一步了解'];
const desiredActionOptions = ['前往招生頁了解更多', '報名招生說明會', '預約校園參訪', '留下聯絡資料', '分享給家人或同學', '聯繫學校洽談合作'];

const styles = `
  .aivp-focus {
    transition: transform 120ms ease, background-color 120ms ease, border-color 120ms ease, opacity 120ms ease;
  }
  .aivp-focus:active:not(:disabled) {
    transform: translateY(1px) scale(0.99);
  }
  .aivp-focus:focus-visible {
    outline: 4px solid rgba(37, 99, 235, 0.28);
    outline-offset: 3px;
  }
  .aivp-panel {
    animation: aivp-rise 220ms cubic-bezier(0, 0, 0.2, 1);
  }
  @keyframes aivp-rise {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .aivp-panel { animation: none; }
  }
`;

type StepId = 'problems' | 'home' | 'basics' | 'material' | 'review' | 'audience' | 'strategy' | 'highlights' | 'style' | 'output' | 'result' | 'recap';
type FileStatus = 'idle' | 'reading' | 'ok' | 'error';

type PlannerState = {
  school: string;
  department: string;
  topic: string;
  pastedText: string;
  fileName: string;
  fileText: string;
  fileStatus: FileStatus;
  fileMessage: string;
  positioning: string;
  evidence: string;
  sceneNotes: string;
  exclusions: string;
  audience: string;
  communicationGoal: string;
  desiredAction: string;
  coreMessage: string;
  highlights: string[];
  visualStyle: string;
  length: string;
  platform: string;
  ratio: string;
};

const initialState: PlannerState = {
  school: '德育護理健康學院',
  department: '護理系',
  topic: '科系特色介紹',
  pastedText: '',
  fileName: '',
  fileText: '',
  fileStatus: 'idle',
  fileMessage: '',
  positioning: '',
  evidence: '',
  sceneNotes: '',
  exclusions: '避免錯誤專業設備、無法證實的數據、國外校園感與過度擺拍',
  audience: '高中生與準大學生',
  communicationGoal: '建立專業信任',
  desiredAction: '前往招生頁了解更多',
  coreMessage: '',
  highlights: ['實作課程', '專業證照', '就業出路'],
  visualStyle: '專業可信',
  length: '30 秒',
  platform: '學校官網或招生頁',
  ratio: '16:9 橫式',
};

const steps: { id: StepId; label: string }[] = [
  { id: 'basics', label: '基本資料' },
  { id: 'material', label: '提供素材' },
  { id: 'review', label: '確認理解' },
  { id: 'audience', label: '溝通對象' },
  { id: 'strategy', label: '溝通策略' },
  { id: 'highlights', label: '畫面證據' },
  { id: 'style', label: '影像風格' },
  { id: 'output', label: '平台設定' },
  { id: 'result', label: '製作工作台' },
  { id: 'recap', label: '開始實作' },
];

export const App: Page = () => {
  const [step, setStep] = useState<StepId>('problems');
  const [data, setData] = useState<PlannerState>(initialState);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const restored = { ...initialState, ...JSON.parse(saved) } as PlannerState;
        if (!communicationGoalOptions.includes(restored.communicationGoal)) restored.communicationGoal = initialState.communicationGoal;
        if (!desiredActionOptions.includes(restored.desiredAction)) restored.desiredAction = initialState.desiredAction;
        setData(restored);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data]);

  const currentIndex = Math.max(0, steps.findIndex((item) => item.id === step));
  const summary = useMemo(() => buildSummary(data), [data]);
  const result = useMemo(() => buildResult(data, summary), [data, summary]);
  const stepIssue = getStepIssue(step, data);

  const setStepByOffset = (offset: number) => {
    if (offset > 0 && step === 'material') {
      const analysis = buildMaterialAnalysis(data);
      setData((prev) => ({
        ...prev,
        positioning: prev.positioning || analysis.positioning,
        evidence: prev.evidence || analysis.evidence,
        sceneNotes: prev.sceneNotes || analysis.sceneNotes,
        coreMessage: prev.coreMessage || analysis.coreMessage,
      }));
    }
    const next = steps[currentIndex + offset];
    setStep(next ? next.id : offset > 0 ? 'recap' : 'home');
  };

  const update = <K extends keyof PlannerState>(key: K, value: PlannerState[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const copyText = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1400);
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    setData((prev) => ({
      ...prev,
      fileName: file.name,
      fileStatus: 'reading',
      fileMessage: '正在讀取檔案內容。',
      fileText: '',
    }));

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    try {
      if (extension === 'txt') {
        const text = await file.text();
        setData((prev) => ({ ...prev, fileStatus: 'ok', fileText: cleanText(text), fileMessage: '已讀取文字檔內容。' }));
        return;
      }

      const buffer = await file.arrayBuffer();
      const decoded = new TextDecoder('latin1').decode(buffer);
      const text = extension === 'pdf' ? extractPdfText(decoded) : extractLooseWordText(decoded);

      if (text.length > 40) {
        setData((prev) => ({
          ...prev,
          fileStatus: 'ok',
          fileText: text,
          fileMessage: extension === 'pdf' ? '已完成 PDF 基本文字讀取。' : '已完成 Word 基本文字讀取。',
        }));
      } else {
        setData((prev) => ({
          ...prev,
          fileStatus: 'error',
          fileText: '',
          fileMessage: '這份檔案可能是掃描檔或複雜格式。請改貼上可複製的文字內容，仍可繼續完成企劃。',
        }));
      }
    } catch {
      setData((prev) => ({
        ...prev,
        fileStatus: 'error',
        fileText: '',
        fileMessage: '檔案讀取失敗。請改貼文字，或先用手填資料完成企劃。',
      }));
    }
  };

  return (
    <main style={appShell}>
      <style>{styles}</style>
      {step !== 'problems' && step !== 'home' && <TopBar currentIndex={currentIndex} step={step} copied={copied} onHome={() => setStep('problems')} />}

      {step === 'problems' && <ProblemsIntro onNext={() => setStep('home')} />}
      {step === 'home' && <Home onStart={() => setStep('basics')} result={result} copied={copied} onCopy={() => copyText('首頁範例', result.brief)} />}
      {step === 'basics' && <Basics data={data} update={update} />}
      {step === 'material' && <Material data={data} update={update} handleFile={handleFile} summary={summary} />}
      {step === 'review' && <MaterialReview data={data} update={update} />}
      {step === 'audience' && <Audience data={data} update={update} />}
      {step === 'strategy' && <StrategyStep data={data} update={update} />}
      {step === 'highlights' && <Highlights data={data} update={update} />}
      {step === 'style' && <StyleStep data={data} update={update} />}
      {step === 'output' && <OutputStep data={data} update={update} />}
      {step === 'result' && <ResultView result={result} data={data} copied={copied} copyText={copyText} />}
      {step === 'recap' && <RecapView data={data} result={result} copied={copied} copyText={copyText} />}

      {step !== 'problems' && step !== 'home' && step !== 'result' && step !== 'recap' && (
        <FooterNav onBack={() => setStepByOffset(-1)} onNext={() => setStepByOffset(1)} nextLabel={step === 'output' ? '建立製作工作台' : '下一步'} disabled={Boolean(stepIssue)} helper={stepIssue} />
      )}
      {step === 'result' && <FooterNav backLabel="返回修改" onBack={() => setStep('output')} onNext={() => setStep('recap')} nextLabel="查看實作路徑" />}
      {step === 'recap' && <FooterNav backLabel="返回工作台" onBack={() => setStep('result')} onNext={() => { setData(initialState); setStep('problems'); }} nextLabel="建立新企劃" />}
    </main>
  );
};

const Home = ({ onStart, result, copied, onCopy }: { onStart: () => void; result: ReturnType<typeof buildResult>; copied: string; onCopy: () => void }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1.02fr 0.98fr', gap: 44, height: '100%' }}>
    <section className="aivp-panel" style={{ ...card, padding: '48px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <Badge>AI 影像創作引導室</Badge>
        <h1 style={{ fontFamily: font.display, fontSize: 64, lineHeight: 1.1, margin: '24px 0 18px' }}>
          天馬行空，<br />
          用 AI 導航。
        </h1>
        <p style={{ fontSize: 26, lineHeight: 1.55, color: palette.muted, margin: 0, maxWidth: 820 }}>
          這個工作流會先建立整體想像，再把影片拆成可執行的分鏡與提示詞。完成後，你可以帶走一套觀念、一份企劃，以及一組可用於生圖與生影片的提示詞。
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 26 }}>
          <TakeawayCard title="一套觀念" body="先想清楚對象、目的與影片主軸。" />
          <TakeawayCard title="一份企劃" body="完成摘要、影片結構與分鏡腳本。" />
          <TakeawayCard title="一組提示詞" body="產出生圖與生影片可用的文字。" />
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 28 }}>
          <Button label="開始建立影片企劃" onClick={onStart} kind="primary" />
        </div>
      </div>
    </section>
    <section className="aivp-panel" style={{ ...darkPanel, display: 'grid', gridTemplateRows: '330px auto 1fr', gap: 18 }}>
      <img src={homeWorkflowImage} alt="大學影像企劃工作流示意" style={heroImage} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 19, color: '#b9d3ff' }}>成果預覽</div>
          <div style={{ fontSize: 30, fontWeight: 850, marginTop: 5 }}>德育護理健康學院護理系</div>
        </div>
        <button className="aivp-focus" onClick={onCopy} style={smallDarkButton}>{copied === '首頁範例' ? '已複製' : '複製範例'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <PreviewCard title="企劃主軸" body={result.brief.slice(0, 90)} dark />
        <PreviewCard title="第一鏡頭" body={result.shots[0].visual} dark />
        <PreviewCard title="工作流觀念" body="先定方向，再拆段落，最後才生成每一個畫面。" dark />
        <PreviewCard title="AI 提示詞" body={result.shots[0].imagePrompt.slice(0, 96)} dark />
      </div>
    </section>
  </div>
);

const ProblemsIntro = ({ onNext }: { onNext: () => void }) => (
  <div className="aivp-panel" style={{ display: 'grid', gridTemplateColumns: '0.98fr 1.02fr', gap: 44, height: '100%' }}>
    <section style={{ ...card, padding: '50px 54px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <Badge>常見問題</Badge>
        <h1 style={{ fontFamily: font.display, fontSize: 62, lineHeight: 1.08, margin: '24px 0 18px' }}>
          AI 生成，<br />
          常卡在哪裡？
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 28 }}>
          <ProblemCard title="畫面好看，但彼此不連貫" body="每張圖都像單獨海報，卻沒有開場、鋪陳與結尾。" />
          <ProblemCard title="角色與場景一直跑掉" body="人物、空間、服裝與情緒沒有一致設定，影片感會變弱。" />
          <ProblemCard title="提示詞越寫越長，效果越不穩" body="缺少清楚主軸時，只會一直補關鍵字，卻沒有控制畫面。" />
          <ProblemCard title="不知道每個鏡頭為什麼存在" body="沒有先拆工作流，AI 生成的畫面就很難服務溝通目標。" />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Button label="拆解工作流" onClick={onNext} kind="primary" />
      </div>
    </section>
    <section style={{ ...darkPanel, display: 'grid', gridTemplateRows: '1fr', gap: 20 }}>
      <img src={problemsImage} alt="AI 生圖與生影片常見問題情境" style={heroImage} />
    </section>
  </div>
);

const Basics = ({ data, update }: StepProps) => (
  <StepShell
    title="先設定學校與科系"
    hint="學校名稱已預設為德育護理健康學院，仍可依實際需求修改。"
    image={basicsImage}
    imageCaption="先建立專案的基本身份，後面每個鏡頭才會一致。"
    asideTitle="這一步會決定"
    tips={['影片中的主角單位名稱', '結果頁的企劃標題', 'AI 提示詞中的校名與科系描述']}
  >
    <Field label="學校名稱" value={data.school} onChange={(value) => update('school', value)} placeholder="例如：德育護理健康學院" />
    <label style={{ display: 'block', marginBottom: 18 }}>
      <span style={fieldLabel}>科系或單位</span>
      <select className="aivp-focus" value={data.department} onChange={(event) => update('department', event.target.value)} style={inputStyle}>
        {departmentOptions.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </label>
    <label style={{ display: 'block', marginBottom: 18 }}>
      <span style={fieldLabel}>影片主題</span>
      <select className="aivp-focus" value={data.topic} onChange={(event) => update('topic', event.target.value)} style={inputStyle}>
        {topicOptions.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </label>
  </StepShell>
);

const Material = ({ data, update, handleFile, summary }: StepProps & { handleFile: (event: ChangeEvent<HTMLInputElement>) => void; summary: string[] }) => (
  <StepShell
    title="把你手上的資料交給我們"
    hint="貼上科系簡介、招生文案或可複製的官網內容。下一步會先讓你確認我們理解得對不對。"
    image={materialImage}
    imageCaption="資料不是直接變成提示詞，而是先整理成可被拍攝與驗證的內容。"
    asideTitle="我們會先找出"
    tips={['這個科系最想被記住的定位', '可以真正拍成畫面的課程與成果', '不能說錯或不能憑空生成的內容']}
  >
    <label style={{ ...fieldLabel, marginBottom: 10 }}>貼上科系簡介或招生文案</label>
    <textarea className="aivp-focus" value={data.pastedText} onChange={(event) => update('pastedText', event.target.value)} placeholder="可以貼上官網介紹、招生文案、課程特色或簡章段落。" style={{ ...inputStyle, height: 190, resize: 'none', lineHeight: 1.5 }} />
    <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <label className="aivp-focus" style={{ position: 'relative', border: `1px dashed ${palette.lineStrong}`, background: palette.surfaceSoft, borderRadius: 14, padding: 20, fontSize: 21, cursor: 'pointer' }}>
        上傳 PDF／Word／文字檔（文字擷取測試版）
        <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        <div style={{ marginTop: 10, color: palette.muted, fontSize: 18 }}>{data.fileName || '上傳後仍會讓你確認文字內容。掃描 PDF 或複雜 Word 請改貼文字。'}</div>
      </label>
      <StatusCard status={data.fileStatus} message={data.fileMessage || '尚未上傳檔案。'} />
    </div>
    <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {summary.slice(0, 4).map((item) => <TinySummary key={item} text={item} />)}
    </div>
  </StepShell>
);

const MaterialReview = ({ data, update }: StepProps) => (
  <StepShell
    title="先確認：我們理解得對嗎？"
    hint="這些內容會直接控制後面的腳本與提示詞。請刪掉不正確的資訊，補上真正值得拍攝的證據。"
    image={materialReviewImage}
    imageCaption="先把文字整理成定位、證據與場景，AI 才不會只會重複形容詞。"
    asideTitle="確認完成後"
    tips={['腳本只能使用你確認過的特色與證據', '每個亮點都會被轉成具體場景', '禁用內容會進入所有提示詞限制']}
  >
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <TextAreaField label="一句話定位" value={data.positioning} onChange={(value) => update('positioning', value)} placeholder="例如：以臨床實作與照護溝通為核心的護理人才培育。" compact />
      <TextAreaField label="可被看見的證據" value={data.evidence} onChange={(value) => update('evidence', value)} placeholder="例如：實作課程、證照輔導、模擬病房、實習成果。" compact />
      <TextAreaField label="可拍攝的人物與場景" value={data.sceneNotes} onChange={(value) => update('sceneNotes', value)} placeholder="例如：學生操作設備、老師回饋、同儕討論與成果展示。" compact />
      <TextAreaField label="不可出錯或避免出現" value={data.exclusions} onChange={(value) => update('exclusions', value)} placeholder="例如：錯誤設備、無法證實的數據、國外校園感。" compact />
    </div>
    <ImpactNote title="這一步為什麼重要" body="你現在不是在修文案，而是在建立後續所有鏡頭都必須遵守的事實邊界。" />
  </StepShell>
);

const Audience = ({ data, update }: StepProps) => (
  <StepShell
    title="這支影片想跟哪個對象溝通？"
    hint="這裡只選人。選定對象後，後面的分鏡、語氣與提示詞會跟著調整。"
    image={audienceImage}
    imageCaption="先知道要跟誰溝通，畫面才會有正確的說服方式。"
    asideTitle="溝通對象會影響"
    tips={['畫面要偏生活感或正式感', '旁白要偏感性或理性', '結尾行動要鼓勵了解、報名或合作']}
  >
    <OptionGrid columns={3}>
      <OptionButton label="高中生與準大學生" selected={data.audience === '高中生與準大學生'} onClick={() => update('audience', '高中生與準大學生')} />
      <OptionButton label="家長" selected={data.audience === '家長'} onClick={() => update('audience', '家長')} />
      <OptionButton label="校友" selected={data.audience === '校友'} onClick={() => update('audience', '校友')} />
      <OptionButton label="企業與產學夥伴" selected={data.audience === '企業與產學夥伴'} onClick={() => update('audience', '企業與產學夥伴')} />
    </OptionGrid>
    <ImpactNote title="你的選擇會這樣改變影片" body={buildAudienceFeedback(data.audience)} />
  </StepShell>
);

const StrategyStep = ({ data, update }: StepProps) => (
  <StepShell
    title="觀眾看完，要怎麼想、怎麼做？"
    hint="先決定溝通目標與下一步行動，影片才不會只有漂亮畫面，卻沒有明確作用。"
    image={strategyImage}
    imageCaption="對象、核心訊息與行動目標，是每個鏡頭取捨的依據。"
    asideTitle="策略會控制"
    tips={['開場先建立什麼印象', '中段要提供哪些證據', '結尾要引導觀眾採取什麼行動']}
  >
    <div style={{ ...fieldLabel, marginBottom: 10 }}>希望觀眾看完產生什麼改變？</div>
    <OptionGrid columns={3}>
      {communicationGoalOptions.map((item) => (
        <OptionButton key={item} label={item} selected={data.communicationGoal === item} onClick={() => update('communicationGoal', item)} />
      ))}
    </OptionGrid>
    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 14 }}>
      <TextAreaField label="這支影片最重要的一句話" value={data.coreMessage} onChange={(value) => update('coreMessage', value)} placeholder="例如：在真實實作與專業陪伴中，找到能走向未來的能力。" compact />
      <label style={{ display: 'block' }}>
        <span style={fieldLabel}>希望觀眾接著做什麼？</span>
        <select className="aivp-focus" value={data.desiredAction} onChange={(event) => update('desiredAction', event.target.value)} style={inputStyle}>
          {desiredActionOptions.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
    </div>
    <ImpactNote title="目前的影片策略" body={`${data.audience}看完後，應該先「${data.communicationGoal}」，最後引導他們「${data.desiredAction}」。`} />
  </StepShell>
);

const Highlights = ({ data, update }: StepProps) => {
  const toggle = (value: string) => {
    const exists = data.highlights.includes(value);
    if (!exists && data.highlights.length >= 3) return;
    update('highlights', exists ? data.highlights.filter((item) => item !== value) : [...data.highlights, value]);
  };
  return (
    <StepShell
      title="選出影片要證明的 3 個重點"
      hint="請選 3 個最重要的證據。順序會決定影片中段的篇幅與鏡頭安排。"
      image={highlightsImage}
      imageCaption="亮點不是清單，而是影片裡要被看見的證據。"
      asideTitle="證據挑選原則"
      tips={['必須能被畫面直接看見', '能支持你確認的一句話定位', '能讓目前的溝通對象產生信任或興趣']}
    >
      <OptionGrid>
        {['實作課程', '專業證照', '師資設備', '產學合作', '學生作品', '就業出路'].map((item) => (
          <OptionButton key={item} label={item} selected={data.highlights.includes(item)} disabled={!data.highlights.includes(item) && data.highlights.length >= 3} onClick={() => toggle(item)} />
        ))}
      </OptionGrid>
      <ImpactNote title={`已選擇 ${data.highlights.length} 個重點`} body={data.highlights.length === 3 ? '這 3 個重點會依目前順序成為影片中段的主要段落。' : '建議保留 3 個。太多會讓影片失焦，太少則缺乏足夠證據。'} />
    </StepShell>
  );
};

const StyleStep = ({ data, update }: StepProps) => (
  <StepShell
    title="選擇影片的影像氣質"
    hint="風格會影響鏡頭、光線、色調與提示詞的描述方式。"
    image={styleImage}
    imageCaption="同一個科系特色，可以用不同影像語氣表達。"
    asideTitle="推薦思路"
    tips={[`${data.department} 可先以專業可信建立基本信任`, '若要吸引學生，可加入青春活力', '若要呈現照護或教育價值，可加入人文溫度']}
  >
    <OptionGrid>
      <OptionButton label="專業可信" selected={data.visualStyle === '專業可信'} onClick={() => update('visualStyle', '專業可信')} note="明亮、乾淨、正式。" />
      <OptionButton label="青春活力" selected={data.visualStyle === '青春活力'} onClick={() => update('visualStyle', '青春活力')} note="節奏輕快，學生感更強。" />
      <OptionButton label="未來科技" selected={data.visualStyle === '未來科技'} onClick={() => update('visualStyle', '未來科技')} note="適合 AI、設備、創新主題。" />
      <OptionButton label="人文溫度" selected={data.visualStyle === '人文溫度'} onClick={() => update('visualStyle', '人文溫度')} note="強調互動、照護與故事感。" />
    </OptionGrid>
    <ImpactNote title="風格不是濾鏡" body={buildStyleFeedback(data.visualStyle, data.audience)} />
  </StepShell>
);

const OutputStep = ({ data, update }: StepProps) => (
  <StepShell
    title="設定長度與發布平台"
    hint="選擇 60 秒時，結果會產生完整 60 秒分鏡，而不是只改標籤。"
    image={outputImage}
    imageCaption="平台與秒數會決定影片節奏與分鏡數量。"
    asideTitle="規格會影響"
    tips={['15 秒適合快速曝光', '30 秒適合社群與官網簡介', '60 秒適合完整科系介紹與招生說明']}
  >
    <OptionGrid columns={3}>
      <OptionButton label="15 秒" selected={data.length === '15 秒'} onClick={() => update('length', '15 秒')} />
      <OptionButton label="30 秒" selected={data.length === '30 秒'} onClick={() => update('length', '30 秒')} />
      <OptionButton label="60 秒" selected={data.length === '60 秒'} onClick={() => update('length', '60 秒')} />
    </OptionGrid>
    <OptionGrid>
      <OptionButton label="社群短影音" selected={data.platform === '社群短影音'} onClick={() => { update('platform', '社群短影音'); update('ratio', '9:16 直式'); }} />
      <OptionButton label="學校官網或招生頁" selected={data.platform === '學校官網或招生頁'} onClick={() => { update('platform', '學校官網或招生頁'); update('ratio', '16:9 橫式'); }} />
      <OptionButton label="招生說明會或簡報播放" selected={data.platform === '招生說明會或簡報播放'} onClick={() => { update('platform', '招生說明會或簡報播放'); update('ratio', '16:9 橫式'); }} />
      <OptionButton label="方形社群貼文" selected={data.platform === '方形社群貼文'} onClick={() => { update('platform', '方形社群貼文'); update('ratio', '1:1 方形'); }} />
    </OptionGrid>
  </StepShell>
);

const ResultView = ({ result, data, copied, copyText }: { result: ReturnType<typeof buildResult>; data: PlannerState; copied: string; copyText: (label: string, text: string) => void }) => {
  const [activeTab, setActiveTab] = useState<ResultTab>('brief');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const checklist = [
    '人物臉孔、髮型與服裝在所有鏡頭一致',
    '專業設備與操作方式正確',
    '每顆鏡頭只完成一個主要動作',
    '字幕與 Logo 由後製加入，不交給生成模型',
    `總長度符合 ${data.length}，比例為 ${data.ratio}`,
    `結尾清楚引導觀眾${data.desiredAction}`,
  ];
  const checkedCount = checklist.filter((item) => checkedItems[item]).length;
  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <section className="aivp-panel" style={{ ...card, height: 760, padding: 28, display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 16, minHeight: 0 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 24 }}>
        <div>
          <Badge>製作工作台</Badge>
          <h2 style={{ fontSize: 38, margin: '10px 0 6px', lineHeight: 1.15 }}>{data.school} {data.department}</h2>
          <div style={{ color: palette.muted, fontSize: 19 }}>從企劃確認到生成與剪輯，依序完成這份 {data.length} 製作包。</div>
        </div>
        <button className="aivp-focus" onClick={() => copyText('完整製作包', result.packageText)} style={{ ...copyButton, background: copied === '完整製作包' ? palette.greenSoft : palette.surface, color: copied === '完整製作包' ? palette.green : palette.accent }}>{copied === '完整製作包' ? '已複製製作包' : '複製完整製作包'}</button>
      </header>
      <div role="tablist" aria-label="成果工作區" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: `1px solid ${palette.line}`, paddingBottom: 12 }}>
        <ResultTabButton label="企劃摘要" active={activeTab === 'brief'} onClick={() => setActiveTab('brief')} />
        <ResultTabButton label="分鏡腳本" active={activeTab === 'storyboard'} onClick={() => setActiveTab('storyboard')} />
        <ResultTabButton label="剪輯與檢查" active={activeTab === 'edit'} onClick={() => setActiveTab('edit')} />
      </div>
      <div onWheel={handleWheelScroll} style={{ minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', paddingRight: 8, paddingBottom: 18 }}>
        {activeTab === 'brief' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.12fr 0.88fr', gap: 18 }}>
            <div>
              <h3 style={{ fontSize: 27, margin: '0 0 10px' }}>企劃主軸</h3>
              <p style={{ color: palette.text, fontSize: 20, lineHeight: 1.55, margin: 0 }}>{result.brief}</p>
              <ImpactNote title="為什麼這樣安排" body={result.reason} />
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <InfoPill label="一句話定位" value={data.positioning || result.summary[0]} />
                <InfoPill label="核心訊息" value={data.coreMessage} />
                <InfoPill label="觀眾改變" value={data.communicationGoal} />
                <InfoPill label="行動目標" value={data.desiredAction} />
              </div>
            </div>
            <div style={{ background: palette.soft, borderRadius: 14, padding: 18 }}>
              <h3 style={{ fontSize: 24, margin: '0 0 12px' }}>決策如何進入影片</h3>
              <DecisionRow label="對誰說" value={data.audience} />
              <DecisionRow label="用什麼證明" value={data.highlights.join('、')} />
              <DecisionRow label="影像語氣" value={data.visualStyle} />
              <DecisionRow label="在哪裡播放" value={`${data.platform}／${data.ratio}`} />
              <DecisionRow label="最後行動" value={data.desiredAction} />
              <button className="aivp-focus" onClick={() => copyText('企劃摘要', result.brief)} style={{ ...copyButton, width: '100%', marginTop: 14, background: copied === '企劃摘要' ? palette.greenSoft : palette.surface, color: copied === '企劃摘要' ? palette.green : palette.accent }}>{copied === '企劃摘要' ? '已複製摘要' : '複製企劃摘要'}</button>
            </div>
          </div>
        )}
        {activeTab === 'storyboard' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 18, color: palette.muted }}>每顆鏡頭都有明確目的、證據與轉場。展開後可查看完整製作規格。</div>
            {result.shots.map((shot, index) => (
              <ShotCard
                key={shot.time}
                shotNumber={index + 1}
                shot={shot}
                copied={copied}
                onCopyImage={() => copyText(`鏡頭 ${index + 1} 圖像提示詞`, shot.imagePrompt)}
                onCopyVideo={() => copyText(`鏡頭 ${index + 1} 影片提示詞`, shot.videoPrompt)}
              />
            ))}
          </div>
        )}
        {activeTab === 'edit' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.9fr', gap: 18 }}>
            <div>
              <WorkspaceIntro title="剪輯與聲音設計" body="影片生成工具負責鏡頭，字幕、Logo、CTA、轉場與整體音樂應在剪輯階段完成。" />
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                {result.shots.map((shot, index) => (
                  <div key={shot.time} style={{ background: palette.soft, borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>{index + 1}. {shot.title} <span style={{ color: palette.accent }}>{shot.time}</span></div>
                    <div style={{ marginTop: 6, fontSize: 17, color: palette.muted, lineHeight: 1.45 }}>聲音：{shot.sound}</div>
                    <div style={{ marginTop: 4, fontSize: 17, color: palette.muted, lineHeight: 1.45 }}>轉場：{shot.transition}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: palette.surfaceSoft, borderRadius: 14, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                <h3 style={{ fontSize: 25, margin: 0 }}>交付前檢查</h3>
                <div style={{ fontSize: 16, color: checkedCount === checklist.length ? palette.green : palette.muted, fontWeight: 850 }}>已完成 {checkedCount}／{checklist.length}</div>
              </div>
              {checklist.map((item) => <CheckRow key={item} text={item} checked={Boolean(checkedItems[item])} onChange={() => toggleCheck(item)} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const RecapView = ({ data, result, copied, copyText }: { data: PlannerState; result: ReturnType<typeof buildResult>; copied: string; copyText: (label: string, text: string) => void }) => (
  <div className="aivp-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, height: 700 }}>
    <section style={{ ...card, padding: 28 }}>
      <Badge>閉環完成</Badge>
      <h2 style={{ fontSize: 42, lineHeight: 1.16, margin: '14px 0 12px' }}>你現在擁有一份可以開始製作的影像計畫</h2>
      <p style={{ fontSize: 20, lineHeight: 1.45, color: palette.muted, margin: 0 }}>
        你已經把資料整理成事實、把目標轉成策略，再把策略拆成可生成與可剪輯的鏡頭。
      </p>
      <div style={{ marginTop: 16, display: 'grid', gap: 9 }}>
        <RecapRow label="01 事實" value={data.positioning || result.summary[0]} />
        <RecapRow label="02 策略" value={`${data.audience}／${data.communicationGoal}`} />
        <RecapRow label="03 訊息" value={data.coreMessage} />
        <RecapRow label="04 證據" value={data.highlights.join('、')} />
        <RecapRow label="05 製作" value={`${result.shots.length} 個鏡頭／${data.length}／${data.ratio}`} />
        <RecapRow label="06 行動" value={data.desiredAction} />
      </div>
      <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: palette.surfaceSoft, border: `1px solid ${palette.line}` }}>
        <div style={{ fontSize: 30, lineHeight: 1.14, fontWeight: 950, color: palette.inkBlue }}>
          想像力，<br />
          就是指揮 AI 的超能力！
        </div>
        <div style={{ marginTop: 8, fontSize: 18, lineHeight: 1.35, color: palette.muted }}>先生成第一顆鏡頭的定稿圖，確認人物與場景，再依序完成整支影片。</div>
      </div>
      <button className="aivp-focus" onClick={() => copyText('完整製作包', result.packageText)} style={{ ...copyButton, marginTop: 12, background: copied === '完整製作包' ? palette.greenSoft : palette.surface, color: copied === '完整製作包' ? palette.green : palette.accent }}>{copied === '完整製作包' ? '已複製製作包' : '複製完整製作包'}</button>
    </section>
    <section style={{ ...card, padding: 28, background: palette.inkBlue, color: '#ffffff' }}>
      <div style={{ fontSize: 20, color: '#b9d3ff', fontWeight: 850 }}>接下來照這個順序做</div>
      <h3 style={{ fontSize: 34, lineHeight: 1.2, margin: '10px 0 22px' }}>從第一張定稿圖，到可以交付的影片</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        <ProductionPhase number="1" title="定稿圖片" body="逐顆生成圖片，先確認人物、服裝、場景、設備與構圖一致。" accent="#69a4ff" />
        <ProductionPhase number="2" title="生成鏡頭" body="使用定稿圖生成單一連續動作，每顆依分鏡秒數輸出。" accent="#47c8be" />
        <ProductionPhase number="3" title="剪輯聲音" body="依時間碼組合鏡頭，再加入旁白、字幕、音樂、環境音與 CTA。" accent="#78d49c" />
        <ProductionPhase number="4" title="品質檢查" body="檢查人物一致性、專業正確性、節奏、總秒數與行動目標。" accent="#f2c66d" />
      </div>
      <div style={{ marginTop: 18, padding: 16, borderRadius: 13, background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.16)' }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>第一個實作動作</div>
        <div style={{ marginTop: 6, fontSize: 17, lineHeight: 1.45, color: '#d9e6fb' }}>回到工作台的「分鏡腳本」，複製鏡頭 1 的圖像提示詞，生成第一張定稿圖。</div>
      </div>
    </section>
  </div>
);

const TopBar = ({ currentIndex, step, copied, onHome }: { currentIndex: number; step: StepId; copied: string; onHome: () => void }) => (
  <header style={{ display: 'grid', gridTemplateColumns: '220px 1fr 190px', alignItems: 'center', gap: 24, marginBottom: 28 }}>
    <button className="aivp-focus" onClick={onHome} style={ghostButton}>AI 影像創作引導室</button>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 8 }}>
      {steps.map((item, index) => <ProgressItem key={item.id} active={step === item.id} done={currentIndex > index} label={item.label} />)}
    </div>
    <div style={{ textAlign: 'right', color: copied ? palette.green : palette.muted, fontSize: 20 }}>{copied ? `${copied}已複製` : '自動保存在本機'}</div>
  </header>
);

const StepShell = ({ title, hint, asideTitle, tips, image, imageCaption, children }: { title: string; hint: string; asideTitle: string; tips: string[]; image: string; imageCaption: string; children: ReactNode }) => (
  <div className="aivp-panel" style={{ display: 'grid', gridTemplateColumns: '1.34fr 0.66fr', gap: 28, height: 800 }}>
    <section style={{ ...card, padding: 36 }}>
      <h2 style={{ fontSize: 47, lineHeight: 1.18, margin: '0 0 12px' }}>{title}</h2>
      <p style={{ fontSize: 23, lineHeight: 1.5, margin: '0 0 28px', color: palette.muted }}>{hint}</p>
      {children}
    </section>
    <aside style={{ ...card, padding: 22, background: palette.surfaceSoft, display: 'grid', gridTemplateRows: 'auto 1fr', gap: 18 }}>
      <div style={{ background: palette.surface, border: `1px solid ${palette.line}`, borderRadius: 14, padding: 18 }}>
        <Badge>小提示</Badge>
        <h3 style={{ fontSize: 27, margin: '14px 0 10px' }}>{asideTitle}</h3>
        <ul style={{ margin: 0, paddingLeft: 24, color: palette.muted, fontSize: 20, lineHeight: 1.55 }}>
          {tips.map((tip) => <li key={tip}>{tip}</li>)}
        </ul>
      </div>
      <figure style={{ margin: 0, minHeight: 0, borderRadius: 16, overflow: 'hidden', border: `1px solid ${palette.line}`, background: palette.surface, position: 'relative' }}>
        <img src={image} alt={imageCaption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <figcaption style={{ position: 'absolute', left: 14, right: 14, bottom: 14, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.9)', color: palette.inkBlue, fontSize: 17, lineHeight: 1.35, fontWeight: 800 }}>{imageCaption}</figcaption>
      </figure>
    </aside>
  </div>
);

type StepProps = {
  data: PlannerState;
  update: <K extends keyof PlannerState>(key: K, value: PlannerState[K]) => void;
};

const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) => (
  <label style={{ display: 'block', marginBottom: 18 }}>
    <span style={fieldLabel}>{label}</span>
    <input className="aivp-focus" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} />
  </label>
);

const TextAreaField = ({ label, value, onChange, placeholder, compact = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; compact?: boolean }) => (
  <label style={{ display: 'block' }}>
    <span style={fieldLabel}>{label}</span>
    <textarea
      className="aivp-focus"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      style={{ ...inputStyle, height: compact ? 108 : 160, resize: 'none', lineHeight: 1.45, fontSize: compact ? 19 : 22 }}
    />
  </label>
);

const ImpactNote = ({ title, body }: { title: string; body: string }) => (
  <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 13, background: palette.greenSoft, border: '1px solid #b9ead8' }}>
    <div style={{ color: palette.green, fontSize: 18, fontWeight: 900 }}>{title}</div>
    <div style={{ marginTop: 5, color: '#17634d', fontSize: 18, lineHeight: 1.4 }}>{body}</div>
  </div>
);

const buildAudienceFeedback = (audience: string) => {
  if (audience === '家長') return '增加證照、師資、實習與就業證據，旁白偏理性可信，減少過多青春口號。';
  if (audience === '校友') return '強化科系成長、共同記憶與成果連結，讓校友看見持續發展與參與價值。';
  if (audience === '企業與產學夥伴') return '優先呈現專業能力、設備、產學成果與合作場景，語氣更精準務實。';
  return '增加學生視角、實作參與與未來想像，讓畫面更有代入感與前進感。';
};

const buildStyleFeedback = (visualStyle: string, audience: string) => {
  if (visualStyle === '青春活力') return `會增加移動鏡頭、學生互動與明亮節奏，適合吸引${audience}快速投入。`;
  if (visualStyle === '人文溫度') return '會增加中近景、眼神、師生互動與自然環境音，讓陪伴感成為主要情緒。';
  if (visualStyle === '未來科技') return '會強化設備、流程與俐落構圖，但避免不符合真實校園的科幻特效。';
  return '會使用穩定構圖、真實操作與清楚證據，先建立教育品牌的可信度。';
};

const OptionGrid = ({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 14, marginBottom: 18 }}>{children}</div>
);

const OptionButton = ({ label, selected, onClick, note, disabled = false }: { label: string; selected: boolean; onClick: () => void; note?: string; disabled?: boolean }) => (
  <button disabled={disabled} className="aivp-focus" onClick={onClick} style={{ ...optionStyle, borderColor: selected ? palette.accent : palette.line, background: selected ? '#eaf1ff' : palette.surface, boxShadow: selected ? 'inset 0 0 0 1px #2563eb' : 'none', opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
    <span style={{ display: 'block', fontWeight: 850 }}>{label}</span>
    {note && <span style={{ display: 'block', marginTop: 8, fontSize: 18, color: palette.muted }}>{note}</span>}
  </button>
);

const FooterNav = ({ onBack, onNext, nextLabel, backLabel = '返回上一步', disabled = false, helper = '' }: { onBack: () => void; onNext: () => void; nextLabel: string; backLabel?: string; disabled?: boolean; helper?: string }) => (
  <footer style={{ position: 'absolute', left: 54, right: 54, bottom: 42, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Button label={backLabel} onClick={onBack} kind="secondary" />
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {helper && <div role="status" style={{ maxWidth: 420, color: palette.red, fontSize: 17, lineHeight: 1.35, textAlign: 'right' }}>{helper}</div>}
      <Button label={nextLabel} onClick={onNext} kind="primary" disabled={disabled} />
    </div>
  </footer>
);

const Button = ({ label, onClick, kind, disabled = false }: { label: string; onClick: () => void; kind: 'primary' | 'secondary'; disabled?: boolean }) => (
  <button disabled={disabled} className="aivp-focus" onClick={onClick} style={{ border: kind === 'primary' ? 'none' : `1px solid ${palette.lineStrong}`, background: disabled ? '#aebbd0' : kind === 'primary' ? palette.accent : palette.surface, color: kind === 'primary' ? '#ffffff' : palette.text, borderRadius: 14, padding: '18px 26px', fontSize: 23, fontWeight: 850, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.72 : 1 }}>{label}</button>
);

const ShotCard = ({ shot, shotNumber, copied, onCopyImage, onCopyVideo }: { shot: Shot; shotNumber: number; copied: string; onCopyImage: () => void; onCopyVideo: () => void }) => {
  const [open, setOpen] = useState(false);
  const imageCopied = copied === `鏡頭 ${shotNumber} 圖像提示詞`;
  const videoCopied = copied === `鏡頭 ${shotNumber} 影片提示詞`;
  return (
    <article style={{ border: `1px solid ${palette.line}`, borderRadius: 14, background: palette.surface, padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '86px 1fr 250px', gap: 12, alignItems: 'start' }}>
        <div style={{ fontSize: 18, color: palette.accent, fontWeight: 900 }}>{shot.time}</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 850, marginBottom: 5 }}>{shot.title}</div>
          <div style={{ fontSize: 17, lineHeight: 1.38, color: palette.muted }}>{shot.visual}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="aivp-focus" onClick={onCopyImage} style={{ ...smallButton, background: imageCopied ? palette.greenSoft : palette.surface, color: imageCopied ? palette.green : palette.accent }}>
            <span>{imageCopied ? '已複製' : '複製'}</span>
            <span>圖像提示詞</span>
          </button>
          <button className="aivp-focus" onClick={onCopyVideo} style={{ ...smallButton, background: videoCopied ? palette.greenSoft : palette.surface, color: videoCopied ? palette.green : palette.accent }}>
            <span>{videoCopied ? '已複製' : '複製'}</span>
            <span>影片提示詞</span>
          </button>
        </div>
      </div>
      <button className="aivp-focus" onClick={() => setOpen(!open)} style={{ ...ghostButton, marginTop: 8, fontSize: 17 }}>{open ? '收合細節' : '展開細節'}</button>
      {open && (
        <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
          <Detail label="鏡頭目的" value={shot.purpose} />
          <Detail label="畫面證據" value={shot.evidence} />
          <Detail label="鏡頭建議" value={shot.camera} />
          <Detail label="旁白／字幕" value={shot.voiceover} />
          <Detail label="音樂／音效" value={shot.sound} />
          <Detail label="轉場方式" value={shot.transition} />
          <Detail label="建議製作方式" value={shot.generation} />
          <Detail label="圖像提示詞" value={shot.imagePrompt} />
          <Detail label="影片提示詞" value={shot.videoPrompt} />
        </div>
      )}
    </article>
  );
};

const buildMaterialAnalysis = (data: PlannerState) => {
  const source = cleanText(`${data.pastedText} ${data.fileText}`);
  const chunks = source.split(/[。！？\n]/).map((item) => item.trim()).filter((item) => item.length >= 8);
  const evidence = chunks.filter((item) => /(實作|實習|證照|設備|成果|課程|合作|作品|競賽)/.test(item)).slice(0, 3);
  const scenes = chunks.filter((item) => /(學生|老師|教室|實驗|實習|操作|活動|場域)/.test(item)).slice(0, 2);
  const positioning = chunks[0] || `${data.department}以專業學習、實作能力與未來發展為核心。`;
  return {
    positioning,
    evidence: evidence.join('；') || `${data.highlights.slice(0, 3).join('、')}等可被畫面驗證的學習特色。`,
    sceneNotes: scenes.join('；') || `學生參與實作、老師提供回饋、同儕討論與成果展示。`,
    coreMessage: `${data.department}讓學生透過真實學習與專業陪伴，建立走向未來的能力。`,
  };
};

const buildSummary = (data: PlannerState) => {
  const analysis = buildMaterialAnalysis(data);
  return [
    data.positioning || analysis.positioning,
    data.evidence || analysis.evidence,
    data.sceneNotes || analysis.sceneNotes,
    data.exclusions,
  ];
};

const buildResult = (data: PlannerState, summary: string[]) => {
  const highlights = data.highlights.length ? data.highlights : ['實作課程', '專業證照', '就業出路'];
  const message = data.coreMessage || `${data.department}讓學生透過真實學習與專業陪伴，建立走向未來的能力。`;
  const brief = `${data.school} ${data.department} 的 ${data.length}「${data.topic}」。核心訊息是「${message}」；影片將以 ${highlights.slice(0, 3).join('、')} 作為畫面證據，讓 ${data.audience} 產生「${data.communicationGoal}」，最後引導觀眾${data.desiredAction}。`;
  const reason = `因為主要對象是${data.audience}，影片會採用${buildAudienceFeedback(data.audience)}平台為${data.platform}，所以以${data.ratio}安排構圖與字幕安全區；${buildStyleFeedback(data.visualStyle, data.audience)}`;
  const shots = buildShots(data, highlights);
  const recapText = `製作路徑：以「${data.positioning || summary[0]}」為定位，對 ${data.audience} 傳達「${message}」，使用 ${highlights.join('、')} 作為證據，採 ${data.visualStyle} 風格與 ${data.length}／${data.ratio} 規格，共規劃 ${shots.length} 個鏡頭，最後引導觀眾${data.desiredAction}。`;

  return {
    brief,
    reason,
    summary,
    shots,
    storyboardText: shots.map(shotToText).join('\n\n'),
    promptText: shots.map(promptBlock).join('\n\n'),
    packageText: `${brief}\n\n${recapText}\n\n分鏡腳本\n${shots.map(shotToText).join('\n\n')}`,
    recapText,
  };
};

const buildShots = (data: PlannerState, highlights: string[]) => {
  const message = data.coreMessage || `${data.department}讓學生透過真實學習與專業陪伴，建立走向未來的能力。`;
  const topicHook = buildTopicHook(data.topic, data.department);
  if (data.length === '15 秒') {
    return [
      makeShot('0-3s', '用具體場景抓住注意', `${topicHook.visual} ${data.sceneNotes || '學生走入專業學習空間'}。`, '24mm 廣角快速建立場景，穩定推進。', topicHook.voiceover, data),
      makeShot('3-7s', `證明 ${highlights[0]}`, `學生完成一個與${highlights[0]}相關的明確操作，老師在旁確認。`, '50mm 中景，單一連續動作。', `能力，不是被說出來，而是在真實操作中被看見。`, data),
      makeShot('7-11s', `連結 ${highlights[1] || '專業成果'}`, `以設備、成果或證照細節證明學習具有專業標準。`, '85mm 近景特寫，焦點清楚。', `每一次練習，都讓未來更具體。`, data),
      makeShot('11-15s', '留下行動記憶', `學生自然向前走，背景保留乾淨空間供後製加入校名與行動文字。`, '50mm 穩定中景，最後一秒停留。', `${message} ${data.desiredAction}。`, data),
    ];
  }

  if (data.length === '60 秒') {
    return [
      makeShot('0-5s', '用真實行動開場', `${topicHook.visual} ${data.sceneNotes || '學生進入專業學習場域'}。`, '24mm 廣角慢推。', topicHook.voiceover, data),
      makeShot('5-11s', '建立科系定位', `${data.positioning || `${data.department}的核心學習定位`}透過教學場域與人物關係被看見。`, '35mm 中遠景橫移。', `${data.positioning || `${data.department}從真實學習開始建立專業能力。`}`, data),
      makeShot('11-17s', `證明 ${highlights[0]}`, `學生完成${highlights[0]}的一個明確步驟，老師提供具體回饋。`, '50mm 中景，保持單一動作。', `透過實際參與，知識開始成為能被使用的能力。`, data),
      makeShot('17-23s', `${highlights[0]}的細節證據`, `手部、器材與操作結果形成一組清楚的細節鏡頭。`, '85mm 特寫，淺景深。', `每個細節，都有專業標準。`, data),
      makeShot('23-30s', `證明 ${highlights[1] || '專業成果'}`, `以${data.evidence || highlights[1]}中的設備、證照或成果作為視覺證據。`, '35mm 中景轉 85mm 特寫。', `學習成果，不只被完成，也能被驗證。`, data),
      makeShot('30-37s', `證明 ${highlights[2] || '未來連結'}`, `學生將學習成果應用到實習、合作或未來職涯情境。`, '35mm 中遠景，視線朝前。', `所學的每一步，都連向未來的真實場景。`, data),
      makeShot('37-43s', '建立師生信任', `老師與學生確認成果、交換眼神，同儕在背景持續練習。`, '50mm 中近景。', `專業成長，也來自一路上的陪伴與回饋。`, data),
      makeShot('43-49s', '讓觀眾代入未來', `以學生視角走過教室、成果區與出口，形成前進路徑。`, '穩定跟拍，速度自然。', `下一個站在這裡的人，也可能是你。`, data),
      makeShot('49-55s', '快速整理三項證據', `以三個乾淨短鏡頭回顧${highlights.slice(0, 3).join('、')}。`, '中景、近景、特寫各一顆。', message, data),
      makeShot('55-60s', '明確行動呼籲', `學生自然停下並望向前方，畫面保留文字安全區。`, '50mm 穩定中景，最後兩秒停留。', `${data.desiredAction}，看見你在 ${data.school} ${data.department} 的下一步。`, data),
    ];
  }

  return [
    makeShot('0-5s', '用真實場景建立第一印象', `${topicHook.visual} ${data.sceneNotes || '學生走入專業學習空間'}。`, '24mm 廣角穩定推進。', topicHook.voiceover, data),
    makeShot('5-10s', `證明 ${highlights[0]}`, `學生完成${highlights[0]}的一個明確操作，老師在旁確認。`, '50mm 中景，單一連續動作。', `真正的能力，從實際參與開始。`, data),
    makeShot('10-15s', `${highlights[0]}細節`, `手部、器材與操作結果被清楚看見。`, '85mm 近景特寫。', `每個細節，都有專業標準。`, data),
    makeShot('15-21s', `證明 ${highlights[1] || '專業成果'}`, `以設備、證照、作品或學習成果支撐科系定位。`, '35mm 中景搭配局部特寫。', `學習成果，能被看見，也能被驗證。`, data),
    makeShot('21-26s', `連結 ${highlights[2] || '未來方向'}`, `學生將所學連結到實習、合作或未來職涯情境。`, '35mm 中遠景向前移動。', `所學的每一步，都連向未來。`, data),
    makeShot('26-30s', '收束並引導行動', `學生自然望向前方，背景保留乾淨的字幕安全區。`, '50mm 穩定中景，最後一秒停留。', `${data.desiredAction}，從 ${data.school} ${data.department} 看見下一步。`, data),
  ];
};

const buildTopicHook = (topic: string, department: string) => {
  if (topic.includes('職涯')) return { visual: '先看見畢業後可能工作的真實情境，再回到學生正在累積能力的校園場景。', voiceover: `未來的工作樣貌，從 ${department} 的每一次學習開始。` };
  if (topic.includes('實作')) return { visual: '直接從學生完成一個具體專業操作開始，不先拍空泛校園空景。', voiceover: `在 ${department}，學習從親手完成開始。` };
  if (topic.includes('成果')) return { visual: '以完成的作品、成果或專業表現作為第一個視覺焦點，再帶出背後的學習過程。', voiceover: `每一項成果，都來自一段可以被看見的成長。` };
  if (topic.includes('校園生活')) return { visual: '從學生走入教室、與同儕互動的第一人稱路徑建立代入感。', voiceover: `想像你的校園日常，從走進 ${department} 的這一刻開始。` };
  if (topic.includes('產學')) return { visual: '先以校外合作、實習或業界交流情境建立真實性，再連回校內準備過程。', voiceover: `課堂裡累積的能力，會在真實合作中被使用。` };
  return { visual: '以最具科系辨識度的教學場域與學生行動建立第一印象。', voiceover: `從這裡，看見 ${department} 真正的學習樣貌。` };
};

const makeShot = (time: string, title: string, visual: string, camera: string, voiceover: string, data: PlannerState): Shot => ({
  time,
  title,
  purpose: buildShotPurpose(title, data),
  evidence: buildShotEvidence(title, data),
  visual,
  camera,
  voiceover,
  sound: buildSoundCue(data, title),
  transition: buildTransition(title),
  generation: buildGenerationMethod(title),
  imagePrompt: buildImagePrompt(data, title, visual, camera),
  videoPrompt: buildVideoPrompt(data, time, title, visual, camera),
});

const shotToText = (shot: Shot) => `${shot.time}｜${shot.title}
畫面：${shot.visual}
鏡頭目的：${shot.purpose}
畫面證據：${shot.evidence}
鏡頭：${shot.camera}
旁白／字幕：${shot.voiceover}
音樂／音效：${shot.sound}
轉場：${shot.transition}
製作方式：${shot.generation}
圖像提示詞：
${shot.imagePrompt}
影片提示詞：${shot.videoPrompt}`;

const promptBlock = (shot: Shot, index: number) => `鏡頭 ${index + 1}｜${shot.time}｜${shot.title}

畫面任務：
${shot.visual}

鏡頭目的：
${shot.purpose}

畫面證據：
${shot.evidence}

音樂／音效：
${shot.sound}

圖像提示詞：
${shot.imagePrompt}

影片提示詞：
${shot.videoPrompt}`;

const buildShotPurpose = (title: string, data: PlannerState) => {
  if (title.includes('開場') || title.includes('第一印象') || title.includes('注意')) return `讓${data.audience}在前幾秒理解這是${data.department}，並願意繼續看。`;
  if (title.includes('定位')) return `用真實場域說明「${data.positioning || `${data.department}的專業定位`}」。`;
  if (title.includes('證明') || title.includes('細節')) return `提供可被看見的證據，支持「${data.communicationGoal}」。`;
  if (title.includes('信任') || title.includes('情感')) return '讓觀眾感受到師生陪伴、回饋與學習安全感。';
  if (title.includes('未來') || title.includes('連結') || title.includes('代入')) return '把校園學習連結到觀眾能想像的未來情境。';
  if (title.includes('整理') || title.includes('回顧')) return '在結尾前重新整理核心證據，加深記憶。';
  return `引導觀眾${data.desiredAction}，完成影片溝通任務。`;
};

const buildShotEvidence = (title: string, data: PlannerState) => {
  if (title.includes('開場') || title.includes('第一印象') || title.includes('注意')) return data.sceneNotes || '真實教學場域、學生行動與專業設備。';
  if (title.includes('證明') || title.includes('細節') || title.includes('定位')) return data.evidence || data.highlights.join('、');
  if (title.includes('信任') || title.includes('情感')) return '老師提供具體回饋、學生自然回應、同儕持續參與。';
  if (title.includes('未來') || title.includes('連結') || title.includes('代入')) return '實習、合作、成果應用或職涯場域。';
  return `${data.school}、${data.department}與「${data.desiredAction}」的後製文字。`;
};

const buildTransition = (title: string) => {
  if (title.includes('開場') || title.includes('第一印象') || title.includes('注意')) return '以人物移動方向銜接下一鏡，避免花俏特效。';
  if (title.includes('細節')) return '動作對切：由中景操作切到同一動作的手部特寫。';
  if (title.includes('未來') || title.includes('連結') || title.includes('代入')) return '以視線或走動方向轉場，從校內自然連到未來。';
  if (title.includes('整理') || title.includes('回顧')) return '使用 3 顆短鏡頭節奏剪輯，每顆約 1.5 至 2 秒。';
  if (title.includes('行動') || title.includes('收束') || title.includes('記憶')) return '配樂收束並留出 1 至 2 秒文字停留時間。';
  return '以前一鏡的手勢、視線或器材位置做連續性剪接。';
};

const buildGenerationMethod = (title: string) => {
  if (title.includes('整理') || title.includes('回顧')) return '建議分別生成 3 張圖與 3 段短影片，再於剪輯軟體組成蒙太奇。';
  if (title.includes('行動') || title.includes('收束') || title.includes('記憶')) return '生成乾淨人物畫面，校名、科系與 CTA 請於剪輯階段後製。';
  return '先生成定稿圖片確認人物、場景與設備，再以該圖生成單一連續影片鏡頭。';
};

const buildImagePrompt = (data: PlannerState, title: string, visual: string, camera: string) => {
  const profile = getDepartmentVisualProfile(data.department);
  const scene = buildPromptScene(title, visual, profile);
  const cameraText = camera.replace(/[。；]+$/g, '');

  return [
    `${scene} 畫面任務只包含：${visual}`,
    `固定同一組 4 位 18 至 22 歲台灣學生，穿著${profile.wardrobe}，臉孔、髮型、服裝與配色一致；人物自然專注，不看鏡頭。`,
    `${buildPromptComposition(title)}；${cameraText}。${buildLightingDirection(data.visualStyle)}，真實膚色，背景乾淨。`,
    `台灣校園紀實商業攝影，${data.visualStyle}，自然景深，寫實高細節，${data.ratio}。不要文字、Logo、字幕、浮水印、僵硬擺拍、肢體變形或國外校園感。額外限制：${data.exclusions}`,
  ].join('\n');
};

const buildVideoPrompt = (data: PlannerState, time: string, title: string, visual: string, camera: string) => {
  const duration = getShotDuration(time);
  const profile = getDepartmentVisualProfile(data.department);
  const cameraText = camera.replace(/[。；]+$/g, '');
  return [
    `將參考畫面生成 ${duration} 秒的單一連續鏡頭。${buildPromptScene(title, visual, profile)} 畫面任務只包含：${visual}`,
    `${buildMotionDirection(title, profile)} 鏡頭採用${cameraText}，速度穩定，不突然加速、不切換場景。`,
    `保持人物臉孔、髮型、服裝、設備位置與空間配置一致；光線不閃爍，背景不漂移，手部與器材不變形。避免：${data.exclusions}`,
    `${buildSoundCue(data, title)} 維持${data.visualStyle}的台灣校園紀實商業質感。`,
  ].join('\n');
};

const getShotDuration = (time: string) => {
  const [start, end] = time.replace('s', '').split('-').map(Number);
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(1, end - start) : 5;
};

const buildLightingDirection = (visualStyle: string) => {
  if (visualStyle === '青春活力') return '明亮日光從側面進入，清新藍綠色調，畫面有活力但不過度飽和';
  if (visualStyle === '人文溫度') return '柔和窗光與暖白色調，保留自然陰影，呈現親切陪伴感';
  if (visualStyle === '未來科技') return '乾淨明亮的冷白光，適量藍色點綴，空間俐落但不做科幻特效';
  return '明亮自然窗光，中性清新的校園色調，對比柔和';
};

const buildMotionDirection = (title: string, profile: DepartmentVisualProfile) => {
  if (title.includes('開場') || title.includes('第一印象')) return '學生從走廊自然走入學習空間，衣物與髮絲只有輕微自然擺動。';
  if (title.includes('定位')) return '學生一邊觀察示範、一邊記錄重點，老師以手勢指向設備，互動克制真實。';
  if (title.includes('實作') || title.includes('核心亮點') || title.includes('呈現')) return `一位學生正在${profile.action}，老師從旁確認，其他學生專注觀察；動作只完成一次，不重複或倒放。`;
  if (title.includes('證照') || title.includes('資源')) return '學生伸手操作設備或翻看成果，焦點依序從手部移到器材細節，動作精準緩慢。';
  if (title.includes('出路') || title.includes('未來')) return '學生完成學習操作後抬頭望向前方，順勢走向下一個空間，帶出前進感。';
  if (title.includes('情感')) return '老師與學生簡短交換眼神並自然微笑，同儕輕微點頭回應，不看鏡頭。';
  if (title.includes('整理') || title.includes('回顧')) return '鏡頭沿成果展示區平穩移動，學生在背景整理作品，前中後景各有一個清楚動作。';
  if (title.includes('收束') || title.includes('行動')) return '學生停下動作並自然面向前方，神情自信，最後一秒保持穩定方便後製加入標題。';
  return '人物完成一個清楚、連續且可辨識的學習動作，其他人物只做輕微自然反應。';
};

type DepartmentVisualProfile = {
  setting: string;
  equipment: string;
  action: string;
  wardrobe: string;
};

const getDepartmentVisualProfile = (department: string): DepartmentVisualProfile => {
  if (department.includes('護理')) return { setting: '明亮整潔的護理實習教室', equipment: '病床、模擬人、護理推車與血壓計', action: '為模擬病人量測血壓並確認數值', wardrobe: '白色或淺藍色護理實習服' };
  if (department.includes('高齡')) return { setting: '高齡照顧情境教室', equipment: '輔具、健康量測設備與樂齡活動教材', action: '設計並帶領一項樂齡健康活動', wardrobe: '淺色系照顧服務實習服' };
  if (department.includes('食品')) return { setting: '食品保健實驗室', equipment: '顯微鏡、玻璃器皿、食品樣本與檢測儀器', action: '使用檢測儀器分析食品樣本', wardrobe: '白色實驗衣與基本防護裝備' };
  if (department.includes('幼兒')) return { setting: '幼兒教保模擬教室', equipment: '繪本、教具、積木與課程活動材料', action: '示範一段幼兒互動教學活動', wardrobe: '柔和色系的教保實習服裝' };
  if (department.includes('餐旅')) return { setting: '專業餐飲實習廚房', equipment: '不鏽鋼料理台、烤箱、鍋具與擺盤器具', action: '完成一道料理的備料與精緻擺盤', wardrobe: '乾淨完整的廚藝制服與圍裙' };
  if (department.includes('美容')) return { setting: '美容造型專業教室', equipment: '造型鏡、彩妝工具、假人頭與美髮設備', action: '完成一個精準的彩妝或髮型操作步驟', wardrobe: '俐落黑白色系的美容實習服' };
  if (department.includes('觀光')) return { setting: '觀光休閒企劃教室', equipment: '旅遊地圖、平板電腦、行程看板與健康活動器材', action: '共同規劃一條休閒旅遊與健康活動路線', wardrobe: '清爽自然的校園休閒服裝' };
  if (department.includes('國際')) return { setting: '國際交流會議空間', equipment: '世界地圖、簡報螢幕、交流資料與筆記型電腦', action: '與國際學生共同討論交換學習計畫', wardrobe: '簡潔有精神的校園正式休閒服' };
  if (department.includes('圖資')) return { setting: '現代化圖書資訊中心', equipment: '書架、數位查詢螢幕、電腦與影音設備', action: '使用數位系統查找並整理學習資料', wardrobe: '乾淨自然的校園學習服裝' };
  if (department.includes('招生')) return { setting: '招生諮詢與校園導覽空間', equipment: '校園資料、平板電腦、科系簡介與展示螢幕', action: '向來訪學生介紹科系與學習資源', wardrobe: '親切專業的校園行政服裝' };
  return { setting: '明亮整潔的台灣大專院校教室', equipment: '課程教材、筆記型電腦、簡報螢幕與專業學習工具', action: '與老師討論並完成一項課程任務', wardrobe: '乾淨自然的校園學習服裝' };
};

const buildPromptScene = (title: string, visual: string, profile: DepartmentVisualProfile) => {
  if (title.includes('開場') || title.includes('第一印象')) return `晨間自然光照進${profile.setting}外的走廊，4 位學生朝教室入口走去，門內可清楚看見${profile.equipment}。`;
  if (title.includes('定位')) return `${profile.setting}內，老師在${profile.equipment}旁示範，4 位學生圍成半圓觀察並記錄。`;
  if (title.includes('實作') || title.includes('核心亮點') || title.includes('呈現')) return `${profile.setting}內，一位學生正在${profile.action}，另一位記錄，老師指向關鍵步驟，其餘學生在旁觀察。`;
  if (title.includes('證照') || title.includes('資源')) return `${profile.setting}內，前景清楚呈現${profile.equipment}，學生雙手操作設備，老師在背景確認結果。`;
  if (title.includes('出路') || title.includes('未來')) return `${profile.setting}內，學生完成${profile.action}後整理成果，視線轉向通往實習或職涯場域的明亮出口。`;
  if (title.includes('情感')) return `${profile.setting}內，老師與學生在操作台旁確認成果，交換眼神並自然微笑，同儕在背景繼續練習。`;
  if (title.includes('整理') || title.includes('回顧')) return `${profile.setting}的成果展示區，前景排列完成的學習成果，學生在中景整理${profile.equipment}。`;
  if (title.includes('收束') || title.includes('行動')) return `${profile.setting}外的明亮走廊，4 位學生自然站成前後層次，神情自信，背景留出乾淨空間供後製標題使用。`;
  return `${visual} 地點固定在${profile.setting}，畫面只呈現一個明確學習行為。`;
};

const buildPromptComposition = (title: string) => {
  if (title.includes('開場') || title.includes('第一印象')) return '24mm 廣角遠景，走廊線條形成引導線，人物位於畫面中段';
  if (title.includes('定位')) return '35mm 中遠景，老師與學生形成清楚三角構圖，設備完整入鏡';
  if (title.includes('實作') || title.includes('核心亮點') || title.includes('呈現')) return '50mm 中景，主要操作位於視覺中心，前景帶入手部或器材增加層次';
  if (title.includes('證照') || title.includes('資源')) return '85mm 近景特寫，焦點落在手部、設備與操作結果，背景人物柔焦';
  if (title.includes('出路') || title.includes('未來')) return '35mm 中遠景，以出口與人物視線形成前進方向';
  if (title.includes('情感')) return '50mm 中近景，捕捉自然眼神與手勢，前後景保留同儕活動';
  if (title.includes('整理') || title.includes('回顧')) return '35mm 橫向層次構圖，成果在前景、人物在中景、教室在背景';
  if (title.includes('收束') || title.includes('行動')) return '50mm 穩定中景，人物置中但保留上方與側邊留白';
  return '50mm 自然視角中景，主體明確，前中後景分層';
};

const buildSoundCue = (data: PlannerState, title: string) => {
  const baseMusic = data.visualStyle === '青春活力' ? '明亮輕快的節奏型配樂' : data.visualStyle === '人文溫度' ? '溫暖柔和的鋼琴或木吉他配樂' : '乾淨可信、節奏穩定的校園形象配樂';
  if (title.includes('開場') || title.includes('第一印象')) {
    return `${baseMusic}淡入，加入校園環境聲、腳步聲與遠處教室聲，音量低於旁白。`;
  }
  if (title.includes('定位')) {
    return `配樂維持穩定脈動，加入翻頁聲、筆記聲或教室低頻環境聲，營造清楚可信的學習感。`;
  }
  if (title.includes('實作') || title.includes('核心亮點')) {
    return `加入器材操作聲、輕微碰觸聲與老師指導的現場感，配樂節奏略微推進但不搶畫面。`;
  }
  if (title.includes('證照') || title.includes('資源')) {
    return `保留乾淨的器材細節聲與短促轉場音，讓專業設備、證照或成果展示更有質感。`;
  }
  if (title.includes('出路') || title.includes('未來')) {
    return `配樂略為開闊，加入明亮轉場音與自然環境聲，帶出從校園走向職涯的期待感。`;
  }
  if (title.includes('情感')) {
    return `降低配樂密度，保留笑聲、討論聲與自然互動聲，呈現親切、被支持的氛圍。`;
  }
  if (title.includes('整理') || title.includes('回顧')) {
    return `配樂節奏稍快，搭配輕微節拍與乾淨剪輯轉場音，協助回顧重點。`;
  }
  if (title.includes('收束') || title.includes('行動')) {
    return `${baseMusic}收束，加入柔和尾音或短版品牌聲音識別，讓結尾清楚但不誇張。`;
  }
  return `${baseMusic}作為底層，搭配與畫面一致的環境聲，音量保持自然。`;
};

const buildShotPlan = (title: string, camera: string) => {
  if (title.includes('開場') || title.includes('第一印象')) {
    return `以遠景或廣角建立校園與學習空間，讓觀眾先理解環境，再用緩慢推進帶出主體；運鏡採用 ${camera}`;
  }
  if (title.includes('定位')) {
    return `以中遠景呈現教學場域與學生位置關係，再用橫移鏡頭帶出空間層次；運鏡採用 ${camera}`;
  }
  if (title.includes('實作') || title.includes('核心亮點')) {
    return `以中景呈現學生實作流程，穿插手部操作、器材細節與老師回饋的近景特寫；運鏡採用 ${camera}`;
  }
  if (title.includes('證照') || title.includes('資源')) {
    return `以設備、證照、作品或成果的局部特寫為主，搭配學生操作的中近景，讓專業感更具體；運鏡採用 ${camera}`;
  }
  if (title.includes('出路') || title.includes('未來')) {
    return `以轉場鏡頭連結校內學習與未來職涯想像，可使用走廊、實習場域或成果展示的中遠景；運鏡採用 ${camera}`;
  }
  if (title.includes('情感')) {
    return `以中近景捕捉學生、老師與同儕互動，重點放在表情、眼神與自然肢體語言；運鏡採用 ${camera}`;
  }
  if (title.includes('整理') || title.includes('回顧')) {
    return `以快速但清楚的蒙太奇串接前面亮點，交替使用中景、特寫與環境鏡頭增加節奏；運鏡採用 ${camera}`;
  }
  if (title.includes('收束') || title.includes('行動')) {
    return `以穩定中景或中近景收束人物與科系記憶，背景保持乾淨，讓畫面有明確結尾；運鏡採用 ${camera}`;
  }
  return `依此分鏡主題安排不同於前後鏡頭的景別，交替使用環境中景、操作近景與細節特寫；運鏡採用 ${camera}`;
};

const cleanText = (value: string) =>
  value.replace(/\s+/g, ' ').replace(/[^\u4e00-\u9fffA-Za-z0-9，。！？、：；（）(),.:\- ]/g, '').trim().slice(0, 1600);

const handleWheelScroll = (event: WheelEvent<HTMLElement>) => {
  const element = event.currentTarget;
  if (element.scrollHeight <= element.clientHeight) return;

  event.preventDefault();
  event.stopPropagation();
  element.scrollTop += event.deltaY;
};

const extractPdfText = (decoded: string) => {
  const matches = [...decoded.matchAll(/\(([^()]{3,120})\)/g)].map((match) => match[1].replace(/\\[nrtbf()]/g, ' ')).join(' ');
  return cleanText(matches);
};

const extractLooseWordText = (decoded: string) => cleanText(decoded.replace(/<[^>]+>/g, ' '));

type Shot = {
  time: string;
  title: string;
  purpose: string;
  evidence: string;
  visual: string;
  camera: string;
  voiceover: string;
  sound: string;
  transition: string;
  generation: string;
  imagePrompt: string;
  videoPrompt: string;
};

type ResultTab = 'brief' | 'storyboard' | 'edit';

const ResultTabButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    className="aivp-focus"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    style={{
      border: `1px solid ${active ? palette.accent : palette.line}`,
      background: active ? '#eaf1ff' : palette.surface,
      color: active ? palette.accent : palette.muted,
      borderRadius: 10,
      padding: '10px 16px',
      fontSize: 17,
      fontWeight: 850,
      cursor: 'pointer',
    }}
  >
    {label}
  </button>
);

const DecisionRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ padding: '10px 0', borderBottom: `1px solid ${palette.line}` }}>
    <div style={{ fontSize: 15, color: palette.muted }}>{label}</div>
    <div style={{ marginTop: 3, fontSize: 18, lineHeight: 1.35, fontWeight: 800 }}>{value}</div>
  </div>
);

const WorkspaceIntro = ({ title, body }: { title: string; body: string }) => (
  <div style={{ padding: '14px 16px', borderRadius: 13, background: palette.surfaceSoft, border: `1px solid ${palette.line}` }}>
    <div style={{ fontSize: 20, fontWeight: 900, color: palette.inkBlue }}>{title}</div>
    <div style={{ marginTop: 5, fontSize: 17, lineHeight: 1.42, color: palette.muted }}>{body}</div>
  </div>
);

const CheckRow = ({ text, checked, onChange }: { text: string; checked: boolean; onChange: () => void }) => (
  <label className="aivp-focus" style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 10, alignItems: 'start', padding: '10px 0', borderBottom: `1px solid ${palette.line}`, cursor: 'pointer' }}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      style={{ width: 20, height: 20, accentColor: palette.accent, margin: '1px 0 0' }}
    />
    <span style={{ fontSize: 17, lineHeight: 1.42, color: checked ? palette.green : palette.text, fontWeight: checked ? 850 : 500 }}>{text}</span>
  </label>
);

const ProductionPhase = ({ number, title, body, accent }: { number: string; title: string; body: string; accent: string }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '46px 1fr', gap: 13, alignItems: 'start', padding: 14, borderRadius: 13, background: 'rgba(255,255,255,0.08)' }}>
    <div style={{ width: 38, height: 38, borderRadius: 11, background: accent, color: palette.inkBlue, display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 950 }}>{number}</div>
    <div>
      <div style={{ fontSize: 20, fontWeight: 900 }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 16, lineHeight: 1.4, color: '#d9e6fb' }}>{body}</div>
    </div>
  </div>
);

const getStepIssue = (step: StepId, data: PlannerState) => {
  if (step === 'basics' && (!data.school.trim() || !data.department.trim() || !data.topic.trim())) return '請先完成學校、科系與影片主題。';
  if (step === 'review' && (!data.positioning.trim() || !data.evidence.trim() || !data.sceneNotes.trim())) return '請確認定位、畫面證據與可拍攝場景。';
  if (step === 'strategy' && (!data.coreMessage.trim() || !data.desiredAction.trim())) return '請完成核心訊息與觀眾下一步。';
  if (step === 'highlights' && data.highlights.length !== 3) return `請選擇剛好 3 個畫面證據，目前已選 ${data.highlights.length} 個。`;
  return '';
};

const ProgressItem = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
  <div style={{ height: 12, borderRadius: 99, background: active || done ? palette.accent : palette.line }} title={label} />
);

const TakeawayCard = ({ title, body }: { title: string; body: string }) => (
  <div style={{ background: palette.surfaceSoft, border: `1px solid ${palette.line}`, borderRadius: 14, padding: 16 }}>
    <div style={{ fontSize: 20, color: palette.accent, fontWeight: 900 }}>{title}</div>
    <div style={{ marginTop: 8, color: palette.muted, fontSize: 18, lineHeight: 1.42 }}>{body}</div>
  </div>
);

const ProblemCard = ({ title, body }: { title: string; body: string }) => (
  <div style={{ background: palette.surfaceSoft, border: `1px solid ${palette.line}`, borderRadius: 14, padding: 18 }}>
    <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.25 }}>{title}</div>
    <div style={{ marginTop: 9, color: palette.muted, fontSize: 18, lineHeight: 1.42 }}>{body}</div>
  </div>
);

const PreviewCard = ({ title, body, dark = false }: { title: string; body: string; dark?: boolean }) => (
  <div style={{ background: dark ? 'rgba(255,255,255,0.08)' : palette.surface, borderRadius: 16, padding: 18, border: dark ? '1px solid rgba(255,255,255,0.14)' : `1px solid ${palette.line}` }}>
    <div style={{ fontSize: 18, color: dark ? '#b9d3ff' : palette.muted, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 20, lineHeight: 1.42 }}>{body}</div>
  </div>
);

const TinySummary = ({ text }: { text: string }) => (
  <div style={{ fontSize: 18, lineHeight: 1.38, color: palette.muted, background: palette.soft, borderRadius: 12, padding: 12 }}>{text}</div>
);

const StatusCard = ({ status, message }: { status: FileStatus; message: string }) => {
  const colors =
    status === 'ok'
      ? { bg: palette.greenSoft, text: palette.green, title: '讀取完成' }
      : status === 'error'
        ? { bg: palette.redSoft, text: palette.red, title: '需要改用文字' }
        : status === 'reading'
          ? { bg: palette.amberSoft, text: palette.amber, title: '讀取中' }
          : { bg: palette.surface, text: palette.muted, title: '檔案狀態' };
  return (
    <div style={{ border: `1px solid ${palette.line}`, background: colors.bg, borderRadius: 14, padding: 20 }}>
      <div style={{ fontSize: 20, fontWeight: 850, color: colors.text }}>{colors.title}</div>
      <p style={{ fontSize: 18, lineHeight: 1.45, margin: '8px 0 0', color: colors.text }}>{message}</p>
    </div>
  );
};

const Badge = ({ children }: { children: ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 99, background: '#eaf1ff', color: palette.accent, padding: '8px 13px', fontSize: 18, fontWeight: 850 }}>{children}</span>
);

const InfoPill = ({ label, value }: { label: string; value: string }) => (
  <div style={{ padding: 15, background: palette.soft, borderRadius: 12 }}>
    <div style={{ fontSize: 16, color: palette.muted }}>{label}</div>
    <div style={{ fontSize: 19, fontWeight: 850, marginTop: 4 }}>{value}</div>
  </div>
);

const RecapRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 14, padding: 15, borderRadius: 13, background: palette.soft }}>
    <div style={{ fontSize: 19, color: palette.accent, fontWeight: 900 }}>{label}</div>
    <div style={{ fontSize: 19, color: palette.muted, lineHeight: 1.35 }}>{value}</div>
  </div>
);

const Detail = ({ label, value, actionLabel, onAction }: { label: string; value: string; actionLabel?: string; onAction?: () => void }) => (
  <div style={{ background: palette.soft, borderRadius: 12, padding: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 5 }}>
      <div style={{ fontSize: 16, color: palette.muted }}>{label}</div>
      {actionLabel && onAction && <button className="aivp-focus" onClick={onAction} style={tinyButton}>{actionLabel}</button>}
    </div>
    <div style={{ fontSize: 16, lineHeight: 1.35 }}>{value}</div>
  </div>
);

const appShell: CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'linear-gradient(135deg, #f7f9fc 0%, #eef4ff 55%, #ffffff 100%)',
  color: palette.text,
  fontFamily: font.body,
  padding: 54,
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const card: CSSProperties = {
  background: palette.surface,
  border: `1px solid ${palette.line}`,
  borderRadius: 20,
  boxSizing: 'border-box',
};

const darkPanel: CSSProperties = {
  borderRadius: 22,
  background: palette.inkBlue,
  color: '#ffffff',
  padding: 30,
};

const heroImage: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.18)',
};

const fieldLabel: CSSProperties = {
  display: 'block',
  fontSize: 20,
  fontWeight: 850,
  marginBottom: 8,
};

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: `1px solid ${palette.line}`,
  borderRadius: 14,
  padding: '17px 19px',
  fontSize: 23,
  fontFamily: font.body,
  color: palette.text,
  background: palette.surface,
};

const optionStyle: CSSProperties = {
  border: `1px solid ${palette.line}`,
  background: palette.surface,
  color: palette.text,
  borderRadius: 14,
  padding: '18px 20px',
  textAlign: 'left',
  fontSize: 21,
  lineHeight: 1.35,
  cursor: 'pointer',
};

const ghostButton: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: palette.accent,
  fontSize: 21,
  fontWeight: 850,
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left',
};

const smallButton: CSSProperties = {
  border: `1px solid ${palette.line}`,
  background: palette.surface,
  color: palette.accent,
  borderRadius: 10,
  padding: '8px 10px',
  minHeight: 70,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1.18,
  fontSize: 16,
  fontWeight: 850,
  cursor: 'pointer',
};

const tinyButton: CSSProperties = {
  border: `1px solid ${palette.lineStrong}`,
  background: palette.surface,
  color: palette.accent,
  borderRadius: 9,
  padding: '7px 10px',
  fontSize: 15,
  fontWeight: 850,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const smallDarkButton: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.1)',
  color: '#ffffff',
  borderRadius: 10,
  padding: '11px 14px',
  fontSize: 18,
  fontWeight: 850,
  cursor: 'pointer',
};

const copyButton: CSSProperties = {
  border: `1px solid ${palette.lineStrong}`,
  background: palette.surface,
  color: palette.accent,
  borderRadius: 11,
  padding: '11px 14px',
  fontSize: 18,
  fontWeight: 850,
  cursor: 'pointer',
};

export const meta: SlideMeta = {
  title: 'AI 影像創作引導室',
  createdAt: '2026-06-22T07:01:32.308Z',
};

export default [App] satisfies Page[];
