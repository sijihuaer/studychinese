// 把 拆书.md 编译成单页 index.html
// 用法：npm run build
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, '拆书.md');
const out = path.join(root, 'index.html');

const md = fs.readFileSync(src, 'utf8');

// 让 ```mermaid 代码块变成 mermaid 能识别的容器
marked.use({
  renderer: {
    code(token) {
      const text = typeof token === 'object' ? token.text : token;
      const lang = typeof token === 'object' ? token.lang : arguments[1];
      if ((lang || '').trim() === 'mermaid') return `<div class="mermaid">${text}</div>`;
      return false;
    },
  },
  gfm: true,
  breaks: false,
});

const slug = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{Script=Han}a-z0-9\s-]/gu, '')
    .replace(/\s+/g, '-');

let body = marked.parse(md);

// 导航里用的短标签（标题本身保持完整）
const SHORT = {
  '一分钟看懂': '一分钟',
  '全书骨架：九级台阶': '九级台阶',
  '三条贯穿全书的原则': '三条原则',
  '九章逐章拆解': '九章拆解',
  '五张随手清单': '五张清单',
  '金句摘录': '金句',
  '怎么用这本书': '怎么用',
};

// 给 h2 加锚点，同时收集顶部导航
const nav = [];
body = body.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (_m, attrs, text) => {
  const id = slug(text);
  const plain = text.replace(/<[^>]+>/g, '').trim();
  nav.push({ id, text: plain, short: SHORT[plain] || plain });
  return `<h2${attrs} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${text}</h2>`;
});

// 表格横向滚动包裹
body = body.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');

// 章节里"对应原文"那一行
body = body.replace(/<p class="src">/g, '<p class="src">📖 ');

const navHtml = nav
  .map((item, i) => `<a href="#${item.id}" title="${item.text}"><i>${String(i + 1).padStart(2, '0')}</i>${item.short}</a>`)
  .join('');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>《语文高效学习法》拆书 · 一页看懂</title>
<meta name="description" content="申怡《语文高效学习法》拆书笔记：九级台阶、九章要点、五张清单，配结构图。" />
<meta name="theme-color" content="#1f6f5c" />
<style>
  :root{
    --ink:#1b1f23; --ink-2:#5b6470; --ink-3:#8b939e;
    --paper:#f7f4ee; --card:#fffdf9; --line:#e7e0d3;
    --accent:#1f6f5c; --accent-soft:#eaf3ef; --warm:#c2410c; --warm-soft:#fdf1e9;
    --serif:"Noto Serif SC","Source Han Serif SC","Songti SC","SimSun",serif;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei","PingFang SC","Hiragino Sans GB",sans-serif;
    --mono:"Cascadia Code",Consolas,Monaco,monospace;
    --maxw:880px; --r:14px;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth; scroll-padding-top:96px}
  body{
    margin:0; background:var(--paper); color:var(--ink);
    font-family:var(--sans); font-size:16.5px; line-height:1.9;
    -webkit-font-smoothing:antialiased;
    background-image:radial-gradient(circle at 12% 0%,#fff9ef 0,transparent 46%),
                     radial-gradient(circle at 88% 6%,#eef4f1 0,transparent 42%);
    background-attachment:fixed;
  }
  /* 顶部进度条 */
  #bar{position:fixed;left:0;top:0;height:3px;width:0;background:linear-gradient(90deg,var(--accent),#78b9a3);z-index:60;transition:width .1s linear}
  /* 顶栏 */
  header.top{position:sticky;top:0;z-index:50;backdrop-filter:blur(10px);
    background:rgba(247,244,238,.86);border-bottom:1px solid var(--line)}
  .top-in{max-width:var(--maxw);margin:0 auto;padding:10px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
  .brand{font-family:var(--serif);font-weight:700;letter-spacing:.02em;font-size:15px;color:var(--accent);white-space:nowrap}
  nav.toc{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;flex:1}
  nav.toc::-webkit-scrollbar{display:none}
  nav.toc a{display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;
    color:var(--ink-2);text-decoration:none;font-size:13.5px;white-space:nowrap;transition:.18s}
  nav.toc a i{font-style:normal;font-family:var(--mono);font-size:11px;color:var(--ink-3)}
  nav.toc a:hover{background:#fff;color:var(--ink)}
  nav.toc a.on{background:var(--accent);color:#fff}
  nav.toc a.on i{color:rgba(255,255,255,.7)}
  /* 主体 */
  main{max-width:var(--maxw);margin:0 auto;padding:34px 22px 80px}
  .md>*:first-child{margin-top:0}
  /* 封面 */
  .hero{background:linear-gradient(160deg,#fffdf9,#f3f7f4);border:1px solid var(--line);
    border-radius:22px;padding:38px 34px 30px;margin-bottom:44px;
    box-shadow:0 18px 40px -28px rgba(31,111,92,.45),0 1px 0 #fff inset}
  .hero .kicker{margin:0 0 10px;font-size:12.5px;letter-spacing:.22em;color:var(--accent);font-weight:600}
  .hero h1{font-family:var(--serif);font-size:clamp(30px,6vw,46px);line-height:1.3;margin:0 0 10px;letter-spacing:.03em}
  .hero .byline{margin:0 0 21px;color:var(--ink-2);font-size:14.5px;letter-spacing:.06em}
  .hero .lead{margin:0;font-size:17px;color:#39424c;line-height:1.85}
  .stats{display:flex;gap:14px;flex-wrap:wrap;margin-top:26px;padding-top:22px;border-top:1px dashed var(--line)}
  .stat{flex:1 1 150px;display:flex;align-items:baseline;gap:9px}
  .stat b{font-family:var(--serif);font-size:30px;color:var(--accent);line-height:1}
  .stat span{font-size:12.5px;color:var(--ink-2);line-height:1.5}
  /* 标题 */
  h2{font-family:var(--serif);font-size:clamp(23px,4vw,30px);line-height:1.45;
    margin:64px 0 22px;padding-bottom:12px;border-bottom:2px solid var(--ink);
    letter-spacing:.03em;position:relative}
  h2 .anchor{position:absolute;left:-1.2em;opacity:0;text-decoration:none;color:var(--ink-3);font-weight:400}
  h2:hover .anchor{opacity:1}
  h3{font-family:var(--serif);font-size:21px;line-height:1.6;margin:46px 0 14px;
    padding-left:14px;border-left:4px solid var(--accent);letter-spacing:.02em}
  h4{font-family:var(--serif);font-size:16.5px;margin:0 0 6px;letter-spacing:.02em}
  p{margin:0 0 16px}
  a{color:var(--accent);text-underline-offset:3px}
  strong{color:#0f1419;background:linear-gradient(transparent 62%,#d8ecdf 62%);padding:0 1px}
  /* 列表 */
  ul,ol{padding-left:1.35em;margin:0 0 18px}
  li{margin:6px 0}
  li::marker{color:var(--accent)}
  /* 引用 */
  blockquote{margin:26px 0;padding:18px 22px;background:var(--card);
    border-left:4px solid var(--warm);border-radius:0 var(--r) var(--r) 0;
    font-family:var(--serif);font-size:16.5px;color:#3b4249;box-shadow:0 10px 24px -22px rgba(0,0,0,.5)}
  blockquote p:last-child{margin:0}
  blockquote em{color:var(--ink-2)}
  /* 表格 */
  .table-wrap{margin:22px 0;overflow-x:auto;border:1px solid var(--line);border-radius:var(--r);background:var(--card)}
  table{border-collapse:collapse;width:100%;font-size:14.8px;min-width:520px}
  th,td{padding:11px 14px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
  th{background:var(--accent-soft);color:#15564a;font-weight:600;white-space:nowrap}
  tr:last-child td{border-bottom:none}
  tbody tr:hover{background:#fbf8f2}
  /* 卡片 */
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:14px;margin:24px 0 8px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);
    padding:18px 18px 6px;box-shadow:0 12px 26px -26px rgba(0,0,0,.55)}
  .card h4{color:var(--accent)}
  .card p{font-size:14.4px;color:var(--ink-2);line-height:1.8;margin-bottom:10px}
  /* 图 */
  .mermaid{background:var(--card);border:1px solid var(--line);border-radius:var(--r);
    padding:18px 4px;margin:26px 0;overflow-x:auto;text-align:center;
    box-shadow:0 12px 26px -26px rgba(0,0,0,.55)}
  .mermaid svg{display:block;margin:0 auto;max-width:none;height:auto}
  @media (max-width:720px){
    .mermaid{position:relative;padding-bottom:26px}
    .mermaid::after{content:"← 左右滑动看图 →";position:absolute;bottom:6px;left:0;right:0;
      font-size:11.5px;color:var(--ink-3);letter-spacing:.08em}
  }
  /* 对应原文 */
  .src{margin:14px 0 0;font-size:13.5px;color:var(--ink-3)}
  .src a{color:var(--accent);text-decoration:none;border-bottom:1px dashed #a9cec2;padding-bottom:1px}
  .src a:hover{border-bottom-style:solid}
  /* 清单 */
  .checklist{background:#fff;border:1px solid var(--line);border-radius:18px;padding:8px 26px 20px}
  .checklist h3{font-size:17.5px;border-left:none;padding-left:0;margin:26px 0 10px;
    display:flex;align-items:center;gap:10px}
  .checklist h3::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--accent);flex:none}
  .checklist ul,.checklist ol{margin-bottom:10px}
  .checklist li{font-size:15.2px}
  /* 折叠 */
  details{margin:34px 0 0;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:16px 22px}
  summary{cursor:pointer;font-family:var(--serif);font-size:16.5px;color:var(--accent);outline:none}
  details[open] summary{margin-bottom:12px;padding-bottom:10px;border-bottom:1px dashed var(--line)}
  details li{font-size:14.6px;color:var(--ink-2)}
  /* 页脚 */
  footer{max-width:var(--maxw);margin:0 auto;padding:0 22px 60px;color:var(--ink-3);font-size:13.5px;text-align:center}
  footer a{color:var(--ink-2)}
  .toTop{position:fixed;right:20px;bottom:24px;width:42px;height:42px;border-radius:50%;
    border:1px solid var(--line);background:#fff;color:var(--accent);cursor:pointer;
    box-shadow:0 10px 24px -14px rgba(0,0,0,.5);font-size:16px;opacity:0;pointer-events:none;transition:.2s}
  .toTop.show{opacity:1;pointer-events:auto}
  @media (max-width:720px){
    body{font-size:16px}
    main{padding:22px 16px 60px}
    .hero{padding:28px 20px 22px;border-radius:18px}
    h2{margin-top:48px}
    h3{font-size:19px}
    .anchor{display:none}
    .top-in{padding:8px 14px;gap:10px}
    .brand{font-size:13.5px}
    nav.toc{flex-wrap:wrap;overflow:visible;row-gap:2px}
    nav.toc a{font-size:12.5px;padding:4px 8px}
  }
  @media print{
    header.top,#bar,.toTop,.anchor{display:none}
    body{background:#fff}
    .hero{box-shadow:none}
    h2{page-break-after:avoid}
  }
</style>
</head>
<body>
<div id="bar"></div>

<header class="top">
  <div class="top-in">
    <span class="brand" title="《语文高效学习法》拆书笔记">拆书 · 语文高效学习法</span>
    <nav class="toc">${navHtml}</nav>
  </div>
</header>

<main>
  <article class="md">
${body}
  </article>
</main>

<footer>
  <p>本页是《语文高效学习法》（申怡 著）的读书笔记，仅作个人学习交流 · 请勿商用</p>
  <p><a href="./语文高效学习法_全本.md">查看全书 Markdown 原文</a></p>
</footer>

<button class="toTop" id="toTop" title="回到顶部" aria-label="回到顶部">↑</button>

<script src="./assets/mermaid.min.js"></script>
<script>
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    fontFamily: 'inherit',
    themeVariables: {
      primaryColor: '#eaf3ef',
      primaryTextColor: '#1b1f23',
      primaryBorderColor: '#1f6f5c',
      lineColor: '#7d8c86',
      secondaryColor: '#fdf1e9',
      tertiaryColor: '#fffdf9',
      fontSize: '15px'
    },
    flowchart: { curve: 'basis', htmlLabels: true, padding: 14, useMaxWidth: false, wrappingWidth: 260 }
  });
  mermaid.run({ querySelector: '.mermaid', suppressErrors: true });
</script>
<script>
  // 阅读进度
  const bar = document.getElementById('bar');
  const top = document.getElementById('toTop');
  const links = [...document.querySelectorAll('nav.toc a')];
  const heads = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  function onScroll(){
    const h = document.documentElement;
    const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    bar.style.width = (p * 100).toFixed(1) + '%';
    top.classList.toggle('show', h.scrollTop > 600);
    let idx = 0;
    heads.forEach((el, i) => { if (el.getBoundingClientRect().top < 140) idx = i; });
    links.forEach((a, i) => a.classList.toggle('on', i === idx));
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
</script>
</body>
</html>
`;

fs.writeFileSync(out, html, 'utf8');
console.log(`✔ index.html  ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB  ·  ${nav.length} 个章节锚点`);
