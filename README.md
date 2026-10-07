# kai-share-ai

Kaiya 的 Claude Code 插件分享庫，邀請制私有倉庫，收錄可直接安裝的 **mods**（插件／hooks 模組）與 **skill**。

```
kai-share-ai/
├── .claude-plugin/marketplace.json   ← 列出本 repo 所有可安裝項目
├── mods/                             ← 已分享的 mod（hooks 模組）
│   └── usage-band/
└── skills/                           ← 保留給之後分享的 skill（目前尚無項目，見 skills/README.md）
```

## 安裝

受邀協作者在 Claude Code 終端機 session 輸入：

```
/plugin install usage-band --marketplace kaiya-kuo/kai-share-ai
```

接著依序：
1. `Add marketplace?` → 輸入 `y` 加入這個 marketplace
2. 確認插件詳情
3. 選擇安裝範圍（scope），預設選 `user` 即可（所有專案都會套用）
4. 看到 `Installed usage-band. Plugin is now active.` 即完成，之後每次開新 session 會自動載入

> 這是私有 repo，受邀協作者需要先被加為 GitHub Collaborator、且本機已設定好可存取私有 repo 的 Git 認證，才能完成安裝。

## 目前收錄

| 項目 | 類型 | 版本 | 說明 |
|---|---|---|---|
| `usage-band` | mod | 0.1.0 | 在輸入框上方常駐顯示 5 小時／7 天額度用量、額度重置倒數、累積 token 數與本次 session 花費 |

## 更新／移除 usage-band

- 改樣式：編輯 `mods/usage-band/hooks/render.ts` 後執行 `/reload-plugins`（開發中即時生效；已安裝的使用者需等下次發布更新）
- 移除：`claude plugin uninstall usage-band@kai-share-ai`
