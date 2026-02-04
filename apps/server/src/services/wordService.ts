import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { HintValidation } from '@guest-word/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface WordIndex {
  startsWith: Map<string, string[]>; // char -> words starting with that char
  endsWith: Map<string, string[]>;   // char -> words ending with that char
  allWords: Set<string>;
}

export class WordService {
  private wordIndex: WordIndex = {
    startsWith: new Map(),
    endsWith: new Map(),
    allWords: new Set(),
  };
  private loaded = false;

  constructor() {
    this.loadDictionary();
  }

  private loadDictionary(): void {
    // Try to load pre-processed dictionary
    const dataPath = join(__dirname, '../../data/words/two-char-words.json');

    if (existsSync(dataPath)) {
      try {
        const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
        this.buildIndex(data.words || data);
        console.log(`Loaded ${this.wordIndex.allWords.size} two-character words`);
      } catch (error) {
        console.warn('Failed to load dictionary, using fallback:', error);
        this.loadFallbackDictionary();
      }
    } else {
      console.log('Dictionary file not found, using fallback dictionary');
      this.loadFallbackDictionary();
    }
    this.loaded = true;
  }

  private loadFallbackDictionary(): void {
    // Common two-character words as fallback
    const commonWords = [
      // Water related
      '河川', '江河', '河流', '湖泊', '大海', '海水', '泉水', '溪流', '波浪', '流水',
      // Nature
      '山林', '森林', '樹木', '花草', '草地', '天地', '天空', '地面', '風雨', '雨水',
      '下雨', '大雪', '雲霧', '日月', '月亮', '星星', '太陽', '陽光',
      // Body
      '手腳', '頭髮', '眼睛', '耳朵', '口舌', '心臟', '身體', '面子', '雙手', '左手', '右手',
      // Common words
      '大人', '小孩', '好人', '美人', '新人', '老人', '學生', '老師', '書本', '文字',
      '車子', '道路', '門口', '窗戶', '房子', '房屋', '城市', '鄉村', '國家', '人民',
      // Food
      '吃飯', '喝茶', '茶水', '米飯', '麵條', '肉類', '蔬菜', '水果', '糖果', '食物',
      // Time
      '時間', '年月', '今天', '明天', '昨天', '早上', '晚上', '春天', '夏天', '秋天', '冬天',
      // Actions
      '走路', '跑步', '飛行', '看見', '聽見', '說話', '想法', '做事', '工作', '學習',
      '開門', '關門', '來去', '進出', '起來', '下去', '上來',
      // Colors
      '紅色', '黃色', '藍色', '綠色', '白色', '黑色', '青色', '紫色', '金色', '銀色',
      // Animals
      '馬匹', '牛肉', '羊肉', '豬肉', '小狗', '小貓', '飛鳥', '游魚', '昆蟲', '恐龍',
      // Numbers
      '一二', '二三', '三四', '四五', '五六', '六七', '七八', '八九', '九十', '百萬', '千萬',
      // Directions
      '東西', '南北', '中間', '上下', '左右', '前後', '內外', '東方', '西方', '南方', '北方',
      // More common
      '大小', '多少', '好壞', '美醜', '新舊', '長短', '高低', '快慢', '強弱', '真假',
      '正反', '是非', '有無', '可能', '應該', '必須', '希望', '相信', '知道', '明白',
      // Compounds
      '電話', '電腦', '電視', '手機', '網路', '音樂', '電影', '圖書', '雜誌', '報紙',
      '公司', '工廠', '學校', '醫院', '銀行', '商店', '餐廳', '旅館', '車站', '機場',
      // Emotions
      '快樂', '幸福', '開心', '難過', '生氣', '害怕', '驚訝', '感動', '喜歡', '討厭',
    ];

    this.buildIndex(commonWords);
  }

  private buildIndex(words: string[]): void {
    for (const word of words) {
      if (word.length !== 2) continue;

      const [char1, char2] = word;
      this.wordIndex.allWords.add(word);

      // Index by first character
      if (!this.wordIndex.startsWith.has(char1)) {
        this.wordIndex.startsWith.set(char1, []);
      }
      this.wordIndex.startsWith.get(char1)!.push(word);

      // Index by second character
      if (!this.wordIndex.endsWith.has(char2)) {
        this.wordIndex.endsWith.set(char2, []);
      }
      this.wordIndex.endsWith.get(char2)!.push(word);
    }
  }

  validateHint(mainChar: string, hintChar: string): HintValidation {
    // Check if hint + main forms a word (hint before main)
    const wordBefore = hintChar + mainChar;
    const isValidBefore = this.wordIndex.allWords.has(wordBefore);

    // Check if main + hint forms a word (hint after main)
    const wordAfter = mainChar + hintChar;
    const isValidAfter = this.wordIndex.allWords.has(wordAfter);

    if (!isValidBefore && !isValidAfter) {
      return {
        valid: false,
        reason: `「${hintChar}」和「${mainChar}」無法組成有效的兩字詞`,
      };
    }

    return {
      valid: true,
      word: isValidBefore ? wordBefore : wordAfter,
      position: isValidBefore ? 'before' : 'after',
    };
  }

  getWordsForChar(char: string): string[] {
    const startWords = this.wordIndex.startsWith.get(char) || [];
    const endWords = this.wordIndex.endsWith.get(char) || [];
    return [...new Set([...startWords, ...endWords])];
  }

  hasEnoughWords(char: string, minCount: number = 3): boolean {
    return this.getWordsForChar(char).length >= minCount;
  }

  getRandomMainChar(minWords: number = 5): string | null {
    const candidates: string[] = [];

    for (const [char, words] of this.wordIndex.startsWith) {
      const endWords = this.wordIndex.endsWith.get(char) || [];
      const totalWords = words.length + endWords.length;
      if (totalWords >= minWords) {
        candidates.push(char);
      }
    }

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getWordCount(): number {
    return this.wordIndex.allWords.size;
  }
}
