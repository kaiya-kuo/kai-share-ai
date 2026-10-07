# skills/

這個資料夾保留給之後要分享出去的 skill（目前尚無項目）。

## 之後要新增一個 skill 時的步驟

1. 在這裡建立 `skills/<skill-name>/`，裡面放：
   - `.claude-plugin/plugin.json` — plugin 描述檔，例如：
     ```json
     { "name": "<skill-name>", "version": "0.1.0", "description": "<一句話說明>" }
     ```
   - `skills/<skill-name>/SKILL.md` — skill 本體（連同它需要的 scripts/references 等支援檔案）
2. 在 repo 根目錄的 `.claude-plugin/marketplace.json` 的 `plugins` 陣列裡加一筆：
   ```json
   { "name": "<skill-name>", "source": "./skills/<skill-name>", "description": "<一句話說明>" }
   ```
3. 推上這個 repo，之後受邀協作者就能用同一套安裝指令裝到這個 skill：
   ```
   /plugin install <skill-name> --marketplace kaiya-kuo/kai-share-ai
   ```
