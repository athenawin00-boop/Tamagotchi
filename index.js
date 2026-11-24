// 캐릭터 다마고치 — 지금 연 캐릭터를 다마고치처럼 돌보는 실리태번 확장
const MODULE = 'char_tamagotchi';
const PROMPT_KEY = 'char_tamagotchi_state';
const ctx = () => SillyTavern.getContext();

const DEFAULTS = {
    enabled: true,
    showWindow: true,
    aiReactions: true,
    profileId: '',
    maxTokens: 300,
    lang: '한국어',
    injectState: true,
    chatAffection: true,
    decaySpeed: 1,
    offlineCapHours: 12,
    alerts: true,
    romance: true,
    reunion: true,
    opacity: 100,
    window: { x: null, y: null, w: 300, h: null, collapsed: false },
    pets: {},
};

const STATS = [
    { k: 'hunger', label: '포만감', fa: 'fa-utensils', color: '#eda55d' },
    { k: 'mood', label: '기분', fa: 'fa-face-smile', color: '#e9c04f' },
    { k: 'energy', label: '에너지', fa: 'fa-bolt', color: '#7fcf8a' },
    { k: 'clean', label: '청결', fa: 'fa-droplet', color: '#62b6ee' },
    { k: 'bond', label: '친밀도', fa: 'fa-heart', color: '#ec6a8c' },
];

const ACTIONS = [
    { k: 'feed', label: '밥', fa: 'fa-utensils' },
    { k: 'play', label: '놀기', fa: 'fa-gamepad' },
    { k: 'sleep', label: '재우기', fa: 'fa-moon' },
    { k: 'wash', label: '씻기', fa: 'fa-shower' },
    { k: 'med', label: '약', fa: 'fa-capsules' },
    { k: 'pet', label: '쓰담', fa: 'fa-hand-holding-heart' },
    { k: 'hand', label: '손잡기', fa: 'fa-hand-holding-hand', min: 20 },
    { k: 'hug', label: '포옹', fa: 'fa-hands', min: 40 },
    { k: 'kiss', label: '뽀뽀', fa: 'fa-face-kiss-wink-heart', min: 60, romance: true },
    { k: 'gift', label: '선물', fa: 'fa-gift' },
];

const GIFTS = [
    { id: 'sweets', name: '달콤한 디저트', fa: 'fa-cookie-bite' },
    { id: 'coffee', name: '커피', fa: 'fa-mug-hot' },
    { id: 'liquor', name: '술 한 병', fa: 'fa-wine-bottle' },
    { id: 'spicy', name: '매운 음식', fa: 'fa-pepper-hot' },
    { id: 'flowers', name: '꽃다발', fa: 'fa-spa' },
    { id: 'letter', name: '손편지', fa: 'fa-envelope' },
    { id: 'book', name: '책', fa: 'fa-book' },
    { id: 'plush', name: '인형', fa: 'fa-ghost' },
    { id: 'perfume', name: '향수', fa: 'fa-spray-can-sparkles' },
    { id: 'accessory', name: '액세서리', fa: 'fa-gem' },
    { id: 'game', name: '게임', fa: 'fa-gamepad' },
    { id: 'music', name: '음반', fa: 'fa-music' },
];
const GIFTS_PER_DAY = 3;

const TIERS_LOVE = [[0, '낯가림'], [20, '호감'], [40, '썸'], [60, '연인'], [80, '천생연분']];
const TIERS_FRIEND = [[0, '낯가림'], [20, '아는 사이'], [40, '친한 사이'], [60, '단짝'], [80, '소울메이트']];
const tiers = () => (S?.romance === false ? TIERS_FRIEND : TIERS_LOVE);

// 모델을 안 쓰거나 실패했을 때의 기본 대사(특정 작품·캐릭터와 무관한 일반 표현)
const LINES = {
    hatch: ['…안녕? 네가 날 깨운 거야?', '눈부셔… 잘 부탁해!'],
    feed: ['냠냠… 맛있다!', '고마워, 배고팠어.', '우물우물… 한 입 더?'],
    feedFull: ['배불러… 더는 못 먹어.', '이미 배부르다니까.'],
    play: ['한 판 더 하자!', '헤헤, 재밌었어.', '이번엔 내가 이길 거야!'],
    playTired: ['너무 피곤해… 나중에 놀자.', '하암… 지금은 좀 쉬고 싶어.'],
    sleep: ['잘 자… 깨우지 마.', '으음… 졸려…'],
    wakeGood: ['잘 잤다! 개운해.', '좋은 아침!'],
    wakeBad: ['으으… 더 잘 수 있었는데.', '왜 깨웠어…'],
    wash: ['뽀득뽀득! 개운해.', '앗 차가워…! 그래도 시원하다.'],
    pet: ['에헤헤…', '그거 좋아.', '…조금만 더.'],
    petSleep: ['(새근새근…)', '(뒤척뒤척…)'],
    med: ['써… 그래도 좀 나아졌어.', '고마워, 덕분에 살았다.'],
    medNone: ['나 안 아픈데?', '약은 아플 때 먹는 거야.'],
    talk: ['응응, 듣고 있어.', '그랬구나.', '너랑 얘기하는 거 좋아.'],
    hand: ['…손 따뜻하네.', '갑자기 왜, 싫다는 건 아니야.'],
    hug: ['…조금만 이러고 있자.', '따뜻하다.'],
    kiss: ['…! 갑자기 그러면 반칙이지.', '한 번 더 해도 돼.'],
    gift: ['나 주는 거야? 고마워.', '오, 잘 쓸게.'],
    giftLove: ['이거 내가 제일 좋아하는 건데! 어떻게 알았어?', '…진짜 감동이야. 고마워.'],
    giftBad: ['아… 고마워. 마음은 잘 받을게.', '음, 이건 좀… 그래도 고마워.'],
    reunion: ['왔어? 기다렸어.', '어, 왔네. 뭐 하다 왔어?'],
    reunionLong: ['…이제 와? 보고 싶었단 말이야.', '한참 안 보이더라. 좀 서운했어.'],
    tierUp: ['너랑 있으면… 전이랑은 좀 달라진 것 같아.', '우리, 꽤 가까워졌네.'],
    dress: ['어때, 잘 어울려?', '이 옷 편하네.', '흠, 나쁘지 않은데.'],
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));

// ───────── 스프라이트 ─────────
// 캐릭터 폴더의 tama 하위 폴더(characters/<이름>/tama/)에서 찾는다.
// 파일 이름: 상태-번호.png (eat-1.png), 옷별: 옷_상태-번호.png (hoodie_eat-1.png)
const POSES = ['idle', 'happy', 'love', 'shy', 'eat', 'full', 'play', 'wake', 'surprised', 'pout', 'hungry', 'sleepy', 'sick', 'sleep', 'hand', 'hug', 'kiss', 'gift', 'wave'];
const CHAIN = {
    idle: ['idle'], happy: ['happy', 'idle'], love: ['love', 'happy', 'idle'], shy: ['shy', 'love', 'idle'],
    eat: ['eat', 'happy', 'idle'], full: ['full', 'happy', 'idle'], play: ['play', 'happy', 'idle'],
    wake: ['wake', 'happy', 'idle'], surprised: ['surprised', 'idle'], pout: ['pout', 'idle'],
    hungry: ['hungry', 'pout', 'idle'], sleepy: ['sleepy', 'sleep', 'idle'], sick: ['sick', 'pout', 'idle'], sleep: ['sleep', 'idle'],
    hand: ['hand', 'shy', 'love', 'idle'], hug: ['hug', 'love', 'happy', 'idle'], kiss: ['kiss', 'shy', 'love', 'idle'],
    gift: ['gift', 'happy', 'idle'], wave: ['wave', 'wake', 'happy', 'idle'],
};
const ACTION_POSE = {
    hatch: 'happy', feed: 'eat', feedFull: 'full', play: 'play', playTired: 'sleepy', sleep: 'sleep',
    wakeGood: 'wake', wakeBad: 'pout', wash: 'happy', pet: 'love', petSleep: 'sleep', med: 'happy',
    medNone: 'surprised', talk: 'shy', dress: 'idle',
    hand: 'hand', hug: 'hug', kiss: 'kiss', gift: 'gift', giftLove: 'gift', giftBad: 'pout',
    reunion: 'wave', reunionLong: 'pout', tierUp: 'love',
};
const OUTFIT_NAMES = {
    hoodie: '후드티', pajama: '잠옷', painter: '작업복', varsity: '야구 점퍼', silk: '실크 셔츠', green: '초록 정장',
    suit: '정장', casual: '캐주얼', school: '교복', uniform: '유니폼', dress: '드레스', swim: '수영복', winter: '겨울옷', apron: '앞치마',
};
const outfitName = (id) => (id ? OUTFIT_NAMES[id] || id : '기본');

let S;
const state = {
    key: null, busy: false, tick: null, dragging: false,
    spr: { name: null, by: {}, outfits: [], count: 0 },
    pose: { key: '', src: '', at: 0 }, act: null,
};

// ───────── 설정 ─────────
function loadSettings() {
    const es = ctx().extensionSettings;
    es[MODULE] = es[MODULE] || {};
    S = es[MODULE];
    for (const [k, v] of Object.entries(DEFAULTS)) {
        if (S[k] === undefined) S[k] = structuredClone(v);
    }
    // 객체는 새로 만들지 않고 빠진 키만 채운다(참조 유지)
    for (const [k, v] of Object.entries(DEFAULTS.window)) {
        if (S.window[k] === undefined) S.window[k] = v;
    }
}
const save = () => ctx().saveSettingsDebounced();

// ───────── 펫 상태 ─────────
function currentChar() {
    const c = ctx();
    if (c.groupId) return null;
    const ch = c.characters?.[c.characterId];
    return ch?.avatar ? ch : null;
}

function newPet(ch) {
    const now = Date.now();
    return {
        name: ch.name, egg: true, born: now, last: now,
        hunger: 70, mood: 70, energy: 80, clean: 80, bond: 5,
        sleeping: false, sick: false,
        cd: {}, alerted: {}, chatDay: '', chatGain: 0,
        tierMax: 0, seen: now, giftDay: '', giftCount: 0, giftSeen: {}, tastes: null,
        log: [], line: '',
    };
}

function getPet() {
    const ch = currentChar();
    if (!ch) { state.key = null; return null; }
    state.key = ch.avatar;
    if (!S.pets[ch.avatar]) S.pets[ch.avatar] = newPet(ch);
    const p = S.pets[ch.avatar];
    p.name = ch.name;
    if (p.tierMax === undefined) p.tierMax = tierIdx(p.bond);
    if (!p.giftSeen) p.giftSeen = {};
    return p;
}

function tierIdx(bond) {
    let i = 0;
    tiers().forEach(([min], j) => { if (bond >= min) i = j; });
    return i;
}
const tierOf = (bond) => tiers()[tierIdx(bond)][1];

// 관계 단계가 처음으로 올랐는지 확인
function checkTierUp(p) {
    const idx = tierIdx(p.bond);
    if (p.tierMax === undefined) { p.tierMax = idx; return null; }
    if (idx <= p.tierMax) return null;
    p.tierMax = idx;
    const name = tiers()[idx][1];
    addLog(p, `관계가 '${name}'(으)로 깊어졌다`);
    toastr.success(`${p.name}와(과)의 관계가 '${name}' 단계가 됐어요.`, '캐릭터 다마고치', { timeOut: 6000 });
    return name;
}
const daysOf = (p) => Math.floor((Date.now() - p.born) / 864e5) + 1;

function addLog(p, text) {
    p.log.unshift({ t: Date.now(), text });
    if (p.log.length > 30) p.log.length = 30;
}

// 시간이 지나 줄어드는 수치
function applyDecay(p, now = Date.now()) {
    if (p.egg) { p.last = now; return; }
    let hrs = (now - p.last) / 3.6e6;
    p.last = now;
    if (!(hrs > 0)) return;
    hrs = Math.min(hrs, Number(S.offlineCapHours) || 12);
    const h = hrs * (Number(S.decaySpeed) || 0);
    if (!h) return;

    if (p.sleeping) {
        p.energy = clamp(p.energy + 25 * h);
        p.hunger = clamp(p.hunger - 2.5 * h);
        p.clean = clamp(p.clean - 1 * h);
        if (p.energy >= 100) {
            p.sleeping = false;
            addLog(p, '푹 자고 스스로 일어났다');
        }
    } else {
        p.energy = clamp(p.energy - 3 * h);
        p.hunger = clamp(p.hunger - 5 * h);
        p.clean = clamp(p.clean - 2.5 * h);
    }
    let moodLoss = 3;
    if (p.hunger < 20) moodLoss += 2;
    if (p.energy < 15) moodLoss += 1;
    if (p.sick) moodLoss *= 2;
    p.mood = clamp(p.mood - moodLoss * h);

    if (!p.sick && (p.hunger <= 0 || p.clean <= 0)) {
        p.sick = true;
        addLog(p, '몸이 안 좋아졌다');
        if (S.alerts) toastr.warning(`${p.name}이(가) 아파요. 약을 주세요.`, '캐릭터 다마고치');
    }
    if (p.sick || p.hunger <= 0 || p.clean <= 0) p.bond = clamp(p.bond - 0.5 * h);

    if (S.alerts) {
        const warn = { hunger: '배고파해요', energy: '졸려해요', clean: '씻고 싶어해요', mood: '시무룩해요' };
        for (const [k, msg] of Object.entries(warn)) {
            if (p[k] < 20 && !p.alerted[k] && !(k === 'energy' && p.sleeping)) {
                p.alerted[k] = true;
                toastr.info(`${p.name}이(가) ${msg}.`, '캐릭터 다마고치');
            } else if (p[k] >= 30) p.alerted[k] = false;
        }
    }
}

function needsCare(p) {
    if (!p || p.egg) return false;
    return p.sick || p.hunger < 20 || p.clean < 20 || p.mood < 20 || (p.energy < 20 && !p.sleeping);
}

function moodInfo(p) {
    if (p.egg) return { tone: 'calm', text: '알' };
    if (p.sleeping) return { tone: 'sleep', text: '자는 중' };
    if (p.sick) return { tone: 'bad', text: '아픔' };
    if (p.hunger < 25) return { tone: 'warn', text: '배고픔' };
    if (p.energy < 20) return { tone: 'warn', text: '졸림' };
    if (p.clean < 25) return { tone: 'warn', text: '꼬질꼬질' };
    if (p.mood < 30) return { tone: 'warn', text: '시무룩' };
    if (p.mood >= 80) return { tone: 'good', text: '신남' };
    return { tone: 'calm', text: '평온' };
}

const word = (v) => (v < 20 ? '매우 낮음' : v < 40 ? '낮음' : v < 70 ? '보통' : '높음');

function stateWords(p) {
    const parts = [];
    if (p.sleeping) parts.push('자고 있다');
    if (p.sick) parts.push('몸이 아프다');
    if (p.hunger < 25) parts.push('배가 고프다');
    else if (p.hunger > 90) parts.push('배가 부르다');
    if (p.energy < 20 && !p.sleeping) parts.push('졸리고 지쳤다');
    if (p.clean < 25) parts.push('씻고 싶을 만큼 꼬질꼬질하다');
    if (p.mood < 30) parts.push('기분이 처져 있다');
    else if (p.mood >= 80) parts.push('기분이 아주 좋다');
    return parts;
}

const spriteFolder = (ch) => `${ch.name}/tama`;

async function loadSprites(force = false) {
    const ch = currentChar();
    if (!ch) { state.spr = { name: null, by: {}, outfits: [], count: 0 }; return; }
    if (!force && state.spr.name === ch.name) return;
    const spr = { name: ch.name, by: {}, outfits: [], count: 0 };
    try {
        const res = await fetch(`/api/sprites/get?name=${encodeURIComponent(spriteFolder(ch))}`, { headers: ctx().getRequestHeaders() });
        const list = res.ok ? await res.json() : [];
        for (const { label, path } of list) {
            const l = String(label).toLowerCase();
            const m = l.match(/^(?:([a-z0-9]+)_)?([a-z]+)$/);
            if (!m || !POSES.includes(m[2])) continue;
            (spr.by[l] ||= []).push(path);
            if (m[1] && !spr.outfits.includes(m[1])) spr.outfits.push(m[1]);
            spr.count++;
        }
        for (const arr of Object.values(spr.by)) arr.sort();
        for (const arr of Object.values(spr.by)) for (const src of arr) { const i = new Image(); i.src = src; }
    } catch (e) {
        console.warn('[캐릭터 다마고치] 스프라이트를 못 읽었어요', e);
    }
    if (currentChar()?.name !== ch.name) return;
    state.spr = spr;
    state.pose = { key: '', src: '', at: 0 };
    const p = state.key ? S.pets[state.key] : null;
    if (p?.outfit && !spr.outfits.includes(p.outfit)) p.outfit = '';
    updateSpriteInfo();
}

function basePose(p) {
    if (p.sleeping) return 'sleep';
    if (p.sick) return 'sick';
    if (p.hunger < 25) return 'hungry';
    if (p.energy < 20) return 'sleepy';
    if (p.mood < 30 || p.clean < 25) return 'pout';
    if (p.mood >= 85) return 'happy';
    return 'idle';
}

function spritesFor(pose, outfit) {
    const by = state.spr.by;
    for (const l of CHAIN[pose] || ['idle']) {
        if (outfit && by[`${outfit}_${l}`]) return by[`${outfit}_${l}`];
        if (by[l]) return by[l];
    }
    return (outfit && by[`${outfit}_idle`]) || Object.values(by)[0] || [];
}

function currentSprite(p) {
    if (!state.spr.count || p.egg) return '';
    const now = Date.now();
    const act = state.act && (state.busy || state.act.until > now) ? state.act.pose : null;
    const pose = act || basePose(p);
    let list = spritesFor(pose, p.outfit || '');
    if (pose === 'idle' && p.bond >= 60) list = list.concat(spritesFor('love', p.outfit || ''));
    const key = `${pose}|${p.outfit || ''}|${act ? state.act.id : ''}`;
    const stale = pose === 'idle' && now - state.pose.at > 20e3;
    if (key !== state.pose.key || !list.includes(state.pose.src) || stale) {
        const others = list.filter((s) => s !== state.pose.src);
        state.pose = { key, src: pick(others.length ? others : list) || '', at: now };
    }
    return state.pose.src;
}

function setActPose(key) {
    const pose = ACTION_POSE[key];
    if (!pose || !state.spr.count) return;
    const id = Math.random();
    state.act = { pose, id, until: Date.now() + 7000 };
    setTimeout(() => { if (state.act?.id === id && !state.busy) render(); }, 7100);
}

// ───────── 행동 ─────────
function gainBond(p, kind, amount) {
    const now = Date.now();
    if (now - (p.cd[kind] || 0) < 5 * 60e3) return;
    p.cd[kind] = now;
    p.bond = clamp(p.bond + amount);
}

function runAction(kind, userText = '') {
    const p = getPet();
    if (!p) return null;
    applyDecay(p);
    const user = ctx().name1 || '유저';
    let desc = '', key = kind, fx = '';

    if (p.egg) {
        if (kind !== 'hatch') return null;
        p.egg = false; p.born = Date.now(); p.last = Date.now();
        desc = `${user}가 알을 깨워 ${p.name}이(가) 막 태어났다. 처음 보는 ${user}에게 첫인사를 한다`;
        addLog(p, '알에서 깨어났다');
        return { p, desc, key: 'hatch', fx: '🐣' };
    }

    switch (kind) {
        case 'feed':
            if (p.sleeping) return null;
            if (p.hunger > 92) { p.mood = clamp(p.mood - 3); desc = `${user}가 밥을 주려 했지만 이미 배가 불러 거절했다`; key = 'feedFull'; fx = '🙅'; }
            else { p.hunger = clamp(p.hunger + 30); p.clean = clamp(p.clean - 3); p.mood = clamp(p.mood + 3); gainBond(p, kind, 1); desc = `${user}가 밥을 챙겨 줬다`; fx = '🍚'; }
            break;
        case 'play':
            if (p.sleeping) return null;
            if (p.energy < 15 || p.sick) { desc = `${user}가 놀자고 했지만 ${p.sick ? '아파서' : '너무 피곤해서'} 거절했다`; key = 'playTired'; fx = '😮‍💨'; }
            else { p.mood = clamp(p.mood + 22); p.energy = clamp(p.energy - 15); p.hunger = clamp(p.hunger - 8); p.clean = clamp(p.clean - 8); gainBond(p, kind, 2); desc = `${user}와 함께 신나게 놀았다`; fx = '🎾'; }
            break;
        case 'sleep':
            if (p.sleeping) {
                p.sleeping = false;
                if (p.energy < 50) { p.mood = clamp(p.mood - 10); desc = `덜 잤는데 ${user}가 깨웠다`; key = 'wakeBad'; fx = '😠'; }
                else { desc = `${user}가 깨워서 일어났다`; key = 'wakeGood'; fx = '☀️'; }
            } else {
                p.sleeping = true; desc = `${user}가 재워 줘서 잠자리에 든다`; fx = '🌙';
            }
            break;
        case 'wash':
            if (p.sleeping) return null;
            p.clean = 100; p.mood = clamp(p.mood + 4); gainBond(p, kind, 1); desc = `${user}가 깨끗하게 씻겨 줬다`; fx = '🫧';
            break;
        case 'pet':
            if (p.sleeping) { p.mood = clamp(p.mood + 1); desc = `자는 동안 ${user}가 살며시 쓰다듬었다`; key = 'petSleep'; fx = '💤'; }
            else { p.mood = clamp(p.mood + 5); gainBond(p, kind, 1); desc = `${user}가 머리를 쓰다듬어 줬다`; fx = '💕'; }
            break;
        case 'med':
            if (p.sleeping) return null;
            if (!p.sick) { desc = `아프지도 않은데 ${user}가 약을 내밀었다`; key = 'medNone'; fx = '❓'; }
            else { p.sick = false; p.mood = clamp(p.mood - 4); p.hunger = Math.max(p.hunger, 15); p.clean = Math.max(p.clean, 15); gainBond(p, kind, 2); desc = `아파서 ${user}가 약을 먹여 줬다`; fx = '💊'; }
            break;
        case 'hand': case 'hug': case 'kiss': {
            if (p.sleeping) return null;
            const a = ACTIONS.find((x) => x.k === kind);
            if (p.bond < a.min || (a.romance && S.romance === false)) return null;
            const m = {
                hand: [4, 1, `${user}가 살며시 손을 잡았다`, '🤝'],
                hug: [7, 2, `${user}가 꼭 안아 줬다`, '🫂'],
                kiss: [9, 2, `${user}가 볼에 가볍게 뽀뽀했다`, '💋'],
            }[kind];
            p.mood = clamp(p.mood + m[0]); gainBond(p, kind, m[1]); desc = m[2]; fx = m[3];
            break;
        }
        case 'gift': {
            if (p.sleeping) return null;
            const g = giftList(p).find((x) => x.id === userText);
            if (!g || giftsLeft(p) <= 0) return null;
            p.giftCount++;
            const rate = rateGift(p, g.id);
            p.giftSeen[g.id] = rate;
            if (rate === 'love') { p.mood = clamp(p.mood + 15); p.bond = clamp(p.bond + 3); desc = `${user}가 "${g.name}"을(를) 선물했다. ${p.name}이(가) 정말 좋아하는 것이다`; key = 'giftLove'; fx = '💝'; }
            else if (rate === 'dislike') { p.mood = clamp(p.mood - 5); desc = `${user}가 "${g.name}"을(를) 선물했다. 사실 별로 좋아하지 않는 것이지만 마음은 고맙다`; key = 'giftBad'; fx = '😅'; }
            else { p.mood = clamp(p.mood + 6); p.bond = clamp(p.bond + 1); desc = `${user}가 "${g.name}"을(를) 선물했다. 무난하게 마음에 든다`; fx = '🎁'; }
            addLog(p, `${g.name}을(를) 선물받았다`);
            return { p, desc, key, fx };
        }
        case 'dress': {
            if (p.sleeping) return null;
            const to = userText || '';
            if ((p.outfit || '') === to) return null;
            p.outfit = to;
            p.mood = clamp(p.mood + 2);
            desc = `${user}가 ${outfitName(to)}${to ? ' 차림으로' : ' 옷으로'} 갈아입혀 줬다`; fx = '👕';
            addLog(p, `${outfitName(to)}(으)로 갈아입었다`);
            return { p, desc, key: 'dress', fx };
        }
        case 'talk':
            if (p.sleeping) return null;
            p.mood = clamp(p.mood + 6); gainBond(p, kind, 2);
            desc = userText ? `${user}가 말을 걸었다` : `${user}가 말을 걸어 왔다`; fx = '💬';
            break;
        default: return null;
    }
    addLog(p, userText ? `${user}: ${userText}` : desc.replace(`${user}가 `, ''));
    return { p, desc, key, fx, userText };
}

async function doAction(kind, userText = '') {
    if (state.busy) return;
    const r = runAction(kind, userText);
    if (!r) return;
    await react(r);
}

// 방금 일어난 일(r)에 대한 캐릭터 반응을 보여 준다
async function react(r) {
    if (state.busy) return;
    const { p } = r;
    p.seen = Date.now();
    const up = r.key === 'tierUp' ? null : checkTierUp(p);
    if (up) {
        r.tierUp = up;
        r.desc += `. 그리고 바로 지금, ${ctx().name1 || '유저'}와의 관계가 '${up}' 단계로 깊어졌다는 걸 ${p.name}도 느낀다. 그 마음이 드러나게 말한다`;
        setTimeout(() => popFx('💞'), 500);
    }
    setActPose(up ? 'tierUp' : r.key);
    popFx(r.fx);
    render();
    save();
    updateInjection();

    if (S.aiReactions && r.key !== 'petSleep') {
        state.busy = true;
        p.line = '…';
        render();
        try {
            p.line = await generateLine(p, r);
        } catch (e) {
            console.warn('[캐릭터 다마고치] 반응 생성 실패', e);
            p.line = pick(LINES[r.tierUp ? 'tierUp' : r.key] || LINES.talk);
            toastr.warning(String(e?.message || e).slice(0, 160), '반응을 만들지 못해 기본 대사를 썼어요', { timeOut: 4000 });
        } finally {
            state.busy = false;
        }
    } else {
        p.line = pick(LINES[r.tierUp ? 'tierUp' : r.key] || LINES.talk);
    }
    // 대사가 나온 뒤에도 몇 초는 행동 그림을 유지
    if (state.act) {
        const id = state.act.id;
        state.act.until = Date.now() + 6000;
        setTimeout(() => { if (state.act?.id === id) render(); }, 6100);
    }
    if (state.key && S.pets[state.key] === p) {
        render();
        save();
    }
}

// ───────── 모델 반응 ─────────
function trimText(s, n) {
    s = String(s || '').trim();
    return s.length > n ? s.slice(0, n) + '…' : s;
}

function buildPrompt(p, r) {
    const c = ctx();
    const user = c.name1 || '유저';
    let card = {};
    try { card = c.getCharacterCardFields?.() || {}; } catch { /* 없음 */ }
    const charInfo = [card.description, card.personality].filter(Boolean).map((x) => trimText(x, 1500)).join('\n\n');

    const sys = [
        `너는 롤플레이 캐릭터 "${p.name}"이다. 지금 ${user}가 다마고치처럼 너를 돌봐 주는 짧은 미니게임 중이다.`,
        charInfo ? `[캐릭터 정보]\n${charInfo}` : '',
        '[규칙]',
        `- ${p.name}의 말투와 성격 그대로, 방금 일어난 일에 대한 반응을 ${r.tierUp || r.key === 'tierUp' ? '2~3문장' : '1~2문장'}으로만 쓴다.`,
        '- 대사와 아주 짧은 행동 묘사(*…*)만 쓴다. 해설, 수치, 게임이라는 말, 이름표, 따옴표는 쓰지 않는다.',
        '- 지금 몸 상태와 관계를 자연스럽게 반영한다.',
        `- ${S.lang || '한국어'}로 쓴다.`,
    ].filter(Boolean).join('\n');

    const st = STATS.filter((x) => x.k !== 'bond').map((x) => `${x.label} ${word(p[x.k])}`).join(', ');
    const extra = stateWords(p);
    const recent = p.log.slice(1, 5).map((l) => `- ${l.text}`).join('\n');
    const prompt = [
        `[지금 상태] ${st}${extra.length ? ` (${extra.join(', ')})` : ''}`,
        p.outfit ? `[옷차림] ${outfitName(p.outfit)}` : '',
        `[관계] ${user}와 ${tierOf(p.bond)} (친밀도 ${Math.round(p.bond)}/100), 함께한 지 ${daysOf(p)}일째`,
        `[지금 시각] ${timeWords()}`,
        recent ? `[최근 있었던 일]\n${recent}` : '',
        `[방금 일어난 일] ${r.desc}.`,
        r.userText ? `[${user}가 한 말] ${r.userText}` : '',
        `${p.name}의 반응:`,
    ].filter(Boolean).join('\n');
    return { sys, prompt };
}

function timeWords() {
    const h = new Date().getHours();
    const part = h < 5 ? '새벽' : h < 9 ? '아침' : h < 12 ? '오전' : h < 18 ? '오후' : h < 22 ? '저녁' : '밤';
    return `${part} ${h % 12 || 12}시쯤`;
}

function cleanLine(text, name) {
    let s = String(text || '');
    s = s.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').replace(/<think(?:ing)?>[\s\S]*$/i, '');
    s = s.trim().replace(new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:：]\\s*`), '');
    s = s.replace(/^["“”「『]+|["“”」』]+$/g, '').trim();
    const lines = s.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 2);
    return trimText(lines.join(' '), 220);
}

async function callModel(sys, prompt, max) {
    const c = ctx();
    const CM = c.ConnectionManagerRequestService;
    if (S.profileId && CM) {
        const msgs = CM.constructPrompt([{ role: 'system', content: sys }, { role: 'user', content: prompt }], S.profileId);
        const res = await CM.sendRequest(S.profileId, msgs, max, { stream: false, extractData: true, includePreset: true, includeInstruct: true });
        return res?.content ?? '';
    }
    return await c.generateRaw({ systemPrompt: sys, prompt, responseLength: max });
}

async function generateLine(p, r) {
    const { sys, prompt } = buildPrompt(p, r);
    const out = await callModel(sys, prompt, Number(S.maxTokens) || 300);
    const line = cleanLine(out, p.name);
    if (!line) throw new Error('모델이 빈 답을 보냈어요. 추론 모델이면 최대 토큰을 올려 보세요.');
    return line;
}

// ───────── 선물과 취향 ─────────
const today = () => new Date().toDateString();
function giftsLeft(p) {
    if (p.giftDay !== today()) { p.giftDay = today(); p.giftCount = 0; }
    return Math.max(0, GIFTS_PER_DAY - (p.giftCount || 0));
}
function giftList(p) {
    const sp = p.tastes?.special;
    return sp ? [{ id: 'special', name: sp, fa: 'fa-star' }, ...GIFTS] : GIFTS;
}
function rateGift(p, id) {
    if (id === 'special' || p.tastes?.love?.includes(id)) return 'love';
    if (p.tastes?.dislike?.includes(id)) return 'dislike';
    return 'ok';
}

function parseTastes(text) {
    let s = String(text || '').replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '');
    const ids = GIFTS.map((g) => g.id);
    const out = { love: [], dislike: [], special: '' };
    let obj = null;
    const m = s.match(/\{[\s\S]*\}/);
    if (m) { try { obj = JSON.parse(m[0]); } catch { /* 아래에서 조각을 건진다 */ } }
    const arr = (k) => {
        if (Array.isArray(obj?.[k])) return obj[k].map(String);
        const a = s.match(new RegExp(`"${k}"\\s*:\\s*\\[([^\\]]*)`));
        return a ? a[1].split(',').map((x) => x.replace(/["'\s]/g, '')) : null;
    };
    const love = arr('love'), dislike = arr('dislike');
    if (!love && !dislike) return null;
    out.love = (love || []).filter((x) => ids.includes(x)).slice(0, 4);
    out.dislike = (dislike || []).filter((x) => ids.includes(x) && !out.love.includes(x)).slice(0, 3);
    const sp = typeof obj?.special === 'string' ? obj.special : (s.match(/"special"\s*:\s*"([^"]*)"/)?.[1] || '');
    out.special = sp.replace(/[<>]/g, '').trim().slice(0, 24);
    return out;
}

// 캐릭터 카드를 읽고 선물 취향을 한 번 정해 둔다(캐릭터당 모델 호출 1회)
function ensureTastes(p) {
    if (p.tastes && !p.tastes.failed) return Promise.resolve();
    if (!S.aiReactions) { p.tastes = { love: [], dislike: [], special: '', failed: true }; return Promise.resolve(); }
    if (state.tasting) return state.tasting;
    state.tasting = (async () => {
        try {
            let card = {};
            try { card = ctx().getCharacterCardFields?.() || {}; } catch { /* 없음 */ }
            const info = [card.description, card.personality].filter(Boolean).map((x) => trimText(x, 2500)).join('\n\n');
            const sys = '너는 캐릭터 설정을 읽고 그 캐릭터의 취향을 판단하는 도우미다. 설명 없이 JSON 한 줄만 출력한다.';
            const prompt = [
                `[캐릭터: ${p.name}]\n${info || '(설정 없음)'}`,
                `[선물 목록]\n${GIFTS.map((g) => `${g.id}: ${g.name}`).join('\n')}`,
                '이 캐릭터가 특히 좋아할 선물 2~4개(love)와 별로 좋아하지 않을 선물 1~3개(dislike)를 목록의 id로 고른다. 설정에 근거가 없으면 성격에 어울리게 고른다.',
                `그리고 목록에 없더라도 이 캐릭터가 가장 좋아할 선물 하나를 special에 짧은 명사(${S.lang || '한국어'})로 적는다. 설정에 뚜렷한 근거가 없으면 빈 문자열.`,
                '형식: {"love":["id"],"dislike":["id"],"special":"이름"}',
            ].join('\n\n');
            const t = parseTastes(await callModel(sys, prompt, Math.max(400, Number(S.maxTokens) || 300)));
            if (!t) throw new Error('취향 답을 읽지 못했어요');
            p.tastes = t;
        } catch (e) {
            console.warn('[캐릭터 다마고치] 취향 판단 실패', e);
            p.tastes = { love: [], dislike: [], special: '', failed: true };
        } finally {
            state.tasting = null;
            save();
        }
    })();
    return state.tasting;
}

function buildGifts() {
    const w = $win();
    const p = state.key ? S.pets[state.key] : null;
    if (!w || !p) return;
    const left = giftsLeft(p);
    const mark = { love: '<i class="fa-solid fa-heart ctama-gm ctama-gm-love" title="아주 좋아해요"></i>', ok: '<i class="fa-solid fa-check ctama-gm" title="무난해요"></i>', dislike: '<i class="fa-solid fa-xmark ctama-gm ctama-gm-bad" title="별로예요"></i>' };
    const head = state.tasting ? '취향을 알아보는 중…' : left ? `오늘 남은 선물 ${left}개 · 취향은 줘 봐야 알 수 있어요` : '오늘 선물은 다 줬어요. 내일 또 줄 수 있어요';
    w.querySelector('.ctama-gifts').innerHTML = `<div class="ctama-ghead">${head}</div><div class="ctama-ggrid">${giftList(p).map((g) => `
      <div class="ctama-cl ctama-gift${left ? '' : ' ctama-off'}" data-g="${esc(g.id)}" tabindex="0" role="button" title="${esc(g.name)}">
        <span class="ctama-gi"><i class="fa-solid ${g.fa}"></i>${mark[p.giftSeen[g.id]] || ''}</span><span>${esc(g.name)}</span></div>`).join('')}</div>`;
}

async function toggleGifts(force) {
    const w = $win();
    const p = state.key ? S.pets[state.key] : null;
    if (!w || !p) return;
    const open = force ?? !w.classList.contains('ctama-giftopen');
    w.classList.toggle('ctama-giftopen', open);
    if (!open) return;
    w.classList.remove('ctama-closetopen');
    const wait = ensureTastes(p);
    buildGifts();
    await wait;
    if (w.classList.contains('ctama-giftopen') && S.pets[state.key] === p) buildGifts();
}

async function giveGift(id) {
    const p = state.key ? S.pets[state.key] : null;
    if (!p || state.busy) return;
    if (giftsLeft(p) <= 0) return toastr.info('오늘 선물은 다 줬어요. 내일 또 줄 수 있어요.', '캐릭터 다마고치');
    await ensureTastes(p);
    toggleGifts(false);
    await doAction('gift', id);
}

// ───────── 오랜만에 돌아왔을 때 ─────────
function maybeReunion() {
    if (!S.enabled || !S.showWindow || state.busy || document.visibilityState !== 'visible') return;
    const p = state.key ? S.pets[state.key] : null;
    if (!p || p.egg) return;
    const now = Date.now();
    const away = now - (p.seen || now);
    p.seen = now;
    if (!S.reunion || p.sleeping || away < 3 * 3.6e6) return;
    const user = ctx().name1 || '유저';
    const h = Math.round(away / 3.6e6), d = Math.floor(h / 24);
    let desc, key = 'reunion';
    if (h < 8) desc = `${user}가 ${h}시간 만에 돌아왔다. 반갑게 맞는다`;
    else if (h < 24) desc = `${user}가 ${h}시간 만에 돌아왔다. 기다렸다는 티가 난다`;
    else { p.mood = clamp(p.mood - Math.min(20, 5 * d)); desc = `${user}가 ${d}일 만에 돌아왔다. 많이 보고 싶었고 조금 서운했다`; key = 'reunionLong'; }
    addLog(p, `${user}가 ${d ? `${d}일` : `${h}시간`} 만에 돌아왔다`);
    react({ p, desc, key, fx: key === 'reunion' ? '👋' : '🥺' });
}

// ───────── 메인 답장에 상태 알리기 ─────────
function updateInjection() {
    const c = ctx();
    const p = state.key ? S.pets[state.key] : null;
    if (!S.enabled || !S.injectState || !p || p.egg || !currentChar()) {
        c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 0);
        return;
    }
    const words = stateWords(p);
    const wear = p.outfit ? ` 지금 ${outfitName(p.outfit)} 차림.` : '';
    const text = `[참고: ${p.name}의 현재 컨디션 — ${words.length ? words.join(', ') : '무난하다'}.${wear}${c.name1 || '유저'}와의 사이는 '${tierOf(p.bond)}'. 이 컨디션을 말투나 행동에 아주 가볍게만 묻어나게 하고, 게임·수치는 언급하지 말 것.]`;
    c.setExtensionPrompt(PROMPT_KEY, text, 1, 0, false, 0);
}

// ───────── 화면 ─────────
const $win = () => document.getElementById('ctama-win');
const isMobile = () => window.innerWidth <= 768;

function buildWindow() {
    if ($win()) return;
    const w = document.createElement('div');
    w.id = 'ctama-win';
    w.innerHTML = `
      <div class="ctama-head">
        <img class="ctama-mini" alt="">
        <div class="ctama-title"><span class="ctama-name"></span><span class="ctama-sub"></span></div>
        <div class="ctama-hbtns">
          <div class="ctama-hbtn" data-h="settings" title="설정" tabindex="0"><i class="fa-solid fa-gear"></i></div>
          <div class="ctama-hbtn" data-h="collapse" title="접기/펴기" tabindex="0"><i class="fa-solid fa-minus"></i></div>
          <div class="ctama-hbtn" data-h="close" title="닫기" tabindex="0"><i class="fa-solid fa-xmark"></i></div>
        </div>
      </div>
      <div class="ctama-body">
        <div class="ctama-empty">캐릭터와의 1:1 채팅을 열면 여기서 돌볼 수 있어요.</div>
        <div class="ctama-main">
          <div class="ctama-stage">
            <span class="ctama-days"></span>
            <div class="ctama-wardrobe" tabindex="0" role="button" title="옷 갈아입히기"><i class="fa-solid fa-shirt"></i></div>
            <div class="ctama-bubble"></div>
            <div class="ctama-avwrap" title="쓰다듬기">
              <img class="ctama-av" alt="">
              <img class="ctama-sprite" alt="">
              <div class="ctama-egg"></div>
              <span class="ctama-zzz">z<b>z</b><i>z</i></span>
            </div>
            <div class="ctama-status"></div>
            <div class="ctama-hatch" tabindex="0" role="button">알 깨우기</div>
          </div>
          <div class="ctama-closet"></div>
          <div class="ctama-gifts"></div>
          <div class="ctama-side">
          <div class="ctama-bond" title="친밀도">
            <i class="fa-solid fa-heart"></i><span class="ctama-tier"></span>
            <span class="ctama-btrack"><span class="ctama-bfill"></span></span><span class="ctama-bnum"></span>
          </div>
          <div class="ctama-bars"></div>
          </div>
          <div class="ctama-acts"></div>
          <div class="ctama-talk">
            <input type="text" class="text_pole ctama-input" maxlength="200" placeholder="말 걸기…">
            <div class="ctama-send" tabindex="0" role="button" title="보내기"><i class="fa-solid fa-paper-plane"></i></div>
          </div>
          <details class="ctama-logbox"><summary>최근 일</summary><ul class="ctama-log"></ul></details>
        </div>
        <div class="ctama-setslot"></div>
      </div>`;
    document.body.appendChild(w);

    w.querySelector('.ctama-bars').innerHTML = STATS.filter((s) => s.k !== 'bond').map((s) => `
      <div class="ctama-bar" data-k="${s.k}" title="${s.label}" style="--c:${s.color}">
        <i class="fa-solid ${s.fa} ctama-bi"></i>
        <span class="ctama-track"><span class="ctama-fill"></span></span>
        <span class="ctama-bv"></span>
      </div>`).join('');
    w.querySelector('.ctama-acts').innerHTML = ACTIONS.map((a) => `
      <div class="ctama-act" data-a="${a.k}" tabindex="0" role="button"><span class="ctama-ai"><i class="fa-solid ${a.fa}"></i></span><span class="ctama-al">${a.label}</span></div>`).join('');

    const activate = (el, fn) => {
        el.addEventListener('click', fn);
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } });
    };
    w.querySelectorAll('.ctama-act').forEach((el) => activate(el, () => {
        if (el.classList.contains('ctama-off')) return;
        const a = ACTIONS.find((x) => x.k === el.dataset.a);
        if (el.classList.contains('ctama-locked')) return toastr.info(`친밀도 ${a.min}('${tiers().find(([m]) => m >= a.min)?.[1] || ''}')부터 할 수 있어요.`, a.label);
        if (a.k === 'gift') return toggleGifts();
        toggleGifts(false);
        doAction(a.k);
    }));
    w.querySelector('.ctama-gifts').addEventListener('click', (e) => {
        const it = e.target.closest('.ctama-gift');
        if (it) giveGift(it.dataset.g);
    });
    w.querySelector('.ctama-gifts').addEventListener('keydown', (e) => {
        const it = e.target.closest('.ctama-gift');
        if (it && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); giveGift(it.dataset.g); }
    });
    activate(w.querySelector('.ctama-hatch'), () => doAction('hatch'));
    activate(w.querySelector('.ctama-wardrobe'), () => {
        const open = !w.classList.contains('ctama-closetopen');
        if (open) { buildCloset(); w.classList.remove('ctama-giftopen'); }
        w.classList.toggle('ctama-closetopen', open);
    });
    w.querySelector('.ctama-closet').addEventListener('click', (e) => {
        const it = e.target.closest('.ctama-cl');
        if (!it || state.busy) return;
        w.classList.remove('ctama-closetopen');
        doAction('dress', it.dataset.o);
    });
    w.querySelector('.ctama-wardrobe').addEventListener('click', (e) => e.stopPropagation());
    w.querySelector('.ctama-avwrap').addEventListener('click', () => { const p = getPet(); if (p && !p.egg) doAction('pet'); });
    const input = w.querySelector('.ctama-input');
    const send = () => {
        const p = getPet();
        if (!p || p.egg || p.sleeping || state.busy) return;
        const t = input.value.trim();
        input.value = '';
        doAction('talk', t);
    };
    activate(w.querySelector('.ctama-send'), send);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(); } });

    w.querySelectorAll('.ctama-hbtn').forEach((el) => activate(el, () => {
        const h = el.dataset.h;
        if (h === 'close') { S.showWindow = false; save(); syncVisibility(); }
        if (h === 'collapse') { S.window.collapsed = !S.window.collapsed; save(); render(); place(); }
        if (h === 'settings') toggleSettingsInWindow();
    }));

    setupDrag(w);
    // 모바일: 이름 줄을 누르면 접기/펴기, 채팅 입력 중엔 머리줄만 남기고 비켜 준다
    w.querySelector('.ctama-title').addEventListener('click', () => {
        if (!isMobile()) return;
        S.window.collapsed = !S.window.collapsed; save(); render(); place();
    });
    document.addEventListener('focusin', () => isMobile() && setTimeout(place, 350));
    document.addEventListener('focusout', () => isMobile() && setTimeout(place, 350));
    input.addEventListener('focus', () => { if (isMobile()) setTimeout(() => { place(); input.scrollIntoView({ block: 'nearest' }); }, 350); });
    new ResizeObserver(() => {
        if (state.dragging || isMobile() || S.window.collapsed || w.style.display === 'none') return;
        const r = w.getBoundingClientRect();
        if (!r.width) return;
        S.window.w = Math.round(r.width);
        if (w.dataset.userH === '1') S.window.h = Math.round(r.height);
        save();
    }).observe(w);
    // 사용자가 직접 크기를 끌었을 때만 높이를 기억
    w.addEventListener('pointerdown', (e) => {
        const r = w.getBoundingClientRect();
        if (e.clientX > r.right - 18 && e.clientY > r.bottom - 18) w.dataset.userH = '1';
    });
}

function buildCloset() {
    const w = $win();
    const p = state.key ? S.pets[state.key] : null;
    if (!w || !p) return;
    const ids = ['', ...state.spr.outfits];
    w.querySelector('.ctama-closet').innerHTML = ids.map((id) => {
        const src = (id ? state.spr.by[`${id}_idle`] : state.spr.by.idle)?.[0] || spritesFor('idle', id)[0] || '';
        const sel = (p.outfit || '') === id ? ' ctama-cl-sel' : '';
        return `<div class="ctama-cl${sel}" data-o="${esc(id)}" tabindex="0" role="button" title="${esc(outfitName(id))}"><img src="${esc(src)}" alt=""><span>${esc(outfitName(id))}</span></div>`;
    }).join('');
}

function setupDrag(w) {
    const head = w.querySelector('.ctama-head');
    let sx, sy, ox, oy, id = null;
    head.addEventListener('pointerdown', (e) => {
        if (isMobile() || e.target.closest('.ctama-hbtn') || e.button !== 0) return;
        const r = w.getBoundingClientRect();
        sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; id = e.pointerId;
        state.dragging = true;
        w.classList.add('ctama-drag');
        head.setPointerCapture(id);
    });
    head.addEventListener('pointermove', (e) => {
        if (e.pointerId !== id) return;
        S.window.x = ox + e.clientX - sx;
        S.window.y = oy + e.clientY - sy;
        place();
    });
    const end = (e) => {
        if (e.pointerId !== id) return;
        id = null; state.dragging = false;
        w.classList.remove('ctama-drag');
        save();
    };
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
}

// 모바일에선 수치를 캐릭터 옆(무대 안)으로 옮겨 세로 공간을 아낀다
function dockSide(w, inStage) {
    const side = w.querySelector('.ctama-side');
    const stage = w.querySelector('.ctama-stage');
    if (inStage && side.parentElement !== stage) w.querySelector('.ctama-avwrap').after(side);
    else if (!inStage && side.parentElement === stage) w.querySelector('.ctama-gifts').after(side);
}

function place() {
    const w = $win();
    if (!w || w.style.display === 'none') return;
    const vw = window.visualViewport?.width || window.innerWidth;
    const vh = window.visualViewport?.height || window.innerHeight;
    if (isMobile()) {
        // 모바일: 입력창 바로 위에 붙인다(<html> transform 때문에 bottom 기준 fixed가 안 먹음)
        w.classList.add('ctama-mobile', 'ctama-compact');
        w.classList.toggle('ctama-short', vh < 700);
        dockSide(w, true);
        w.style.width = `${vw - 8}px`;
        w.style.height = '';
        w.style.left = '4px';
        const sf = document.getElementById('send_form');
        const vv = window.visualViewport;
        const vTop = vv?.offsetTop || 0;
        // 채팅을 입력하느라 키보드가 올라와 있으면 머리줄만 남기고 비켜 준다
        const kbOpen = !!vv && window.innerHeight - vv.height > 120;
        w.classList.toggle('ctama-tucked', kbOpen && document.activeElement?.id === 'send_textarea');
        // 키보드가 올라오면 보이는 영역이 줄어든다 → 입력창과 키보드 중 더 위쪽에 맞춘다
        const sfTop = sf ? sf.getBoundingClientRect().top : vTop + vh;
        const anchor = Math.min(sfTop, vTop + vh);
        const maxH = Math.max(96, Math.min(vh * 0.62, anchor - vTop - 48));
        w.style.maxHeight = `${maxH}px`;
        w.style.top = `${Math.max(vTop + 4, anchor - w.offsetHeight - 6)}px`;
        return;
    }
    // 화면이 낮으면(휴대폰 가로 모드) 떠 있는 창도 압축 배치로
    const low = vh < 520;
    w.classList.remove('ctama-mobile', 'ctama-tucked');
    w.classList.toggle('ctama-compact', low);
    w.classList.toggle('ctama-short', low);
    dockSide(w, low);
    // 입력창을 가리지 않게(화면이 낮은 가로 모드 등)
    const sfRect = document.getElementById('send_form')?.getBoundingClientRect();
    const floor = sfRect && sfRect.top > 100 ? sfRect.top - 6 : vh - 4;
    const tb = document.getElementById('top-bar')?.getBoundingClientRect();
    const ceil = low && tb ? tb.bottom + 4 : 4;
    w.style.maxHeight = `${Math.max(160, Math.min(vh * 0.85, floor - ceil - 4))}px`;
    w.style.width = `${Math.max(240, Math.min(S.window.w || 300, vw - 16))}px`;
    w.style.height = !S.window.collapsed && S.window.h ? `${Math.min(S.window.h, vh - 16)}px` : '';
    const ww = w.offsetWidth, wh = w.offsetHeight;
    let x = S.window.x ?? vw - ww - 16;
    let y = S.window.y ?? Math.max(ceil, Math.min(70, floor - wh));
    x = Math.max(4, Math.min(x, vw - ww - 4));
    y = Math.max(4, Math.min(y, vh - Math.min(wh, 60) - 4));
    w.style.left = `${x}px`;
    w.style.top = `${y}px`;
}

function popFx(emoji) {
    const wrap = $win()?.querySelector('.ctama-avwrap');
    if (!wrap || !emoji) return;
    const s = document.createElement('span');
    s.className = 'ctama-fx';
    s.textContent = emoji;
    wrap.appendChild(s);
    setTimeout(() => s.remove(), 1100);
    wrap.classList.remove('ctama-hop');
    void wrap.offsetWidth;
    wrap.classList.add('ctama-hop');
}

function render() {
    const w = $win();
    updateMenuBadge();
    if (!w) return;
    w.style.setProperty('--ctama-op', String(clamp(Number(S.opacity) || 100, 15, 100) / 100));
    w.classList.toggle('ctama-collapsed', !!S.window.collapsed);
    const p = state.key ? S.pets[state.key] : null;
    const ch = currentChar();
    w.classList.toggle('ctama-none', !p || !ch);
    if (!p || !ch) {
        w.querySelector('.ctama-name').textContent = '캐릭터 다마고치';
        w.querySelector('.ctama-sub').textContent = '';
        w.querySelector('.ctama-mini').removeAttribute('src');
        return;
    }
    const src = ctx().getThumbnailUrl('avatar', ch.avatar);
    for (const img of w.querySelectorAll('.ctama-av, .ctama-mini')) if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    const mi = moodInfo(p);
    w.querySelector('.ctama-name').textContent = p.name;
    const sub = w.querySelector('.ctama-sub');
    sub.textContent = mi.text;
    sub.dataset.tone = mi.tone;
    const hr = new Date().getHours();
    w.dataset.tod = p.sleeping ? 'night' : hr >= 6 && hr < 10 ? 'morning' : hr >= 10 && hr < 17 ? 'day' : hr >= 17 && hr < 20 ? 'evening' : 'night';
    w.querySelector('.ctama-days').textContent = p.egg ? '' : `D+${daysOf(p)}`;
    w.querySelector('.ctama-tier').textContent = tierOf(p.bond);
    w.querySelector('.ctama-bfill').style.width = `${Math.round(p.bond)}%`;
    w.querySelector('.ctama-bnum').textContent = Math.round(p.bond);
    w.classList.toggle('ctama-isegg', !!p.egg);
    w.classList.toggle('ctama-sleeping', !!p.sleeping);
    w.classList.toggle('ctama-sick', !!p.sick);
    w.classList.toggle('ctama-happy', !p.egg && !p.sleeping && !p.sick && p.mood >= 70);
    const spr = currentSprite(p);
    w.classList.toggle('ctama-hasSprite', !!spr);
    const sImg = w.querySelector('.ctama-sprite');
    if (spr && sImg.getAttribute('src') !== spr) sImg.setAttribute('src', spr);
    const canDress = !!spr && state.spr.outfits.length > 0 && !p.sleeping;
    w.classList.toggle('ctama-candress', canDress);
    if (!canDress) w.classList.remove('ctama-closetopen');
    w.querySelector('.ctama-status').textContent = p.egg ? '따뜻한 알이에요. 깨워 볼까요?' : '';
    const bub = w.querySelector('.ctama-bubble');
    const typing = state.busy && p.line === '…';
    bub.innerHTML = typing ? '<span class="ctama-dots"><b></b><b></b><b></b></span>' : esc(p.line || '').replace(/\*([^*]+)\*/g, '<i>$1</i>');
    bub.classList.toggle('ctama-hidden', !p.line);

    for (const s of STATS) {
        if (s.k === 'bond') continue;
        const el = w.querySelector(`.ctama-bar[data-k="${s.k}"]`);
        const v = Math.round(p[s.k]);
        el.querySelector('.ctama-fill').style.width = `${v}%`;
        el.querySelector('.ctama-bv').textContent = v;
        el.classList.toggle('ctama-low', v < 20);
    }
    for (const el of w.querySelectorAll('.ctama-act')) {
        const k = el.dataset.a;
        const a = ACTIONS.find((x) => x.k === k);
        el.style.display = a.romance && S.romance === false ? 'none' : '';
        const locked = !!a.min && p.bond < a.min;
        let off = state.busy;
        if (p.sleeping && !['sleep', 'pet'].includes(k)) off = true;
        if (k === 'med') el.classList.toggle('ctama-need', p.sick);
        let fa = a.fa;
        if (k === 'sleep') {
            fa = p.sleeping ? 'fa-sun' : 'fa-moon';
            el.querySelector('.ctama-al').textContent = p.sleeping ? '깨우기' : '재우기';
        }
        if (locked) fa = 'fa-lock';
        const ic = el.querySelector('.ctama-ai i');
        if (ic.className !== `fa-solid ${fa}`) ic.className = `fa-solid ${fa}`;
        el.title = locked ? `친밀도 ${a.min}부터` : '';
        el.classList.toggle('ctama-locked', locked);
        el.classList.toggle('ctama-off', off);
        el.setAttribute('aria-disabled', String(off || locked));
    }
    if (p.sleeping || p.egg) w.classList.remove('ctama-giftopen');
    const input = w.querySelector('.ctama-input');
    input.disabled = p.sleeping || state.busy;
    input.placeholder = p.sleeping ? '자는 중이에요…' : `${p.name}에게 말 걸기…`;
    w.querySelector('.ctama-log').innerHTML = p.log.slice(0, 12).map((l) => {
        const d = new Date(l.t);
        return `<li><time>${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</time>${esc(l.text)}</li>`;
    }).join('') || '<li>아직 없어요</li>';
}

function updateMenuBadge() {
    const p = state.key ? S.pets[state.key] : null;
    const need = S.enabled && needsCare(p);
    document.getElementById('ctama-sendbtn')?.classList.toggle('ctama-alert', need);
}

function syncVisibility() {
    const w = $win();
    const btn = document.getElementById('ctama-sendbtn');
    if (btn) btn.style.display = S.enabled ? '' : 'none';
    if (!w) return;
    w.style.display = S.enabled && S.showWindow ? '' : 'none';
    document.getElementById('ctama-showWindow') && (document.getElementById('ctama-showWindow').checked = !!S.showWindow);
    if (w.style.display !== 'none') { render(); place(); maybeReunion(); }
}

function refreshPet() {
    const p = getPet();
    if (p) applyDecay(p);
    render();
    place();
    updateInjection();
    $win()?.classList.remove('ctama-giftopen', 'ctama-closetopen');
    loadSprites().then(() => { render(); place(); updateSpriteInfo(); maybeReunion(); });
}

// ───────── 설정 패널 ─────────
function settingsHtml() {
    return `
    <div id="ctama-settings" class="ctama-settings">
      <label class="checkbox_label"><input type="checkbox" id="ctama-enabled"> 사용</label>
      <label class="checkbox_label"><input type="checkbox" id="ctama-showWindow"> 창 보이기</label>
      <details class="ctama-sec" data-sec="react" open><summary>캐릭터 반응</summary>
        <label class="checkbox_label"><input type="checkbox" id="ctama-aiReactions"> 행동할 때 캐릭터가 모델로 반응하기</label>
        <small>끄면 정해진 기본 대사를 써요.</small>
        <label>연결 프로필<select id="ctama-profileId" class="text_pole"></select></label>
        <label>최대 토큰<input type="number" id="ctama-maxTokens" class="text_pole" min="50" max="4000" step="50"></label>
        <label>반응 언어<input type="text" id="ctama-lang" class="text_pole" maxlength="30"></label>
      </details>
      <details class="ctama-sec" data-sec="chat"><summary>채팅 연동</summary>
        <label class="checkbox_label"><input type="checkbox" id="ctama-injectState"> 지금 컨디션을 답장에 살짝 반영하기</label>
        <label class="checkbox_label"><input type="checkbox" id="ctama-reunion"> 오랜만에 돌아오면 캐릭터가 먼저 말 걸기(3시간 이상 비웠을 때)</label>
        <label class="checkbox_label"><input type="checkbox" id="ctama-chatAffection"> 대화를 나누면 기분·친밀도 오르기(하루 최대 +5)</label>
      </details>
      <details class="ctama-sec" data-sec="game"><summary>게임</summary>
        <label class="checkbox_label"><input type="checkbox" id="ctama-romance"> 연애 모드(관계 단계가 호감 → 썸 → 연인, 뽀뽀 가능)</label>
        <small>끄면 아는 사이 → 친한 사이 → 단짝으로 표시돼요.</small>
        <label>수치가 줄어드는 속도<select id="ctama-decaySpeed" class="text_pole">
          <option value="0">멈춤</option><option value="0.5">느리게</option><option value="1">보통</option><option value="2">빠르게</option></select></label>
        <label>꺼 둔 동안 최대 반영 시간(시간)<input type="number" id="ctama-offlineCapHours" class="text_pole" min="0" max="168" step="1"></label>
        <label class="checkbox_label"><input type="checkbox" id="ctama-alerts"> 돌봐야 할 때 알림</label>
        <label>창 불투명도<select id="ctama-opacity" class="text_pole">
          <option value="100">100%</option><option value="85">85%</option><option value="70">70%</option><option value="50">50%</option><option value="30">30%</option><option value="15">15%</option></select></label>
        <small>흐리게 해 둬도 마우스를 올리면 선명해져요.</small>
        <div class="menu_button ctama-reset" id="ctama-reset">이 캐릭터 처음부터 키우기</div>
      </details>
      <details class="ctama-sec" data-sec="sprite"><summary>스프라이트</summary>
        <small>그림 묶음(zip)을 올리면 아바타 대신 상태에 맞는 그림이 나와요. 지금 열린 캐릭터에 들어가요.</small>
        <div class="ctama-sprinfo"></div>
        <div class="ctama-row">
          <div class="menu_button" id="ctama-sprup"><i class="fa-solid fa-file-zipper"></i> ZIP 올리기</div>
          <div class="menu_button" id="ctama-sprreload"><i class="fa-solid fa-rotate"></i> 다시 읽기</div>
        </div>
        <input type="file" id="ctama-sprfile" accept=".zip,application/zip" hidden>
        <details class="ctama-rules"><summary>파일 이름 규칙</summary>
          <small>상태-번호 형식: <code>idle-1.png</code>, <code>eat-2.webp</code>. 같은 상태가 여러 장이면 번갈아 나와요.<br>
          상태: idle(평소) · happy · love(쓰다듬기, 친밀도 높을 때) · shy(말 걸기) · eat · full(배부름) · play · wake · surprised · pout(시무룩) · hungry · sleepy · sick · sleep · hand(손잡기) · hug · kiss · gift · wave(오랜만에 왔을 때)<br>
          옷별 그림은 <code>옷이름_상태-번호</code>: <code>hoodie_eat-1.png</code>. 옷에 없는 상태는 기본 그림으로 대신해요.<br>
          저장 위치: <code>characters/캐릭터이름/tama/</code></small>
        </details>
      </details>
    </div>`;
}

function fillProfiles() {
    const sel = document.getElementById('ctama-profileId');
    if (!sel) return;
    let profiles = [];
    try { profiles = ctx().ConnectionManagerRequestService?.getSupportedProfiles?.() || []; } catch { /* 연결 관리자 꺼짐 */ }
    sel.innerHTML = '<option value="">(지금 연결된 모델)</option>' + profiles.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
    if (S.profileId && !profiles.some((p) => p.id === S.profileId)) S.profileId = '';
    sel.value = S.profileId;
}

function buildSettings() {
    const html = `
    <div class="inline-drawer ctama-drawer">
      <div class="inline-drawer-toggle inline-drawer-header"><b>캐릭터 다마고치</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div>
      <div class="inline-drawer-content">
        <div class="ctama-sethome">${settingsHtml()}</div>
        <div class="ctama-away">설정이 다마고치 창에 열려 있어요. <span class="ctama-bring">여기로 가져오기</span></div>
      </div>
    </div>`;
    document.getElementById('extensions_settings2')?.insertAdjacentHTML('beforeend', html);
    const root = document.getElementById('ctama-settings');
    const bools = ['enabled', 'showWindow', 'aiReactions', 'injectState', 'chatAffection', 'alerts', 'romance', 'reunion'];
    for (const k of bools) {
        const el = document.getElementById(`ctama-${k}`);
        el.checked = !!S[k];
        el.addEventListener('change', () => {
            S[k] = el.checked; save();
            if (k === 'enabled' || k === 'showWindow') syncVisibility();
            updateInjection(); render();
        });
    }
    for (const k of ['maxTokens', 'lang', 'decaySpeed', 'offlineCapHours', 'opacity', 'profileId']) {
        const el = document.getElementById(`ctama-${k}`);
        if (k !== 'profileId') el.value = S[k];
        el.addEventListener('change', () => {
            const num = ['maxTokens', 'decaySpeed', 'offlineCapHours', 'opacity'].includes(k);
            S[k] = num ? Number(el.value) : el.value;
            save(); render();
        });
    }
    fillProfiles();
    root.querySelectorAll('.ctama-sec').forEach((d) => {
        const open = (S.openSections ||= {})[d.dataset.sec];
        if (open !== undefined) d.open = open;
        d.addEventListener('toggle', () => { S.openSections[d.dataset.sec] = d.open; save(); });
    });
    document.getElementById('ctama-reset').addEventListener('click', async () => {
        const ch = currentChar();
        if (!ch) return toastr.info('캐릭터 채팅을 먼저 열어 주세요.');
        const c = ctx();
        const ok = await c.callGenericPopup(`${esc(ch.name)}의 다마고치 기록을 지우고 알부터 다시 시작할까요?`, c.POPUP_TYPE.CONFIRM);
        if (!ok) return;
        S.pets[ch.avatar] = newPet(ch);
        save(); refreshPet();
    });
    document.querySelector('.ctama-bring')?.addEventListener('click', () => moveSettings(false));

    const file = document.getElementById('ctama-sprfile');
    document.getElementById('ctama-sprup').addEventListener('click', () => {
        if (!currentChar()) return toastr.info('캐릭터 채팅을 먼저 열어 주세요.');
        file.click();
    });
    file.addEventListener('change', async () => {
        const f = file.files?.[0];
        file.value = '';
        const ch = currentChar();
        if (!f || !ch) return;
        const fd = new FormData();
        fd.append('name', spriteFolder(ch));
        fd.append('avatar', f);
        try {
            const res = await fetch('/api/sprites/upload-zip', { method: 'POST', headers: ctx().getRequestHeaders({ omitContentType: true }), body: fd });
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            const { count } = await res.json();
            toastr.success(`${ch.name}에 그림 ${count}장을 넣었어요.`, '캐릭터 다마고치');
        } catch (e) {
            toastr.error(String(e?.message || e), '그림을 올리지 못했어요');
        }
        await loadSprites(true);
        render();
    });
    document.getElementById('ctama-sprreload').addEventListener('click', async () => { await loadSprites(true); render(); });
}

function updateSpriteInfo() {
    const el = document.querySelector('.ctama-sprinfo');
    if (!el) return;
    const ch = currentChar();
    if (!ch) { el.textContent = '캐릭터 채팅을 열면 보여요.'; return; }
    const sp = state.spr;
    if (!sp.count) { el.textContent = `${ch.name}: 그림 없음 (아바타를 써요)`; return; }
    const poses = POSES.filter((x) => sp.by[x]);
    const missing = POSES.filter((x) => !sp.by[x]);
    el.innerHTML = `<b>${esc(ch.name)}</b>: 그림 ${sp.count}장${sp.outfits.length ? `, 옷 ${sp.outfits.length}벌(${sp.outfits.map((o) => esc(outfitName(o))).join(', ')})` : ''}<br><small>있는 상태: ${poses.join(', ') || '없음'}${missing.length ? `<br>없는 상태(비슷한 그림으로 대신): ${missing.join(', ')}` : ''}</small>`;
}

function moveSettings(toWindow) {
    const set = document.getElementById('ctama-settings');
    const w = $win();
    if (!set || !w) return;
    if (toWindow) {
        w.querySelector('.ctama-setslot').appendChild(set);
        w.classList.add('ctama-setopen');
        document.querySelector('.ctama-drawer')?.classList.add('ctama-isaway');
        fillProfiles();
    } else {
        document.querySelector('.ctama-sethome')?.appendChild(set);
        w.classList.remove('ctama-setopen');
        document.querySelector('.ctama-drawer')?.classList.remove('ctama-isaway');
    }
}
function toggleSettingsInWindow() {
    const w = $win();
    if (S.window.collapsed) { S.window.collapsed = false; save(); render(); }
    moveSettings(!w.classList.contains('ctama-setopen'));
    place();
}

// ───────── 실리태번 UI에 붙이기 ─────────
function addButtons() {
    if (!document.getElementById('ctama-sendbtn')) {
        const b = document.createElement('div');
        b.id = 'ctama-sendbtn';
        b.className = 'fa-solid fa-egg interactable';
        b.title = '캐릭터 다마고치';
        b.tabIndex = 0;
        b.addEventListener('click', () => { S.showWindow = !S.showWindow; save(); syncVisibility(); });
        document.getElementById('rightSendForm')?.prepend(b);
    }
    const menu = document.getElementById('extensionsMenu');
    if (menu && !document.getElementById('ctama-menu')) {
        const c = document.createElement('div');
        c.className = 'extension_container';
        c.innerHTML = '<div id="ctama-menu" class="list-group-item flex-container flexGap5 interactable" tabindex="0"><div class="fa-solid fa-egg extensionsMenuExtensionButton"></div><span>캐릭터 다마고치</span></div>';
        c.firstElementChild.addEventListener('click', () => { S.enabled = true; S.showWindow = !S.showWindow; save(); syncVisibility(); document.getElementById('ctama-enabled').checked = true; });
        menu.appendChild(c);
    }
}

function registerCommand() {
    const c = ctx();
    if (!c.SlashCommandParser || !c.SlashCommand) return;
    const map = { 밥: 'feed', 놀기: 'play', 재우기: 'sleep', 깨우기: 'sleep', 씻기: 'wash', 쓰다듬기: 'pet', 약: 'med', 손잡기: 'hand', 포옹: 'hug', 뽀뽀: 'kiss' };
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'tama',
        helpString: '캐릭터 다마고치. 인자 없이 쓰면 상태를 돌려줘요. feed/play/sleep/wash/pet/med/hatch, show/hide, 또는 talk 뒤에 할 말.',
        unnamedArgumentList: c.SlashCommandArgument ? [c.SlashCommandArgument.fromProps({ description: '행동', typeList: [c.ARGUMENT_TYPE.STRING], isRequired: false })] : [],
        callback: async (_args, value) => {
            const v = String(value || '').trim();
            const [cmd, ...rest] = v.split(/\s+/);
            if (cmd === 'show' || cmd === 'hide') { S.showWindow = cmd === 'show'; save(); syncVisibility(); return ''; }
            const kind = map[cmd] || cmd;
            if (kind === 'talk') await doAction('talk', rest.join(' '));
            else if (kind) await doAction(kind);
            const p = getPet();
            if (!p) return '';
            return p.egg ? `${p.name}: 알` : `${p.name} — ${STATS.map((s) => `${s.label} ${Math.round(p[s.k])}`).join(', ')}${p.sick ? ', 아픔' : ''}${p.sleeping ? ', 자는 중' : ''}`;
        },
    }));
}

function onAiMessage(id, type) {
    if (!S.enabled || !S.chatAffection || type === 'swipe' || type === 'impersonate') return;
    const msg = ctx().chat?.[id];
    if (!msg || msg.is_user || msg.is_system) return;
    const p = getPet();
    if (!p || p.egg) return;
    const day = new Date().toDateString();
    if (p.chatDay !== day) { p.chatDay = day; p.chatGain = 0; }
    p.mood = clamp(p.mood + 1);
    if (p.chatGain < 5) { const g = Math.min(0.5, 5 - p.chatGain); p.bond = clamp(p.bond + g); p.chatGain += g; }
    const up = checkTierUp(p);
    render(); save();
    if (up && S.showWindow) {
        const user = ctx().name1 || '유저';
        react({ p, key: 'tierUp', fx: '💞', desc: `${user}와 대화를 나누다 문득, 둘의 관계가 '${up}' 단계로 깊어졌다는 걸 느낀다. 그 마음이 드러나게 말한다` });
    }
}

// ───────── 시작 ─────────
jQuery(async () => {
    loadSettings();
    buildWindow();
    buildSettings();
    addButtons();
    registerCommand();

    const { eventSource, eventTypes } = ctx();
    eventSource.on(eventTypes.CHAT_CHANGED, () => { state.busy = false; refreshPet(); });
    eventSource.on(eventTypes.GENERATION_STARTED, () => { const p = getPet(); if (p) applyDecay(p); updateInjection(); });
    eventSource.on(eventTypes.MESSAGE_RECEIVED, onAiMessage);
    eventSource.on(eventTypes.APP_READY, () => { addButtons(); fillProfiles(); refreshPet(); });
    if (eventTypes.CONNECTION_PROFILE_LOADED) eventSource.on(eventTypes.CONNECTION_PROFILE_LOADED, fillProfiles);

    window.addEventListener('resize', place);
    document.addEventListener('visibilitychange', maybeReunion);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    const sf = document.getElementById('send_form');
    if (sf) new ResizeObserver(() => isMobile() && place()).observe(sf);
    new ResizeObserver(() => isMobile() && !state.dragging && place()).observe($win());

    state.tick = setInterval(() => {
        const p = state.key ? S.pets[state.key] : null;
        if (!p || !S.enabled) return;
        applyDecay(p);
        if (S.showWindow && document.visibilityState === 'visible' && !p.egg) p.seen = Date.now();
        render();
        updateInjection();
        // 설정 파일 저장은 5분에 한 번만(수치는 메모리에서 계속 갱신)
        if (Date.now() - (state.lastSave || 0) > 5 * 60e3) { state.lastSave = Date.now(); save(); }
    }, 30e3);

    syncVisibility();
    refreshPet();
    globalThis.CharTamagotchi = { maybeReunion, parseTastes, state, get settings() { return S; }, doAction, applyDecay, buildPrompt };
});
