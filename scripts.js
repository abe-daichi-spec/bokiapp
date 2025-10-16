/* 簿記 商店経営RPG MVP スクリプト（Hotfix 2025-10-16） */
const STATE = {
  user: null,
  questions: [],
  quizSet: [],
  idx: 0,
  correct: 0,
  combo: 0,
  earnedXp: 0,
  weeklyPoints: 0,
  ready: false,
};

const $ = (sel) => document.querySelector(sel);
const el = (tag, attrs={}) => Object.assign(document.createElement(tag), attrs);

function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = el('div', { id: 'toast' });
    t.style.position = 'fixed';
    t.style.left = '50%';
    t.style.bottom = '24px';
    t.style.transform = 'translateX(-50%)';
    t.style.background = '#222';
    t.style.color = '#fff';
    t.style.padding = '8px 12px';
    t.style.borderRadius = '8px';
    t.style.zIndex = '9999';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

function loadLocal() {
  const wp = Number(localStorage.getItem('weeklyPoints') || 0);
  STATE.weeklyPoints = wp;
  document.getElementById('weeklyPoints').textContent = wp;
  document.getElementById('todayXp').textContent = Number(localStorage.getItem('todayXp') || 0);
  document.getElementById('combo').textContent = 0;
}

function saveWeeklyPoints() {
  localStorage.setItem('weeklyPoints', String(STATE.weeklyPoints));
}

// CSV 読み込み（GitHub Pagesのパス問題に強い相対指定＆エラーハンドリング）
async function loadQuestions() {
  const startBtn = document.getElementById('startQuizBtn');
  startBtn.disabled = true;
  startBtn.textContent = '読み込み中…';
  try {
    const res = await fetch('./assets/questions.csv', { cache: 'no-store' });
    if (!res.ok) throw new Error(`CSV not found (${res.status})`);
    const text = await res.text();
    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        complete: (p) => {
          const rows = p.data.filter(r => (r.id && String(r.id).trim().length > 0));
          resolve(rows);
        },
      });
    });
  } catch (e) {
    console.error(e);
    toast('問題データの読み込みに失敗しました。assets/questions.csv を確認してください。');
    return [];
  } finally {
    // 続きは呼び出し元で制御
  }
}

function pick10(arr) {
  const pool = [...arr];
  const out = [];
  while (out.length < 10 && pool.length) {
    out.push(pool.splice(Math.floor(Math.random()*pool.length), 1)[0]);
  }
  return out;
}

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.querySelector(id).classList.remove('hidden');
}

function startQuiz() {
  if (!STATE.ready) {
    toast('まだ準備中です。数秒後にお試しください。');
    return;
  }
  if (!STATE.questions.length) {
    toast('問題データが見つかりません。assets/questions.csv をアップしてください。');
    return;
  }
  STATE.quizSet = pick10(STATE.questions);
  if (!STATE.quizSet.length) {
    toast('有効な問題がありません（CSVのid列をご確認ください）。');
    return;
  }
  STATE.idx = 0;
  STATE.correct = 0;
  STATE.combo = 0;
  STATE.earnedXp = 0;
  renderQuestion();
  showView('#quizView');
}

function renderQuestion() {
  const q = STATE.quizSet[STATE.idx];
  document.getElementById('qProgress').textContent = `${STATE.idx+1} / ${STATE.quizSet.length}`;
  document.getElementById('qTag').textContent = q['タグ'] || '';
  document.getElementById('qText').textContent = q['問題文'] || '(問題文が空です)';
  document.getElementById('feedback').textContent = '';
  document.getElementById('nextBtn').disabled = true;

  const choicesWrap = document.getElementById('choices');
  choicesWrap.innerHTML = '';
  const labels = ['A','B','C','D'];
  labels.forEach((lab) => {
    const text = q['選択肢' + lab];
    if (!text) return;
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.textContent = text;
    btn.addEventListener('click', () => onAnswer(lab, btn, q));
    choicesWrap.appendChild(btn);
  });
}

function onAnswer(lab, btn, q) {
  const correct = q['正解'];
  const choiceEls = document.querySelectorAll('.choice');
  choiceEls.forEach(e => e.disabled = true);

  if (lab === correct) {
    btn.classList.add('correct');
    STATE.correct += 1;
    STATE.combo += 1;
    const mult = STATE.combo >= 10 ? 2.0 : STATE.combo >= 5 ? 1.5 : 1.0;
    const gained = Math.round(10 * mult);
    STATE.earnedXp += gained;
    document.getElementById('feedback').textContent = `正解！ +${gained} XP（コンボ×${mult.toFixed(1)}）`;
  } else {
    btn.classList.add('wrong');
    STATE.combo = 0;
    document.getElementById('feedback').textContent = `不正解… 解説：${q['解説'] || '—'}`;
  }

  document.querySelectorAll('.choice').forEach(e => {
    if (e.textContent === q['選択肢' + correct]) e.classList.add('correct');
  });

  document.getElementById('combo').textContent = STATE.combo;
  document.getElementById('nextBtn').disabled = false;
}

function nextQuestion() {
  STATE.idx += 1;
  if (STATE.idx >= STATE.quizSet.length) {
    document.getElementById('correctCount').textContent = STATE.correct;
    document.getElementById('earnedXp').textContent = STATE.earnedXp;
    STATE.weeklyPoints += STATE.earnedXp;
    saveWeeklyPoints();
    document.getElementById('finalWeeklyPoints').textContent = STATE.weeklyPoints;
    const today = Number(localStorage.getItem('todayXp') || 0) + STATE.earnedXp;
    localStorage.setItem('todayXp', String(today));
    document.getElementById('todayXp').textContent = today;
    showView('#resultView');
  } else {
    renderQuestion();
  }
}

function quitQuiz() { showView('#homeView'); }
function backHome() { loadLocal(); showView('#homeView'); }

function initAuth() {
  const btn = document.getElementById('loginBtn');
  btn.addEventListener('click', () => {
    alert('Googleログインは後で有効化します（firebase.config.js を設定してください）。');
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  loadLocal();
  initAuth();
  try {
    STATE.questions = await loadQuestions();
  } finally {
    STATE.ready = true;
    const startBtn = document.getElementById('startQuizBtn');
    startBtn.disabled = false;
    startBtn.textContent = 'クエストを始める';
  }
  document.getElementById('reviewCount').textContent = 0;
  document.getElementById('startQuizBtn').addEventListener('click', startQuiz);
  document.getElementById('nextBtn').addEventListener('click', nextQuestion);
  document.getElementById('quitBtn').addEventListener('click', quitQuiz);
  document.getElementById('backHomeBtn').addEventListener('click', backHome);
});