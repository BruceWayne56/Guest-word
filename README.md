# 猜字遊戲

多人中文猜字遊戲，使用注音提示。

## 專案結構

```
Guest-word/
├── apps/
│   ├── web/          # Next.js 14 前端 (port 3000)
│   └── server/       # Express + Socket.IO 後端 (port 3001)
├── packages/
│   └── shared/       # 共用型別定義
```

**技術棧**: TypeScript, Next.js 14, Zustand, Express, Socket.IO, Tailwind CSS

## 遊戲規則

1. 3+ 人參與：猜字者(1)、出題者(1)、提示者(N)
2. 出題者選「主字」→ 提示者輸入能組成詞的字 → 系統轉注音 → 猜字者猜字

## 啟動方式

### 本機開發
```bash
npm install && npm run build:shared
npm run dev:server  # 終端 1
npm run dev:web     # 終端 2
```

### Cloudflare Tunnel（外部連線）
```bash
# 終端 1: 後端
npm run dev:server

# 終端 2: 後端 Tunnel
~/bin/cloudflared tunnel --url http://localhost:3001
# → 記下 URL (如 https://xxx.trycloudflare.com)

# 終端 3: 前端（用上面的 URL）
cd apps/web && NEXT_PUBLIC_SOCKET_URL="https://xxx.trycloudflare.com" npx next dev

# 終端 4: 前端 Tunnel
~/bin/cloudflared tunnel --url http://localhost:3000
# → 這個 URL 分享給其他人
```

安裝 cloudflared: `curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o ~/bin/cloudflared && chmod +x ~/bin/cloudflared`

## 核心檔案

| 檔案 | 用途 |
|------|------|
| `apps/server/src/services/roomService.ts` | 房間/玩家管理 |
| `apps/server/src/services/gameService.ts` | 遊戲流程、計分 |
| `apps/server/src/services/wordService.ts` | 詞庫驗證 (86,850 詞) |
| `apps/server/src/services/zhuyinService.ts` | 中文轉注音 |
| `apps/server/src/socket/index.ts` | Socket 事件處理 |
| `apps/web/src/stores/gameStore.ts` | 前端狀態管理 |
| `apps/web/src/app/room/[roomId]/page.tsx` | 遊戲房間頁面 |

## 待開發

- [ ] 計時器（超時自動下一階段）
- [ ] 斷線重連（遊戲狀態恢復）
- [ ] 遊戲歷史記錄
- [ ] Cloudflare 帳號固定域名

## 更新紀錄

### 2026-02-05
- **修復** 回合結束後卡住問題（閉包 bug、modal 未清除、狀態未重置）
- **改進** CORS 設定開放所有來源（開發用）
- **新增** Cloudflare Tunnel 部署方式
