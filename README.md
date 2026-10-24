# dopadon

## 海の幸あつめて海鮮丼

静岡の海の幸を集め、海鮮丼の売上で道具と能力を育てるWebゲームです。
HTML / CSS / JavaScript（ES Modules）とブラウザ標準APIで動きます。依存パッケージ、バックエンド、データベースは不要です。

### 起動

Node.js 22.7以降（検証環境: 24.14.1）を使用します。

```powershell
node scripts/serve.mjs
```

ブラウザで http://127.0.0.1:4173 を開いてください。停止はサーバーを実行したターミナルで Ctrl+C。
`file://` でHTMLを直接開くと、ES Modules / fetch の制限で動きません。

`scripts/serve.mjs` は開発用の静的ファイル配信だけを行います。ゲームの状態・計算はすべてブラウザ側です。
必要なファイルを明示した許可リストだけを配信し、ディレクトリ一覧・再帰走査・シンボリックリンクの参照は行いません。
一般の静的ホスティングでも、下記の本体ファイルと画像を同じ相対配置で公開できます。

### 遊び方

1. 「漁に出る」で30秒の漁を開始。
2. 魚をクリック・タップして攻撃。HPバーがなくなると捕獲します。赤い枠の空き缶・海藻は減点です。
3. 終了時に全捕獲から丼を自動生成し、売上を1回だけ所持金へ反映。
4. アップグレードで能力を強化。網を購入すると範囲内の複数の魚を攻撃できます。
5. 「この装備で漁に出る」で再挑戦。強化は持ち越されます。

魚はキーボードのTabで選択し、Enter / Spaceでも攻撃できます。
タブが非表示の間は漁の時間と移動が停止します。ページ更新・ページを閉じる操作では途中の漁は中断され、未確定の捕獲は売上になりません。
所持金・強化・道具・耐久度・漁回数・直前の確定結果はlocalStorageに保存します。保存が拒否された場合は画面下部に通知し、そのページ内では続行できます。

### ファイルと責任

- `index.html` / `js/main.js`: 正式な入口、HTML取得、画面遷移、漁開始と終了の接続。
- `pages/title.html`, `pages/fishing.html`, `pages/result.html`, `pages/shop.html`: 4画面のHTML。
- `css/style.css`: 全画面の共通デザイン。
- `js/config.js`: 食材、道具、強化、価格、出現率、速度、HP、ボーナス、サイズ等の設定。
- `js/user_data.js`: 唯一のプレイヤー状態、保存復元、出漁、売上確定、耐久消費。
- `js/fishing.js`: 重み付き出現、DOM・requestAnimationFrameによる移動、単体/範囲攻撃、HP、捕獲、終了通知、停止処理。
- `js/scoring.js`: 副作用のない採点・丼判定。入金しません。
- `js/result.js`: 結果・内訳・自動盛り付けの表示。再表示で入金しません。
- `js/shop.js`: 強化購入、道具購入、装備、能力表示。
- `assets/`: 既存の画像を再利用。素材のない食材は絵文字。
- `tests/game.test.mjs`: 採点・購入・状態・攻撃のNode標準テスト。
- `tests/browser.test.mjs`: 既存Chromium系ブラウザを使う独立プロファイルのE2Eテスト。
- `scripts/serve.mjs`: 開発用静的サーバー。

旧版の `dopadon/game.js`、旧画面のCSS等は参考資産として保持しています。正式なゲームはルートの `index.html` です。
既存の重み付き抽選、左方向の移動、上下の揺れ、画像資産と採点関数の責任分離を再利用し、旧版の手動盛り付けは自動生成へ変更しました。
`nagaya/` は本ゲームの調査・編集・配信対象外です。

### 仮仕様・バランス

調整値の正本は **`js/config.js`** です。

- 初期所持金0G、銛、30秒。出漁は無料。
- 価格は既存 `js/scoring.js` を優先（しらす50、桜エビ100、マグロ300、缶−100）。他の既存食材は旧ゲームの点数を採用。既存食材の出現重み・速度と出現間隔0.45〜0.9秒も踏襲。
- 16種類: 海の幸8、おふざけ食材6、ゴミ2。HP、追加食材の価格・重み・速度は仮設定。
- 後半ほど出現間隔が短くなります。強化は次回出漁時の設定として固定します。
- 銛は単体・基本攻撃力1・壊れません。範囲強化を買っても銛は単体です。
- 網: 360G、半径90px、基本攻撃力1、6回の漁で破損。
- 大きな網: 1,200G、半径155px、基本攻撃力2、5回の漁で破損。対象ごと・攻撃ごとに15%ですっぽ抜け（その攻撃はダメージなし）。
- 網類は各種類1個を所持。未所持または破損時に購入可能で、購入すると自動装備。所持中の買い増し・修理はなし。
- 耐久は装備して完了した漁ごとに1消費。捕獲0でも消費します。破損時は銛へ戻ります。
- 強化価格は「初期価格 × 1.65^現在レベル」の四捨五入。

| 強化 | 初期価格 | 1レベルの効果 | 上限 |
|---|---:|---|---:|
| 網の投げ方を学ぶ | 200G | 網の半径+15px | 8 |
| 網の使い方を学ぶ | 250G | 攻撃力+1 | 8 |
| 睡眠時間短縮 | 150G | 漁+5秒 | 6 |
| 漁場開拓 | 300G | 出現頻度+20%（加算） | 8 |
| 船の性能強化 | 300G | 速度−8%（加算） | 6 |
| ゴミの分別名人 | 200G | 減点−15%（加算） | 6 |

「睡眠時間短縮」はゲーム内の能力名です。
攻撃範囲のpxは960×480の論理的な漁場座標です。

### 採点契約

`calculateScore(catches, { penaltyReduction })` は次の9項目を返します。
`name, size, count, baseScore, bonus, bonusName, penalty, totalScore, comment`

- `catches`: `{ 食材ID: 数量 }`。未知IDは無視。負数・非有限値は0、小数は切り捨て。入力防御として数量は各ID最大100,000。
- 食材価格×数量を基本点へ。ゴミの絶対価格×数量をペナルティへ。ゴミは捕獲食材数・命名・ボーナス判定に含めません。
- 合計 = 基本点 + ボーナス − 軽減後のペナルティ。ボーナスと軽減後ペナルティは整数に四捨五入。
- **負の売上・負の所持金を許可**し、指定の式を保ちます。出漁無料・壊れない銛により赤字でも続行できます。残高不足の購入はできません。
- 20個以上は大盛、10〜19個は中盛、0〜9個は並盛。
- 最多食材が30個以上なら「食材名＋丼」。それ以外は海鮮丼。同数なら設定の掲載順で決定。サイズとは独立。
- ボーナスは設定順で最初の1件だけ。しらすのみ/いくらのみは基本点の+80%。5種類以上かつうなぎ・カニありは+200%、5種類以上は+100%、しらす・桜エビ各2個以上は+120%、タイ・イカ各1個以上は+50%。
- 捕獲0件はボーナス0。名前は海鮮丼、並盛、コメントで白ごはんと案内。
- 画像の盛り付けは最大14個に省略しますが、計算・内訳は全捕獲を対象にします。
- 漁IDを用いて売上確定・耐久度消費を一度に行います。結果画面への再訪・再読込では加算しません。

### 開発・検証

```powershell
node --test tests/game.test.mjs
```

ブラウザE2E（サーバーを起動した状態で、インストール済みのChromium系ブラウザを指定）:

```powershell
$env:GAME_TEST_BROWSER='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node tests/browser.test.mjs
```

E2EはOSの一時フォルダーに独立プロファイルとスクリーンショットを作成し、ユーザーの通常ブラウザの進行データは使いません。3回の漁で約2分かかります。最初の2周は通常の購入と強化を操作し、3周目のみ破損確認のため耐久1の大きな網をテスト保存データに設定します。

3人で開発する場合は `js/main.js` の編集責任者を1人に固定し、漁担当は `js/fishing.js`、採点担当は `js/scoring.js` / `js/result.js`、強化担当は `js/shop.js` / `js/user_data.js` を主に編集してください。共通設定の変更は食材ID・保存形式の互換性を合意して行います。

### 今後の改善候補

実プレイヤーによる価格・出現量・難易度調整、絵文字素材の画像化、音量切替付き効果音、モバイルでの細かな操作調整。市場イベント、ランキング、マルチプレイ等は今回の対象外です。

### ディレクトリ整理（2026-10-24）

今回の変更は配置と参照パスのみです。ゲームルール・価格・保存キー・HTMLの画面分割は変更していません。

```text
project/
├── index.html
├── README.md
├── pages/                 # title / fishing / result / shop.html
├── js/                    # main / scoring / fishing / result / shop / user_data / config.js
├── css/
│   └── style.css          # 現行の共通CSS（画面別CSSの新設はしていない）
├── assets/
│   ├── fish/              # shirasu, sakuraebi, unagi, ika, tai, kani.png
│   ├── items/             # can, boot.png（bootは旧版用）
│   ├── tools/             # net.png
│   ├── backgrounds/       # bg_sea, bg_kitchen.png
│   └── ui/                # bowl, title_logo.png
├── scripts/
│   └── serve.mjs
├── tests/
│   ├── game.test.mjs
│   └── browser.test.mjs
├── dopadon/               # 旧版HTML・JS・CSS等を保留（画像だけ共有assetsへ移動）
├── title/                 # 旧タイトルHTML・JS・CSSを保留
├── shop/                  # 旧ショップHTML・CSSを保留
├── data/                  # 移動後の空ディレクトリを保留
├── package-lock.json      # 既存ファイルを保持
├── use                    # 用途未確定につき保持
└── .backups/
    └── layout-20261024-154607/  # 編集前の対象ファイルと移動対応表
```

`nagaya/` は上記の対象外です。配下の列挙・読取・変更・移動は行っていません。
バックアップは対象を明示した42ファイルを元の配置でコピーし、全コピーのSHA-256一致を確認しています。`move-map.json` に移動対応を保存しました。Gitの一括操作・ステージング・コミットは行っていません。ファイル移動はワークスペース内の通常移動で、Gitへの反映時は内容の類似性からrenameとして検出できます。

#### 移動対応表

| 移動前 | 移動後 |
|---|---|
| `main.js` | `js/main.js` |
| `scoring.js` | `js/scoring.js` |
| `fishing.js` | `js/fishing.js` |
| `result.js` | `js/result.js` |
| `shop/shop.js` | `js/shop.js` |
| `data/user_data.js` | `js/user_data.js` |
| `data/config.js` | `js/config.js` |
| `style.css` | `css/style.css` |
| `game.test.mjs` | `tests/game.test.mjs` |
| `browser.test.mjs` | `tests/browser.test.mjs` |
| `serve.mjs` | `scripts/serve.mjs` |
| `dopadon/images/{shirasu,sakuraebi,unagi,ika,tai,kani}.png` | `assets/fish/` の同名ファイル（6件） |
| `dopadon/images/{boot,can}.png` | `assets/items/` の同名ファイル（2件） |
| `dopadon/images/{bg_sea,bg_kitchen}.png` | `assets/backgrounds/` の同名ファイル（2件） |
| `dopadon/images/{bowl,title_logo}.png` | `assets/ui/` の同名ファイル（2件） |
| `dopadon/images/net.png` | `assets/tools/net.png` |

#### パスの基準

- `index.html` は `./js/main.js` と `./css/style.css` を読み込みます。
- ES Modulesのimportはモジュールの位置基準。同じ `js/` 内では `./config.js` 等です。
- `main.js` の `fetch('./pages/...')` は表示中のルート `index.html` 基準なので、変更していません。
- `pages/` のHTMLは `index.html` 内へ挿入する断片です。画像は `./assets/...` とし、`pages/` 単体のURLで表示することは想定していません。
- CSSの画像はCSS自身の場所基準なので `../assets/backgrounds/bg_sea.png` です。
- 旧 `dopadon/index.html` / `game.js` / `style.css` の画像参照も `../assets/...` に変更し、素材移動による旧版の参照切れを防いでいます。
- 旧 `shop/shop.html` のmodule参照、旧 `title/title.js` のデータimportも移動先へ変更しました。旧タイトルの既存エラー自体は変更していません。
- 静的サーバーは自身の親ディレクトリを公開ルートにし、現行ゲームの新しいファイル配置のみ許可します。旧版・バックアップ・テストは、従来同様に配信対象外です。

#### 保留した旧版・用途不明ファイル

- `dopadon/index.html`, `dopadon/game.js`, `dopadon/style.css`: 旧単一HTMLゲーム。現行の入口からは未使用。手動盛り付け等の参考資産があるため保持。
- `title/title.html`, `title/title.js`, `title/title.css`: 旧タイトル。HTML内の `./title/title.js` / `dopadon/index.html` / `int.html` は整理前から参照先が不整合。またJSが要求する `player` exportは現在の状態モジュールに存在しません。今回の対象は配置整理のため機能修正はしていません。
- `shop/shop.html`, `shop/shop.css`: 旧固定表示ショップ。現行の `pages/shop.html` とは別のデザイン資産であり、単なる重複とは断定せず保持。
- `dopadon/pushtest.html`: プッシュ確認用の文面。削除せず保持。
- `dopadon/README.md`: 旧版の見出しのみ。削除せず保持。
- `use`: 用途不明の既存ファイル。移動・削除せず保持。
- `package-lock.json`: 空の依存情報を持つ既存ファイル。パッケージ構成を変えないため保持。
- `data/`, `dopadon/images/`: 移動後に空になったディレクトリ。削除操作はしていません。

今後は旧版を保管するか廃止するか合意した後に、旧ファイルをまとめて扱ってください。共通CSSの画面別分割は必要になった時点で行い、今回は空のCSSを新設していません。
#### 整理後の検証結果

- 整理前・整理後とも `node --test tests/game.test.mjs` 相当の既存10テストが成功（整理前はルートのテストファイル）。採点、購入可否、強化値、耐久度、入金一度限り、保存復元、攻撃判定を確認。
- 現行7モジュール、旧版2モジュール、サーバー、テスト2ファイルの計12ファイルで `node --check` 成功。
- 現行モジュールと単体テストの相対import 17件について参照先の存在を確認。
- HTTP配信25リソース（入口、4画面、全現行JS、CSS、画像）で200応答、ファイル内容一致、Content-Typeを確認。
- 移動画像13枚がバックアップとバイト単位で一致。旧版ゲームのHTML・動的画像・カーソル画像の参照先も保持。
- バックアップ・対象外リソースが静的サーバーから配信されないことを確認。除外ディレクトリへのHTTP要求は行っていません。
- 実ブラウザでのCSSの見た目、全画面遷移、漁からショップまでの一連操作は未検証です。整理前の作業でもブラウザの検証接続が切断されており、今回の移動による不具合とは判定していません。E2Eテストファイルはロジックを変更せず移動しています。
