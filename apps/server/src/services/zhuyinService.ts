// Zhuyin (Bopomofo) conversion service
// Uses pinyin library and converts to Zhuyin

import pinyinModule from 'pinyin';
const pinyin = pinyinModule.default || pinyinModule;

// Pinyin syllable to Zhuyin mapping
const INITIAL_MAP: Record<string, string> = {
  b: 'ㄅ', p: 'ㄆ', m: 'ㄇ', f: 'ㄈ',
  d: 'ㄉ', t: 'ㄊ', n: 'ㄋ', l: 'ㄌ',
  g: 'ㄍ', k: 'ㄎ', h: 'ㄏ',
  j: 'ㄐ', q: 'ㄑ', x: 'ㄒ',
  zh: 'ㄓ', ch: 'ㄔ', sh: 'ㄕ', r: 'ㄖ',
  z: 'ㄗ', c: 'ㄘ', s: 'ㄙ',
  y: '', w: '',
};

const FINAL_MAP: Record<string, string> = {
  a: 'ㄚ', o: 'ㄛ', e: 'ㄜ', i: 'ㄧ', u: 'ㄨ', v: 'ㄩ', ü: 'ㄩ',
  ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ',
  an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ',
  er: 'ㄦ',
  ia: 'ㄧㄚ', ie: 'ㄧㄝ', iao: 'ㄧㄠ', iu: 'ㄧㄡ', iou: 'ㄧㄡ',
  ian: 'ㄧㄢ', in: 'ㄧㄣ', iang: 'ㄧㄤ', ing: 'ㄧㄥ', iong: 'ㄩㄥ',
  ua: 'ㄨㄚ', uo: 'ㄨㄛ', uai: 'ㄨㄞ', ui: 'ㄨㄟ', uei: 'ㄨㄟ',
  uan: 'ㄨㄢ', un: 'ㄨㄣ', uen: 'ㄨㄣ', uang: 'ㄨㄤ', ong: 'ㄨㄥ', ueng: 'ㄨㄥ',
  ve: 'ㄩㄝ', ue: 'ㄩㄝ', van: 'ㄩㄢ', yuan: 'ㄩㄢ', vn: 'ㄩㄣ', yun: 'ㄩㄣ',
  // Special cases
  yi: 'ㄧ', wu: 'ㄨ', yu: 'ㄩ',
  ya: 'ㄧㄚ', ye: 'ㄧㄝ', yao: 'ㄧㄠ', you: 'ㄧㄡ',
  yan: 'ㄧㄢ', yin: 'ㄧㄣ', yang: 'ㄧㄤ', ying: 'ㄧㄥ', yong: 'ㄩㄥ',
  wa: 'ㄨㄚ', wo: 'ㄨㄛ', wai: 'ㄨㄞ', wei: 'ㄨㄟ',
  wan: 'ㄨㄢ', wen: 'ㄨㄣ', wang: 'ㄨㄤ', weng: 'ㄨㄥ',
  yue: 'ㄩㄝ', yuan: 'ㄩㄢ', yun: 'ㄩㄣ',
};

// Tone marks
const TONE_MARKS: Record<string, string> = {
  '1': '', // First tone - no mark or use ˉ
  '2': 'ˊ',
  '3': 'ˇ',
  '4': 'ˋ',
  '5': '˙', // Neutral tone
};

// Full pinyin syllable to zhuyin mapping for common syllables
const SYLLABLE_MAP: Record<string, string> = {
  // A
  a: 'ㄚ', ai: 'ㄞ', an: 'ㄢ', ang: 'ㄤ', ao: 'ㄠ',
  // B
  ba: 'ㄅㄚ', bai: 'ㄅㄞ', ban: 'ㄅㄢ', bang: 'ㄅㄤ', bao: 'ㄅㄠ',
  bei: 'ㄅㄟ', ben: 'ㄅㄣ', beng: 'ㄅㄥ', bi: 'ㄅㄧ', bian: 'ㄅㄧㄢ',
  biao: 'ㄅㄧㄠ', bie: 'ㄅㄧㄝ', bin: 'ㄅㄧㄣ', bing: 'ㄅㄧㄥ', bo: 'ㄅㄛ', bu: 'ㄅㄨ',
  // C
  ca: 'ㄘㄚ', cai: 'ㄘㄞ', can: 'ㄘㄢ', cang: 'ㄘㄤ', cao: 'ㄘㄠ',
  ce: 'ㄘㄜ', cen: 'ㄘㄣ', ceng: 'ㄘㄥ', ci: 'ㄘ', cong: 'ㄘㄨㄥ',
  cou: 'ㄘㄡ', cu: 'ㄘㄨ', cuan: 'ㄘㄨㄢ', cui: 'ㄘㄨㄟ', cun: 'ㄘㄨㄣ', cuo: 'ㄘㄨㄛ',
  // CH
  cha: 'ㄔㄚ', chai: 'ㄔㄞ', chan: 'ㄔㄢ', chang: 'ㄔㄤ', chao: 'ㄔㄠ',
  che: 'ㄔㄜ', chen: 'ㄔㄣ', cheng: 'ㄔㄥ', chi: 'ㄔ', chong: 'ㄔㄨㄥ',
  chou: 'ㄔㄡ', chu: 'ㄔㄨ', chuai: 'ㄔㄨㄞ', chuan: 'ㄔㄨㄢ', chuang: 'ㄔㄨㄤ',
  chui: 'ㄔㄨㄟ', chun: 'ㄔㄨㄣ', chuo: 'ㄔㄨㄛ',
  // D
  da: 'ㄉㄚ', dai: 'ㄉㄞ', dan: 'ㄉㄢ', dang: 'ㄉㄤ', dao: 'ㄉㄠ',
  de: 'ㄉㄜ', dei: 'ㄉㄟ', den: 'ㄉㄣ', deng: 'ㄉㄥ', di: 'ㄉㄧ',
  dia: 'ㄉㄧㄚ', dian: 'ㄉㄧㄢ', diao: 'ㄉㄧㄠ', die: 'ㄉㄧㄝ', ding: 'ㄉㄧㄥ',
  diu: 'ㄉㄧㄡ', dong: 'ㄉㄨㄥ', dou: 'ㄉㄡ', du: 'ㄉㄨ', duan: 'ㄉㄨㄢ',
  dui: 'ㄉㄨㄟ', dun: 'ㄉㄨㄣ', duo: 'ㄉㄨㄛ',
  // E
  e: 'ㄜ', ei: 'ㄟ', en: 'ㄣ', eng: 'ㄥ', er: 'ㄦ',
  // F
  fa: 'ㄈㄚ', fan: 'ㄈㄢ', fang: 'ㄈㄤ', fei: 'ㄈㄟ', fen: 'ㄈㄣ',
  feng: 'ㄈㄥ', fo: 'ㄈㄛ', fou: 'ㄈㄡ', fu: 'ㄈㄨ',
  // G
  ga: 'ㄍㄚ', gai: 'ㄍㄞ', gan: 'ㄍㄢ', gang: 'ㄍㄤ', gao: 'ㄍㄠ',
  ge: 'ㄍㄜ', gei: 'ㄍㄟ', gen: 'ㄍㄣ', geng: 'ㄍㄥ', gong: 'ㄍㄨㄥ',
  gou: 'ㄍㄡ', gu: 'ㄍㄨ', gua: 'ㄍㄨㄚ', guai: 'ㄍㄨㄞ', guan: 'ㄍㄨㄢ',
  guang: 'ㄍㄨㄤ', gui: 'ㄍㄨㄟ', gun: 'ㄍㄨㄣ', guo: 'ㄍㄨㄛ',
  // H
  ha: 'ㄏㄚ', hai: 'ㄏㄞ', han: 'ㄏㄢ', hang: 'ㄏㄤ', hao: 'ㄏㄠ',
  he: 'ㄏㄜ', hei: 'ㄏㄟ', hen: 'ㄏㄣ', heng: 'ㄏㄥ', hong: 'ㄏㄨㄥ',
  hou: 'ㄏㄡ', hu: 'ㄏㄨ', hua: 'ㄏㄨㄚ', huai: 'ㄏㄨㄞ', huan: 'ㄏㄨㄢ',
  huang: 'ㄏㄨㄤ', hui: 'ㄏㄨㄟ', hun: 'ㄏㄨㄣ', huo: 'ㄏㄨㄛ',
  // J
  ji: 'ㄐㄧ', jia: 'ㄐㄧㄚ', jian: 'ㄐㄧㄢ', jiang: 'ㄐㄧㄤ', jiao: 'ㄐㄧㄠ',
  jie: 'ㄐㄧㄝ', jin: 'ㄐㄧㄣ', jing: 'ㄐㄧㄥ', jiong: 'ㄐㄩㄥ', jiu: 'ㄐㄧㄡ',
  ju: 'ㄐㄩ', juan: 'ㄐㄩㄢ', jue: 'ㄐㄩㄝ', jun: 'ㄐㄩㄣ',
  // K
  ka: 'ㄎㄚ', kai: 'ㄎㄞ', kan: 'ㄎㄢ', kang: 'ㄎㄤ', kao: 'ㄎㄠ',
  ke: 'ㄎㄜ', kei: 'ㄎㄟ', ken: 'ㄎㄣ', keng: 'ㄎㄥ', kong: 'ㄎㄨㄥ',
  kou: 'ㄎㄡ', ku: 'ㄎㄨ', kua: 'ㄎㄨㄚ', kuai: 'ㄎㄨㄞ', kuan: 'ㄎㄨㄢ',
  kuang: 'ㄎㄨㄤ', kui: 'ㄎㄨㄟ', kun: 'ㄎㄨㄣ', kuo: 'ㄎㄨㄛ',
  // L
  la: 'ㄌㄚ', lai: 'ㄌㄞ', lan: 'ㄌㄢ', lang: 'ㄌㄤ', lao: 'ㄌㄠ',
  le: 'ㄌㄜ', lei: 'ㄌㄟ', leng: 'ㄌㄥ', li: 'ㄌㄧ', lia: 'ㄌㄧㄚ',
  lian: 'ㄌㄧㄢ', liang: 'ㄌㄧㄤ', liao: 'ㄌㄧㄠ', lie: 'ㄌㄧㄝ', lin: 'ㄌㄧㄣ',
  ling: 'ㄌㄧㄥ', liu: 'ㄌㄧㄡ', long: 'ㄌㄨㄥ', lou: 'ㄌㄡ', lu: 'ㄌㄨ',
  luan: 'ㄌㄨㄢ', lun: 'ㄌㄨㄣ', luo: 'ㄌㄨㄛ', lv: 'ㄌㄩ', lve: 'ㄌㄩㄝ',
  // M
  ma: 'ㄇㄚ', mai: 'ㄇㄞ', man: 'ㄇㄢ', mang: 'ㄇㄤ', mao: 'ㄇㄠ',
  me: 'ㄇㄜ', mei: 'ㄇㄟ', men: 'ㄇㄣ', meng: 'ㄇㄥ', mi: 'ㄇㄧ',
  mian: 'ㄇㄧㄢ', miao: 'ㄇㄧㄠ', mie: 'ㄇㄧㄝ', min: 'ㄇㄧㄣ', ming: 'ㄇㄧㄥ',
  miu: 'ㄇㄧㄡ', mo: 'ㄇㄛ', mou: 'ㄇㄡ', mu: 'ㄇㄨ',
  // N
  na: 'ㄋㄚ', nai: 'ㄋㄞ', nan: 'ㄋㄢ', nang: 'ㄋㄤ', nao: 'ㄋㄠ',
  ne: 'ㄋㄜ', nei: 'ㄋㄟ', nen: 'ㄋㄣ', neng: 'ㄋㄥ', ni: 'ㄋㄧ',
  nian: 'ㄋㄧㄢ', niang: 'ㄋㄧㄤ', niao: 'ㄋㄧㄠ', nie: 'ㄋㄧㄝ', nin: 'ㄋㄧㄣ',
  ning: 'ㄋㄧㄥ', niu: 'ㄋㄧㄡ', nong: 'ㄋㄨㄥ', nou: 'ㄋㄡ', nu: 'ㄋㄨ',
  nuan: 'ㄋㄨㄢ', nun: 'ㄋㄨㄣ', nuo: 'ㄋㄨㄛ', nv: 'ㄋㄩ', nve: 'ㄋㄩㄝ',
  // O
  o: 'ㄛ', ou: 'ㄡ',
  // P
  pa: 'ㄆㄚ', pai: 'ㄆㄞ', pan: 'ㄆㄢ', pang: 'ㄆㄤ', pao: 'ㄆㄠ',
  pei: 'ㄆㄟ', pen: 'ㄆㄣ', peng: 'ㄆㄥ', pi: 'ㄆㄧ', pian: 'ㄆㄧㄢ',
  piao: 'ㄆㄧㄠ', pie: 'ㄆㄧㄝ', pin: 'ㄆㄧㄣ', ping: 'ㄆㄧㄥ', po: 'ㄆㄛ',
  pou: 'ㄆㄡ', pu: 'ㄆㄨ',
  // Q
  qi: 'ㄑㄧ', qia: 'ㄑㄧㄚ', qian: 'ㄑㄧㄢ', qiang: 'ㄑㄧㄤ', qiao: 'ㄑㄧㄠ',
  qie: 'ㄑㄧㄝ', qin: 'ㄑㄧㄣ', qing: 'ㄑㄧㄥ', qiong: 'ㄑㄩㄥ', qiu: 'ㄑㄧㄡ',
  qu: 'ㄑㄩ', quan: 'ㄑㄩㄢ', que: 'ㄑㄩㄝ', qun: 'ㄑㄩㄣ',
  // R
  ran: 'ㄖㄢ', rang: 'ㄖㄤ', rao: 'ㄖㄠ', re: 'ㄖㄜ', ren: 'ㄖㄣ',
  reng: 'ㄖㄥ', ri: 'ㄖ', rong: 'ㄖㄨㄥ', rou: 'ㄖㄡ', ru: 'ㄖㄨ',
  ruan: 'ㄖㄨㄢ', rui: 'ㄖㄨㄟ', run: 'ㄖㄨㄣ', ruo: 'ㄖㄨㄛ',
  // S
  sa: 'ㄙㄚ', sai: 'ㄙㄞ', san: 'ㄙㄢ', sang: 'ㄙㄤ', sao: 'ㄙㄠ',
  se: 'ㄙㄜ', sen: 'ㄙㄣ', seng: 'ㄙㄥ', si: 'ㄙ', song: 'ㄙㄨㄥ',
  sou: 'ㄙㄡ', su: 'ㄙㄨ', suan: 'ㄙㄨㄢ', sui: 'ㄙㄨㄟ', sun: 'ㄙㄨㄣ', suo: 'ㄙㄨㄛ',
  // SH
  sha: 'ㄕㄚ', shai: 'ㄕㄞ', shan: 'ㄕㄢ', shang: 'ㄕㄤ', shao: 'ㄕㄠ',
  she: 'ㄕㄜ', shei: 'ㄕㄟ', shen: 'ㄕㄣ', sheng: 'ㄕㄥ', shi: 'ㄕ',
  shou: 'ㄕㄡ', shu: 'ㄕㄨ', shua: 'ㄕㄨㄚ', shuai: 'ㄕㄨㄞ', shuan: 'ㄕㄨㄢ',
  shuang: 'ㄕㄨㄤ', shui: 'ㄕㄨㄟ', shun: 'ㄕㄨㄣ', shuo: 'ㄕㄨㄛ',
  // T
  ta: 'ㄊㄚ', tai: 'ㄊㄞ', tan: 'ㄊㄢ', tang: 'ㄊㄤ', tao: 'ㄊㄠ',
  te: 'ㄊㄜ', teng: 'ㄊㄥ', ti: 'ㄊㄧ', tian: 'ㄊㄧㄢ', tiao: 'ㄊㄧㄠ',
  tie: 'ㄊㄧㄝ', ting: 'ㄊㄧㄥ', tong: 'ㄊㄨㄥ', tou: 'ㄊㄡ', tu: 'ㄊㄨ',
  tuan: 'ㄊㄨㄢ', tui: 'ㄊㄨㄟ', tun: 'ㄊㄨㄣ', tuo: 'ㄊㄨㄛ',
  // W
  wa: 'ㄨㄚ', wai: 'ㄨㄞ', wan: 'ㄨㄢ', wang: 'ㄨㄤ', wei: 'ㄨㄟ',
  wen: 'ㄨㄣ', weng: 'ㄨㄥ', wo: 'ㄨㄛ', wu: 'ㄨ',
  // X
  xi: 'ㄒㄧ', xia: 'ㄒㄧㄚ', xian: 'ㄒㄧㄢ', xiang: 'ㄒㄧㄤ', xiao: 'ㄒㄧㄠ',
  xie: 'ㄒㄧㄝ', xin: 'ㄒㄧㄣ', xing: 'ㄒㄧㄥ', xiong: 'ㄒㄩㄥ', xiu: 'ㄒㄧㄡ',
  xu: 'ㄒㄩ', xuan: 'ㄒㄩㄢ', xue: 'ㄒㄩㄝ', xun: 'ㄒㄩㄣ',
  // Y
  ya: 'ㄧㄚ', yan: 'ㄧㄢ', yang: 'ㄧㄤ', yao: 'ㄧㄠ', ye: 'ㄧㄝ',
  yi: 'ㄧ', yin: 'ㄧㄣ', ying: 'ㄧㄥ', yo: 'ㄧㄛ', yong: 'ㄩㄥ',
  you: 'ㄧㄡ', yu: 'ㄩ', yuan: 'ㄩㄢ', yue: 'ㄩㄝ', yun: 'ㄩㄣ',
  // Z
  za: 'ㄗㄚ', zai: 'ㄗㄞ', zan: 'ㄗㄢ', zang: 'ㄗㄤ', zao: 'ㄗㄠ',
  ze: 'ㄗㄜ', zei: 'ㄗㄟ', zen: 'ㄗㄣ', zeng: 'ㄗㄥ', zi: 'ㄗ',
  zong: 'ㄗㄨㄥ', zou: 'ㄗㄡ', zu: 'ㄗㄨ', zuan: 'ㄗㄨㄢ', zui: 'ㄗㄨㄟ',
  zun: 'ㄗㄨㄣ', zuo: 'ㄗㄨㄛ',
  // ZH
  zha: 'ㄓㄚ', zhai: 'ㄓㄞ', zhan: 'ㄓㄢ', zhang: 'ㄓㄤ', zhao: 'ㄓㄠ',
  zhe: 'ㄓㄜ', zhei: 'ㄓㄟ', zhen: 'ㄓㄣ', zheng: 'ㄓㄥ', zhi: 'ㄓ',
  zhong: 'ㄓㄨㄥ', zhou: 'ㄓㄡ', zhu: 'ㄓㄨ', zhua: 'ㄓㄨㄚ', zhuai: 'ㄓㄨㄞ',
  zhuan: 'ㄓㄨㄢ', zhuang: 'ㄓㄨㄤ', zhui: 'ㄓㄨㄟ', zhun: 'ㄓㄨㄣ', zhuo: 'ㄓㄨㄛ',
};

export class ZhuyinService {
  charToZhuyin(char: string): string {
    if (char.length !== 1) {
      throw new Error('Input must be a single character');
    }

    try {
      // Use pinyin library to get pinyin with tone number
      const result = pinyin(char, {
        style: pinyin.STYLE_TONE2, // e.g., "li4" for 力
        heteronym: false,
      });

      if (!result || !result[0] || !result[0][0]) {
        return char; // Fallback to original character
      }

      const pinyinWithTone = result[0][0].toLowerCase();
      return this.pinyinToZhuyin(pinyinWithTone);
    } catch (error) {
      console.error('Zhuyin conversion error:', error);
      return char; // Fallback to original character
    }
  }

  private pinyinToZhuyin(pinyinWithTone: string): string {
    // Extract tone number (1-5) from the end
    const toneMatch = pinyinWithTone.match(/([a-zü]+)(\d)?$/i);
    if (!toneMatch) {
      return pinyinWithTone;
    }

    const syllable = toneMatch[1].toLowerCase();
    const tone = toneMatch[2] || '1';

    // Look up in syllable map
    const zhuyin = SYLLABLE_MAP[syllable];
    if (zhuyin) {
      return zhuyin + (TONE_MARKS[tone] || '');
    }

    // Fallback: return original
    return pinyinWithTone;
  }

  isValidZhuyin(input: string): boolean {
    const zhuyinPattern = /^[ㄅ-ㄩ]+[ˊˇˋ˙]?$/;
    return zhuyinPattern.test(input);
  }

  isLoaded(): boolean {
    return true;
  }

  getLoadedCount(): number {
    return Object.keys(SYLLABLE_MAP).length;
  }
}
