---
title: 英、美兩國嘗試將 AI 導入國會，降低重複作業
date: 2026-06-10
author: Claire Cheng
coedit: 與 AI 協作編輯
excerpt: 英國和美國的議會如何導入 AI、用在哪些面向，又有什麼考量？三個從重複作業下手的案例。
---

講到政府導入 AI，我們最常想到的是面向民眾的服務：線上申辦、智慧客服、聊天機器人。比較少被談的，是國會與立法院「內部」的幕僚作業，有沒有可能導入 AI、做到數位轉型？這牽涉到的不只是使用新科技，而是更深層的重新設計作業流程。這篇就來整理英國和美國的議會如何導入 AI、用在哪些面向，又有什麼考量。

本篇列舉三個案例，它們的做法很一致：不是讓 AI 全面接管，而是挑最磨人的重複勞動下手，把苦差事交給 AI 做，判斷的權利保留給人。

## 英國下議院：用 AI 篩選重複出現的質詢，提高「監督」的效率與精準度

在英國下議院，議員可以對政府各部門提出「書面質詢」（書面提問、要求部長答覆，是國會監督政府的重要工具）。這幾年提問量暴增，處理質詢的議事人員人力相當吃緊；而量一大，就會冒出一個老問題：很多題目，其實之前有人問過了。

下議院的做法，是在既有的質詢系統 EQM（下議院內部用來編輯、處理書面質詢的系統）裡，加上一個 AI 功能。當新質詢進來時，[它會自動比對過去的質詢，把相似度達 **80% 以上**的舊題目找出來](https://www.publictechnology.net/2026/06/02/government-and-politics/parliament-taps-ai-to-help-process-mps-questions/)、列給職員參考。

這套工具的使用者是議會的職員，不是行政機關。AI 輔助的對象，是議事處（Table Office，負責受理、編輯議員質詢與議事文件的單位，名稱與台灣立法院的議事處剛好相同）裡的議事人員。它不是政府拿來擋議員的工具，而是議會內部幫職員減負的幫手；而且 AI 只負責找出疑似重複，這題算不算數、要不要受理，最後仍由職員乃至議長（Speaker）定奪。

「擋重複質詢」是英國行之有年的議事規則。根據英國國會議事程序的權威典籍《Erskine May》，[同一會期內、實質重複已答覆過的書面質詢，會被退回](https://erskinemay.parliament.uk/section/4950/questions-already-answered-or-to-which-an-answer-has-been-refused)（若部長當初拒答，議員隔三個月之後可再提問）。AI 只是讓「找出重複」這道程序加速。

那台灣呢？[《立法院職權行使法》](https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=A0020058)並未禁止重複質詢，也沒有由議事人員在收件時比對重複的機制，實務上多由主席當場裁示。

## 美國國會圖書館：堆積如山的歷史檔案，靠 AI 和志工加速數位轉檔

第二個例子，場景換到檔案室。

美國國會圖書館（Library of Congress）隸屬於美國國會，最早是為議員做立法研究而設，後來成為實質上的國家圖書館。它手上握有數十年的歷史檔案，例如大量公共廣播錄音。這些東西很珍貴，但因為沒有文字稿，幾乎無法檢索。

美國國會圖書館與 GBH（波士頓的公共媒體機構，也是美國公共電視網 PBS 最大的節目製作者）[合作開發 FixIt+](https://fixitplus.americanarchive.org/)。[做法分兩步](https://www.nextgov.com/artificial-intelligence/2026/05/how-library-congress-using-both-ai-and-volunteers-unlock-public-broadcasting-history/413742/)：先讓 AI 把錄音轉成逐字稿打底，再交給開放給大眾的[志工社群](https://crowd.loc.gov/)校對潤飾。

值得看的是它怎麼讓陌生志工協作而不亂：志工直接在逐字稿的某一行輸入修正，存檔後，這筆修改會讓其他志工檢視。校對的志工可以核可、或提出不同改法，要到達成共識才算完成。國會圖書館把這套流程叫「人在迴路」（human-in-the-loop，由人來審核、修正機器產出的結果）：AI 做規模化的粗活，人類把關品質。AI 與人類組隊，把沉睡的歷史內容轉換為數位新生，讓資料能在網路上被更多人找到。

![FixIt+ 的介面，讓志工可以分句聆聽音檔，協助校對逐字稿。](/images/articles/uk-us-parliament-ai/fixit-plus.png)

*圖說：FixIt+ 的介面，讓志工可以分句聆聽音檔，協助校對逐字稿。*

國會圖書館的 AI 企圖不只如此。據 [FedScoop 報導](https://fedscoop.com/library-of-congress-ai-funding-request/)，它另外向參議院申請了 540 萬美元，要建一個「企業級 AI 平台」。這個平台和 FixIt+ 是不同的案子，主要支援國會研究服務處（Congressional Research Service，替國會議員做立法研究的單位）的法案分析，光是這屆就有超過一萬四千件法案待處理，編制卻只有 12 人。代理館長說，少了安全的平台，這批工作就走不動。

## 英國地方議會：與其單點試水溫，不如整盤一起規劃

前兩個都是針對單一業務的「單點工具」。最後這個案例，示範的是「整盤端上來」，而且規模是地方議會就辦得到的。

根據 [PublicTechnology](https://www.publictechnology.net/2026/05/14/communities-housing-and-planning/warwickshire-seeks-partner-for-2-4m-ai-drive/) 與 [UKAuthority](https://www.ukauthority.com/articles/warwickshire-county-council-seeks-ai-partner) 的報導，英國 Warwickshire 郡議會啟動了一項為期兩年、全議會範圍的 AI 採購案，公開徵求合作夥伴，合約上限兩百四十萬英鎊（含稅；議會坦言目前已核准的額度其實是一百萬英鎊），預計從 2026 年 9 月跑到 2028 年 9 月。

計畫涵蓋六類應用：語音轉錄、文件自動生成、報告撰寫、口譯、筆譯，以及聊天機器人等數位助理工具。得標夥伴要建立機制，讓議會員工透過內部網站、以受控權限取用這些工具，等於是一整套給內部公務人員日常作業用的工具箱。

它真正值得學的不是某個工具，而是那套做法：編預算、訂期程、找外部夥伴，還把符合資料保護法規、對齊政府「AI 使用準則」（AI Playbook，英國政府發布的 AI 導入指引）寫進要求，甚至特別歡迎中小企業投標。它把導入 AI 當成有規劃、有治理的整體專案，而不是隨手試試水溫。

## 那臺灣呢？我們可以從哪裡開始嘗試將 AI 導入立法院？

三個例子擺在一起，有三個共通點。

**一，都挑幕僚最痛的重複勞動下手。** 重複質詢、檔案整理、文書與翻譯，選的全不是最炫的應用，而是最磨人的苦工。

**二，都守著「AI 做苦工、人來判斷」這條線。** 下議院最後由職員與議長定奪，國會圖書館靠志工共識決，AI 都只做初步處理，判斷與品質責任仍在人手上。很多人對 AI 的第一個擔心是「會不會取代我」，而這些案例給的答案是：AI 接手的是苦工，不是判斷。這不是取代，是減負。

**三，都沒想著一步到位。** 連美國國會圖書館那麼大的機構，也是先從「轉錄歷史錄音」這件小事做起，再慢慢長成整套平台。

這些做法還橫跨了不同層級：中央議會、隸屬國會的機構，到地方議會，幾乎把立法院能對照的位置都涵蓋了。

臺灣立法院有可能嘗試導入 AI 嗎？或許可從他山之石開始借鑑。這些國際案例讓我們看見：這條路走得通，而且可以從很小的地方開始探討：**立法院文官每天的作業流程裡，哪一段最重複、最花時間？那會不會，剛好就是可以先試試看的地方？**

---

### 資料來源

- [Parliament taps AI to help process MPs' questions — PublicTechnology（2026-06-02）](https://www.publictechnology.net/2026/06/02/government-and-politics/parliament-taps-ai-to-help-process-mps-questions/)
- [Questions already answered, or to which an answer has been refused — Erskine May, UK Parliament](https://erskinemay.parliament.uk/section/4950/questions-already-answered-or-to-which-an-answer-has-been-refused)
- [立法院職權行使法 — 全國法規資料庫](https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=A0020058)
- [How the Library of Congress is using both AI and volunteers to unlock public broadcasting history — Nextgov（2026-05-22）](https://www.nextgov.com/artificial-intelligence/2026/05/how-library-congress-using-both-ai-and-volunteers-unlock-public-broadcasting-history/413742/)
- [FixIt+ — American Archive of Public Broadcasting](https://fixitplus.americanarchive.org/)
- [Virtual Volunteer / By the People — Library of Congress（crowd.loc.gov）](https://crowd.loc.gov/)
- [Acting Librarian of Congress seeks funding boost for enterprise AI platform — FedScoop（2026-05-13）](https://fedscoop.com/library-of-congress-ai-funding-request/)
- [Warwickshire seeks partner for £2.4m AI drive — PublicTechnology（2026-05-14）](https://www.publictechnology.net/2026/05/14/communities-housing-and-planning/warwickshire-seeks-partner-for-2-4m-ai-drive/)
- [Warwickshire County Council seeks AI partner — UKAuthority](https://www.ukauthority.com/articles/warwickshire-county-council-seeks-ai-partner)
