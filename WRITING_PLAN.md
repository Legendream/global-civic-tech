# Writing Plan — 文章素材庫

收存查證過、但暫不寫進當前文章的素材，供未來另成篇。每則素材附事實、來源與可信度註記。

---

## 方向總覽清單（更新：2026-06-10）

| 代號 | 方向 | 主體 | 狀態 | 素材 |
|------|------|------|------|------|
| A | **議會自己使用 AI 工具**（議事核心／檔案／整體導入） | 議會 | ✅ 已成稿（待存檔定稿） | 英國下議院 EQM 篩質詢、美國國會圖書館 FixIt+、英國 Warwickshire 郡議會 |
| B | **議會資料被外部／公民科技使用** | 議會（資料源）＋民間 | ⬜ 待整理成文 | 歐洲議會 MCP、肯亞 Hansard 工具、加拿大 Hansard app、法規轉 Git 引擎 |
| C | **議會作為政府科技政策的監督者**（問責視角） | 議會（監督方） | ⬜ 待整理成文 | 英國國會 GDS 緊急檢討、英國國會批評數位身分證計畫 |
| D | **行政部門用 AI 起草政策與法律** | 行政部門（被監督方） | ⬜ 待整理成文 | 英國 Defra、跨國盤點（Consult／義／巴／紐／愛沙尼亞／美） |

> 提醒：A 是「議會用 AI」、D 是「行政部門用 AI」、C 是「議會監督別人用科技」——三者主體不同，勿混為一談。

---

## 方向 C：議會作為政府科技政策的監督者

> 這條線聚焦**議會（議員、委員會）監督、問責政府的數位／科技決策**——議會不是科技的使用者，而是把關者。與方向 A（議會自己用 AI）剛好互補：一邊用工具優化內部，一邊監督政府的科技政策做得好不好。

### 素材

**1. 英國國會委員會對「政府數位服務（GDS）」緊急檢討**
- 內容：英國國會委員會對政府數位服務（GDS）進行緊急檢討，批評將 GDS 併入「科學、創新及科技部（DSIT）」的決定有誤。報告涉及繼任計畫、資本支出削減等議題，並對英國政府數位工作的未來方向提出建議。
- 切角：議會如何透過委員會審查，監督政府數位轉型的組織與資源安排。
- 標籤：public-service, transparency, open-data
- 來源：[Succession plans, cutting capital spend, and an urgent review of GDS — PublicTechnology（2026-06-05）](https://www.publictechnology.net/2026/06/05/science-technology-and-research/succession-plans-cutting-capital-spend-and-an-urgent-review-of-gds-a-closer-look-at-mps-digital-to-do-list-for-government/)

**2. 英國國會議員批評政府數位身分證計畫「倉促且考量不周」**
- 內容：某國會委員會批評政府數位身分識別（Digital ID）計畫推出倉促、考量不周，指出政府在公布提案的方式上有問題，削弱了公眾原本可能給予的支持。
- 切角：議會如何就「透明度與公眾參與不足」問責政府的數位政策決策程序。
- 標籤：transparency, e-participation, digital-rights
- 來源：[Digital ID plan was 'rushed and poorly thought through', MPs find — PublicTechnology（2026-05-27）](https://www.publictechnology.net/2026/05/27/society-and-welfare/digital-id-plan-was-rushed-and-poorly-thought-through-mps-find/)

### 可能的台灣對照角度
- 立法院如何監督行政院的數位政策（如數位部相關預算、政策推動）？是否有對應的委員會審查機制？
- 「科技政策的公眾參與與透明度」如何成為議會問責的標準。

---

## 方向 B：議會資料被外部／公民科技使用

> 這條線聚焦**議會把自己的資料（議事錄、法規、投票紀錄）開放出來，被外部開發者／公民科技拿去做應用**。議會是資料來源，民間是使用者。原始規劃中與方向 A「各寫一篇」。

### 素材（均來自 GitHub 專案，2026-05；無單一新聞 URL，使用時建議補查專案頁）
- **歐洲議會 MCP Server**：歐洲議會開放資料的協定伺服器，讓 AI 助理能結構化存取議會資料集。tags: open-data, transparency, e-participation, ai-governance
- **肯亞 Hansard 工具**：從 mzalendo.com 抓取、解析肯亞國會（國民議會與參議院）議事錄，提供結構化會議記錄供公眾查閱、監督議員。tags: open-data, transparency, e-participation
- **加拿大 Hansard 群聊 app**：將加拿大國會議事錄辯論轉成「群組聊天」形式的 iOS app，降低公民理解議事的門檻。tags: open-data, e-participation
- **法規轉 Git 開源引擎**：將官方法規轉為以 Git 版本控制的 Markdown，可搜尋、比對版本、追蹤法律演變。tags: open-data, transparency, open-source

### 可能的台灣對照角度
- 立法院的議事錄、法案、投票紀錄開放程度如何？是否有 g0v 等社群做過類似應用（如「立法院觀測站」）？

---

## 方向 D：行政部門用 AI 起草政策與法律

> 聚焦**行政部門（executive）的文官**用 AI 協助政策與法規起草，與「議會」是不同主體，故獨立成篇。牽涉法律效力、問責與監督的根本問題：當第一版草稿由 AI 產出，誰負責？怎麼稽核？

### 素材

**1. 英國 Defra（環境、食品及鄉村事務部）——探索用 AI 協助起草**
- 身分：英國**行政部門**（相當於我國環境部＋農業部），由其**內部文官**探索，與國會無關。
- 在做什麼（仍在「探索／試行 pilot」階段，未上線）：
  - 協助起草政策與法規
  - 對英國與其他司法管轄區（不同國家／地區）做法規比較分析
  - 支援簡報與往來信函製作
- 定位：工具用來「檢查、批評草稿」，不取代起草者；責任與最終定稿仍在官員。
- 監督：英國國會特別委員會預計追查——哪些政策用過 AI、試了哪些工具、產出如何稽核。
- 另有報導提到 Defra 用「代理式 AI（agentic AI）」建置文官作業手冊。
- 來源：[Defra explores use of AI to help officials drafting policy and legislation — PublicTechnology（2026-05-21）](https://www.publictechnology.net/2026/05/21/environment/defra-explores-use-of-ai-to-help-officials-drafting-policy-and-legislation/)

**2. 跨國盤點（TechPolicy.press 專文）——「各國政府用 AI 起草法律，會出什麼問題？」**
- 注意：此文**未提及 Defra**，是更宏觀的跨國現象盤點。談的工具與國家包括：
  - 英國「Consult」工具（Humphrey 系列）：分析公共諮詢回應（水資源改革）
  - 義大利：管理修正案、標記冗長杯葛（filibustering）
  - 巴西：分類立法材料
  - 紐西蘭：生成法案說明
  - 愛沙尼亞：檢查法案錯誤
  - 美國：為去管制（deregulation）草擬支持性文字
- 來源：[Governments Are Using AI To Draft Legislation. What Could Possibly Go Wrong? — TechPolicy.Press](https://www.techpolicy.press/governments-are-using-ai-to-draft-legislation-what-could-possibly-go-wrong/)

### 專家點出的通用風險（針對「政府用 AI 起草」現象，非單一案子）
- **模型脆弱性**（Joanna Bryson，柏林 Hertie School AI 倫理學者）：AI 一旦嵌入政府流程，服務中斷、模型突然改版、受制於廠商，都可能影響決策。
- **法律風險**（Philip Wallach，美國企業研究院）：AI 協助產出的法規若未走完法定程序，可能被法官以「恣意專斷（arbitrary and capricious）」為由撤銷；且「AI 產生的草稿一旦嵌入流程，錯誤未必看得出來」。
- **問責難題**：當 AI 寫出第一版草稿，監督到底有多少實效。
- **效益宣稱要存疑**（Ada Lovelace Institute）：公部門 AI 的生產力宣稱需更嚴格檢視，別讓單一研究就推動數十億英鎊支出。

### 可能的台灣對照角度
- 我國法制作業（法制局、各部會法規會）若導入 AI 起草，將面臨同樣的問責與法律效力問題。
- 與方向 A「議會使用 AI」形成對照：一個是議會（監督方），一個是行政（被監督方）導入 AI。

### 可信度註記
- Defra 的「探索階段、未上線、定位為輔助」等事實，來自 PublicTechnology 原始報導，可靠。
- 跨國盤點與專家風險評論，來自 TechPolicy.press，屬可靠評論來源；惟風險為**通論**，引用時勿掛在 Defra 名下。
