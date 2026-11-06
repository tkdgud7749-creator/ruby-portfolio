// 캐릭터 시트(원본)에서 카드용 얼굴을 잘라 site/chars/ 에 저장하고 site/characters.json 을 만든다
const sharp = require('sharp'); const fs = require('fs'); const path = require('path');
const SRC = path.join(__dirname, '..', '..', '캐릭터시트', '원본');
const OUT = path.join(__dirname, '..', 'site', 'chars');
// [채널, 파일이름, 이름, 시리즈, 시트번호, 자를 영역(가로·세로 비율)]
const R = [.62, 0, .38, .62]; // 오른쪽 클로즈업 칸 윗부분
const L = [
  ['liora', 'ruby', '루비', ['전체'], 13, [.07, .03, .2, .2]],
  ['liora', 'spinel', '스피넬', ['전체'], 2, R],
  ['liora', 'jay', '제이', ['전체'], 4, R],
  ['liora', 'gun', '건', ['전체'], 5, R],
  ['liora', 'minwoo', '민우', ['전체'], 3, R],
  ['liora', 'harry', '해리', ['해리, 내 뒤에 있어'], 6, R],
  ['liora', 'malfoy', '말포이', ['해리, 내 뒤에 있어'], 1, R],
  ['liora', 'professor', '교수', ['해리, 내 뒤에 있어'], 24, R],
  ['liora', 'lulu', '루루', ['묘한 이야기'], 34, R],
  ['liora', 'mentor', '스승', ['묘한 이야기'], 27, R],
  ['liora', 'chaser', '추격자', ['UNCAGED'], 12, R],
  ['liora', 'dana', '단아', [], 33, R],
  ['liora', 'eunwoo', '은우', [], 29, R],
  ['milo', 'milo', '밀로', ['전체'], 20, [.24, .08, .3, .25]],
  ['milo', 'luna', '루나', ['전체'], 19, [.33, .05, .25, .21]],
  ['milo', 'leo', '레오', ['전체'], 18, [.13, .03, .17, .26]],
  ['milo', 'rival', '루나 라이벌', ['전체'], 21, [.08, .02, .2, .3]],
  ['milo', 'villain', '악당', ['전체'], 22, [.08, .04, .25, .33]],
  ['milo', 'kitten', '아기 고양이', ['전체'], 23, [.36, .12, .26, .46]],
];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(SRC);
  const out = {};
  for (const [ch, id, name, series, n, [x, y, w, h]] of L) {
    const f = files.find((s) => s.startsWith(`sheet-${String(n).padStart(2, '0')}.`));
    const { width: W, height: H } = await sharp(path.join(SRC, f)).metadata();
    const side = Math.round(Math.min(w * W, h * H));
    const cx = (x + w / 2) * W, top = y * H;
    await sharp(path.join(SRC, f))
      .extract({ left: Math.max(0, Math.round(cx - side / 2)), top: Math.round(top), width: side, height: side })
      .resize(240, 240).webp({ quality: 84 }).toFile(path.join(OUT, `${id}.webp`));
    (out[ch] ||= []).push({ name, series, img: `chars/${id}.webp` });
  }
  fs.writeFileSync(path.join(__dirname, '..', 'site', 'characters.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(Object.entries(out).map(([k, v]) => `${k}:${v.length}`).join(' '));
})();
