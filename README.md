# 猜字遊戲

多人中文猜字遊戲，使用注音提示。

## 遊戲規則

1. 3人以上參與：**猜字者**(1人)、**出題者**(1人)、**提示者**(其他人)
2. 出題者選一個「主字」(如：川)
3. 提示者輸入能與主字組成兩字詞的字(如：河 → 河川)
4. 系統將提示字轉成**注音**顯示給猜字者(河 → ㄏㄜˊ)
5. 猜字者根據注音猜出主字

## 技術架構

```
Guest-word/
├── apps/
│   ├── web/          # Next.js 14 前端
│   └── server/       # Express + Socket.IO 後端
├── packages/
│   └── shared/       # 共用型別定義
└── scripts/          # 工具腳本
```

### 前端 (apps/web)
- **框架**: Next.js 14 + TypeScript
- **樣式**: Tailwind CSS
- **狀態管理**: Zustand
- **即時通訊**: Socket.IO Client

### 後端 (apps/server)
- **框架**: Express + TypeScript
- **即時通訊**: Socket.IO (房間管理)
- **詞庫**: 萌典 86,850 個兩字詞
- **注音轉換**: pinyin 套件

### 核心服務 (apps/server/src/services/)
| 服務 | 功能 |
|------|------|
| `roomService.ts` | 房間建立/加入/離開、玩家管理 |
| `gameService.ts` | 遊戲流程、角色分配、計分 |
| `wordService.ts` | 詞庫驗證(主字+提示字是否成詞) |
| `zhuyinService.ts` | 中文轉注音 |

## 遊戲流程

```
WAITING → ROLE_ASSIGNMENT → WORD_SELECTION → HINT_PHASE → GUESS_PHASE → ROUND_END
                                                                            ↓
                                                          (下一回合或 GAME_END)
```

## 啟動方式

```bash
# 安裝依賴
npm install

# 編譯共用型別
npm run build:shared

# 啟動後端 (localhost:3001)
npm run dev:server

# 啟動前端 (localhost:3000)
npm run dev:web
```

## Socket 事件

### 房間
- `room:create` / `room:join` / `room:leave` / `room:ready`

### 遊戲
- `game:start` - 開始遊戲
- `game:selectWord` - 出題者選字
- `game:submitHint` - 提示者提交提示
- `game:guess` - 猜字者猜字

## 待開發功能

- [ ] 計時器
- [ ] 斷線重連
- [ ] 遊戲歷史記錄
- [ ] 更完整的 UI/UX
