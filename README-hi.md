<div align="center">

# 🧪 dsh-test-drive
- **1024 स्टोर चैनल**: एक बार `npm i -g dsh1024`, फिर `dsh1024 plugin --profile web add dsh-test-drive` ([deepseek1024.com](https://deepseek1024.com) इंस्टॉल रैंकिंग में गिना जाता है)।

**DeepSeek Harness प्लगइन के लिए पृथक इंस्टॉल-और-स्मोक परीक्षण।**

*एक डिस्पोज़ेबल प्रोफ़ाइल में इंस्टॉल, स्मोक, सत्यापन और सफ़ाई करें — आपका असली `~/.dsh` अछूता रहता है।*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-test-drive)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-test-drive.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-test-drive/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-test-drive/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-test-drive?label=version)](https://github.com/PerryLink/dsh-test-drive/releases)
[![npm version](https://img.shields.io/npm/v/dsh-test-drive)](https://www.npmjs.com/package/dsh-test-drive)
[![npm downloads](https://img.shields.io/npm/dm/dsh-test-drive)](https://www.npmjs.com/package/dsh-test-drive)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-test-drive
```


</div>

---


**📖 इकोसिस्टम नॉलेज बेस** — मापे गए आँकड़े, मार्केटिंग नहीं: [डेवलपमेंट गाइड · चयन डेटा · रखरखाव मानदंड](https://perrylink.github.io/dsh-plugin-guide/)।

<!-- star-cta -->
## Install & uninstall (इंस्टॉल और अनइंस्टॉल)

```sh
dsh plugin --profile web add dsh-test-drive     # इंस्टॉल (npm) — या ऊपर वाला git रूप
dsh plugin --profile web remove dsh-test-drive  # अनइंस्टॉल
```

## ⭐ 如果它帮到了你

यह प्लगइन [DSH प्लगइन परिवार](https://github.com/PerryLink) का हिस्सा है (40+ प्लगइन, सभी Apache-2.0)। अगर यह उपयोगी लगे, तो **एक स्टार दें** — इससे कोई सुविधा अनलॉक नहीं होती, पर अगला व्यक्ति इसे खोज में आसानी से पा लेता है।

*English:* part of a 40+ plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## What is dsh-test-drive?

DeepSeek Harness प्लगइन के लिए पृथक इंस्टॉल-और-स्मोक परीक्षण।

एक डिस्पोज़ेबल प्रोफ़ाइल में इंस्टॉल, स्मोक, सत्यापन और सफ़ाई करें — आपका असली `~/.dsh` अछूता रहता है।

![dsh-test-drive का टर्मिनल डेमो: dsh-test-drive — one isolated install-and-smoke drive](https://raw.githubusercontent.com/PerryLink/dsh-test-drive/main/docs/assets/dsh-test-drive-hero.png)

![Animated terminal demo of dsh-test-drive](https://raw.githubusercontent.com/PerryLink/dsh-test-drive/main/docs/assets/dsh-test-drive-demo.gif)

*वही रन, एनिमेटेड।*

## Compatibility (संगतता)

| घटक | संस्करण |
|---|---|
| DeepSeek Harness | **`dsh-v0.2.1-alpha.1`** (GitHub tag, 2026-09-11 को सत्यापित: पूर्ण गेट श्रृंखला + प्रोफ़ाइल इंस्टॉल स्मोक)। npm निर्भरता लाइन `0.1.2-rc.1` और `0.1.7-rc.2` (peer निर्भरताएँ `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0`)。 |
| Node.js | `^22.19.0 \|\| >=24.0.0` |
| पैकेज प्रबंधक | `pnpm@11.7.0` |
| प्लेटफ़ॉर्म | Windows / macOS / Linux (केवल host प्लगइन) |
| बाहरी उपकरण | PATH पर `dsh` CLI (स्वतः-पहचान, npm shim पार्स किए जाते हैं), PATH पर `pnpm` |

## What you get (आपको क्या मिलता है)

- `test_drive` उपकरण — एक लक्ष्य को पूरी पाइपलाइन से गुज़ारता है: `dsh plugin add` → `--dump-config` पैच जाँच → हेडलेस बूट स्मोक (FAILED मार्कर स्कैन + वैकल्पिक एक-वाक्य कार्य) → वैकल्पिक क्षमता-पुष्टि → `dsh plugin remove` → क्वारंटीन सफ़ाई। संरचित रिकॉर्ड समकालिक रूप से लौटाता है, या `background: true` पर `{ kind: 'background', jobId }`।
- `/testdrive` कमांड — स्पेस/कॉमा से अलग किए गए लक्ष्यों की सूची को `ctx.jobs` पर `drive-batch` पृष्ठभूमि कार्य के रूप में चलाकर मैट्रिक्स रिपोर्ट (JSON + Markdown) बनाता है।
- `drive_report` उपकरण — किसी भी रन (`tdr_...`), मैट्रिक्स (`tdm_...`) या नवीनतम मैट्रिक्स को लाता है; Markdown में प्रस्तुत होता है।
- क्षमता-पुष्टि — “बूट हुआ और बाहर निकला” से आगे: वैकल्पिक `capability` चरण एजेंट से नामित उपकरण को बुलवाता है (या `/command` चलवाता है) और टिकाऊ सत्र लॉग में आह्वान तथा `expect` वाला प्रेक्षित आउटपुट सत्यापित करता है। साफ़ बूट केवल स्मोक टेस्ट है; `observed` सिद्ध करता है कि नामित क्षमता सचमुच काम करती है।
- संरचित परिणाम — हर रिकॉर्ड में विभेदक `schema: "dsh-test-drive/v1"` और प्रथम-श्रेणी फ़ील्ड होते हैं: `stages.install.status` (`pass`/`fail`), `stages.smoke.status` (`pass`/`fail`/`boot-ok`/`skipped`), प्रति-चरण `durationMs`, सैनिटाइज़ किए गए `summary`/`outputTail`, और समग्र `verdict` (`pass`/`fail`/`partial`/`unknown`)। यही मशीन-पठनीय अनुबंध है जिसे स्कोरिंग पाइपलाइनें (dsh-score) उपभोग करती हैं।
- निर्माण से सुरक्षा — हर अस्थायी निर्देशिका इस प्लगइन द्वारा समर्पित उपसर्ग `dsh-test-drive-` के तहत बनाई जाती है, एक सक्रिय स्वामित्व रजिस्ट्री में दर्ज होती है, और केवल dry-run → क्वारंटीन-नामांतरण → हटाने की सीढ़ी से हटाई जाती है। होस्ट प्रोफ़ाइल कभी पढ़ी या लिखी नहीं जाती।

## Quick start (त्वरित शुरुआत)

### git चैनल

```sh
dsh plugin --profile web add github:PerryLink/dsh-test-drive#<commit-sha>
```

पहला `add` विफल होता है क्योंकि pnpm पैकेज की `prepare` बिल्ड रोकता है; pnpm द्वारा छापी गई सटीक कुंजी को प्रोफ़ाइल के `pnpm-workspace.yaml` में कॉपी करें और फिर चलाएँ:

```yaml
allowBuilds:
  'dsh-test-drive': true
```

### npm चैनल

```sh
dsh plugin --profile web add dsh-test-drive
```

पहले से बने पैकेजों को बिल्ड अनुमति की आवश्यकता नहीं होती। प्रोफ़ाइल पुनः आरंभ करें, फिर सत्र से `test_drive` / `/testdrive` उपयोग करें।

## Configuration (विन्यास)

सभी कुंजियाँ वैकल्पिक हैं (डिफ़ॉल्ट दिखाए गए); अमान्य मान लोड के समय ज़ोर से विफल होते हैं।

| कुंजी | डिफ़ॉल्ट | विवरण |
|---|---|---|
| `profileName` | `headless` | हर डिस्पोज़ेबल DSH_HOME में आरंभ किया जाने वाला प्रोफ़ाइल टेम्पलेट (base + headless बंडल)। |
| `dshBin` | `""` | dsh निष्पादनयोग्य के लिए निरपेक्ष पथ ओवरराइड; खाली = PATH पर `dsh` स्वतः-पहचान। |
| `headlessTask` | `"Reply with exactly: ok"` | बूट-स्मोक चरण का एक-वाक्य कार्य; खाली = चरण छोड़ें। |
| `forwardEnv` | `[]` | परीक्षण-प्रोफ़ाइल उप-प्रक्रियाओं में भेजे जाने वाले पर्यावरण चरों के **नाम** (मान कभी नहीं)। |
| `allowBuilds` | `true` | परीक्षण प्रोफ़ाइल में अवरुद्ध git `prepare` बिल्ड को अनुमति दें और इंस्टॉल एक बार पुनः प्रयास करें। |
| `installTimeoutMs` | `600000` | `dsh plugin add` चरण की समय-सीमा। |
| `configTimeoutMs` | `60000` | `--dump-config` चरण की समय-सीमा। |
| `smokeTimeoutMs` | `300000` | हेडलेस बूट-स्मोक चरण की समय-सीमा। |
| `capabilityTimeoutMs` | `300000` | क्षमता-पुष्टि कार्य की समय-सीमा।
| `capability.enabled` | `false` | क्षमता-पुष्टि चरण चलाएँ (पंजीकृत → आहूत → प्रेक्षित)।
| `capability.kind` | `tool` | क्या जाँचें: `tool` या `command`।
| `capability.name` | `""` | उपकरण या कमांड नाम (आगे `/` के बिना)।
| `capability.args` | `""` | आह्वान पाठ: उपकरण तर्क (JSON-शैली) या कमांड शब्द।
| `capability.expect` | `""` | प्रेक्षित आउटपुट में अपेक्षित अक्षर (केस-असंवेदी उप-स्ट्रिंग)।
| `uninstallTimeoutMs` | `120000` | `dsh plugin remove` चरण की समय-सीमा। |
| `outputTailBytes` | `8000` | प्रति चरण दर्ज सैनिटाइज़्ड आउटपुट टेल की सीमा। |
| `keepTempDirs` | `false` | विफलता पर फ़ॉरेंसिक हेतु अस्थायी निर्देशिकाएँ रखें (स्वामित्व छोड़ा जाता है; आप साफ़ करें)। |
| `maxBatchTargets` | `20` | `/testdrive` बैच सीमा। |
| `batchConcurrency` | `1` | बैच समानांतरता (क्रमिक pnpm-स्टोर विवाद से बचाता है)। |

## Tools & surfaces (उपकरण और सतहें)

### `test_drive`

```
test_drive(target: string, headlessTask?: string, background?: boolean,
  capability?: { kind: 'tool' | 'command', name: string,
                 args: string, expect: string })
```

- `target` — git स्पेक (`github:owner/repo#sha`, `git+https://...`), npm नाम, स्थानीय पथ या `.tgz` टारबॉल।
- `capability` — स्मोक के बाद की पुष्टि: एजेंट `args` के साथ `name` (उपकरण) बुलाता है या `/name` (कमांड) चलाता है; चरण टिकाऊ सत्र लॉग पढ़कर `expect` वाला प्रेक्षित आउटपुट माँगता है। `DEEPSEEK_API_KEY` चाहिए (होस्ट परिवेश या `forwardEnv`); बिना उसके चरण `skipped` रहता है, कभी विफल नहीं होता।
- पूरा संरचित रिकॉर्ड लौटाता है; नमूना नीचे।
- `background: true` एक `drive-batch` कार्य आरंभ कर उसका id लौटाता है।

### `/testdrive <लक्ष्य...>`

एक पृष्ठभूमि बैच कार्य आरंभ करता है; प्रगति कार्य आउटपुट से प्रवाहित होती है, और अंतिम पंक्ति `drive_report` के लिए मैट्रिक्स id बताती है।

### `drive_report(id?)`

एक रन रिकॉर्ड (`tdr_...`), मैट्रिक्स (`tdm_...`), या — बिना id — नवीनतम मैट्रिक्स लौटाता है।

### संरचित परिणाम नमूना

```json
{
  "schema": "dsh-test-drive/v1",
  "run": { "runId": "tdr_9f2c...", "startedAt": "2026-08-16T00:00:00.000Z",
           "finishedAt": "2026-08-16T00:00:45.120Z", "durationMs": 45120,
           "harnessVersion": "0.1.7-rc.2", "pluginVersion": "0.3.10",
           "platform": "win32", "node": "v22.22.3" },
  "target": { "kind": "repo", "spec": "github:owner/dsh-click#abc123",
              "resolved": { "packageName": "dsh-click", "packageVersion": "0.1.0",
                            "hasBundleManifest": true } },
  "isolation": { "tempDshHome": true, "tempWorkspace": true, "tempStore": true,
                 "hostHomeTouched": false },
  "stages": {
    "install":   { "status": "pass", "exitCode": 0, "durationMs": 30412, "attempts": 2,
                   "summary": "install ok after allowBuilds allowance", "outputTail": "",
                   "allowBuildsNeeded": true },
    "config":    { "status": "pass", "exitCode": 0, "durationMs": 2310, "attempts": 1,
                   "summary": "dump ok (exit 0)", "outputTail": "",
                   "patchEffective": true, "layers": ["dsh-click"] },
    "smoke":     { "status": "boot-ok", "exitCode": 1, "durationMs": 4123, "attempts": 1,
                   "summary": "booted without loader failures; headless task did not complete (credentials/model unreachable)",
                   "outputTail": "", "bootFailed": false, "taskCompleted": false },
    "capability": { "status": "observed", "exitCode": 0, "durationMs": 8123, "attempts": 1,
                    "summary": "tool \"plugin_vet\" called and its result contains the expectation",
                    "outputTail": "", "capabilityKind": "tool", "name": "plugin_vet",
                    "expectMatched": true,
                    "detail": "tool \"plugin_vet\" called and its result contains the expectation" },
    "uninstall": { "status": "pass", "exitCode": 0, "durationMs": 5123, "attempts": 1,
                   "summary": "remove ok (exit 0)", "outputTail": "" },
    "cleanup":   { "status": "pass", "quarantined": true, "removed": true,
                   "summary": "owned temp root quarantined and removed" }
  },
  "verdict": "pass",
  "verdictReason": "install, patch, boot, and uninstall verified; headless task inconclusive (see smoke.summary)"
}
```

निर्णय नियम: इंस्टॉल विफलता, बूट विफलता (`smoke.fail`) या `not-registered`/`failed` तक पहुँचा क्षमता चरण ⇒ `fail`; इंस्टॉल पास + पैच प्रभावी + साफ़ बूट (`pass`/`boot-ok`) + अनइंस्टॉल पास ⇒ `pass` (`observed` पर क्षमता नोट के साथ); इंस्टॉल हुआ पर बाद की कोई पुष्टि अधूरी ⇒ `partial`; अन्यथा ⇒ `unknown`।

## CI (GitHub Actions)

रिपॉज़िटरी में एक composite [`action.yml`](action.yml) शामिल है जिसे किसी भी प्लगइन रिपॉ में `uses:` से दोबारा इस्तेमाल किया जा सकता है: यह लक्ष्य को एक अलग-थलग throwaway profile में चलाता है और CI द्वारा उपभोग किया जाने वाला रिपोर्ट जोड़ा — Markdown (PR कमेंट) और JUnit XML (स्टेटस चेक) — उत्सर्जित करता है। इनपुट `target` (आवश्यक)/`headless-task`/`dsh-version`; आउटपुट `markdown`/`junit`/`verdict`। ड्राइव को कुंजी की आवश्यकता नहीं है; केवल capability assertion को `DEEPSEEK_API_KEY` चाहिए और इसके बिना वह `skipped` (कभी असफल नहीं) रहती है।

## Permissions & data (अनुमतियाँ और डेटा)

- केवल सार्वजनिक सेवाएँ उपभोग होती हैं: `ctx.subprocess`, `ctx.jobs`, `ctx.storageDomain`, `ctx.tools`, `ctx.commands`।
- रिपोर्टें `test_drive` स्टोरेज-डोमेन (तालिकाएँ `runs`, `matrices`; नवीनतम-मैट्रिक्स संकेतक) में रहती हैं। जब संरचना में `storageDomain` नहीं है (जैसे आधिकारिक हेडलेस प्रोफ़ाइल), उपकरण चलते रहते हैं और रिपोर्ट स्थायित्व कारण सहित अक्षम होता है।
- उप-प्रक्रियाओं को **क्रेडेंशियल-रहित** वातावरण मिलता है: होस्ट रहस्य तब तक परीक्षित प्रोफ़ाइल में नहीं पहुँचते जब तक आप उन्हें `forwardEnv` में नाम न दें। मान कभी लॉग नहीं होते।
- सभी रिपोर्ट/लॉग स्ट्रिंग शुद्ध सैनिटाइज़र से गुज़रती हैं: टोकन अक्षर, URL क्रेडेंशियल और bearer हेडर रिडैक्ट होते हैं, अस्थायी रूट पथ `<testdrive-temp>` से बदले जाते हैं, टेल बाइट-सीमित होती हैं।

## Security boundaries (सुरक्षा सीमाएँ)

- **पृथक्करण।** हर परीक्षण OS अस्थायी निर्देशिका के अंदर नई `mkdtemp` रूट में चलता है: डिस्पोज़ेबल `DSH_HOME`, डिस्पोज़ेबल कार्य निर्देशिका, और पुनर्निर्देशित pnpm स्टोर। परीक्षित प्लगइन का कोड केवल उसी प्रोफ़ाइल में चलता है; आपकी होस्ट प्रोफ़ाइल अछूती रहती है।
- **स्वामित्व।** एक सक्रिय रजिस्ट्री इस इंस्टेंस की बनाई हर रूट को दर्ज करती है। सफ़ाई किसी भी ऐसे पथ को अस्वीकार करती है जो `dsh-test-drive-` उपसर्ग के साथ OS अस्थायी निर्देशिका का पंजीकृत प्रत्यक्ष उप-निर्देश न हो — कोई `%TEMP%` सफ़ाई नहीं, कोई पराया उपसर्ग नहीं, कोई असली होम पथ नहीं।
- **सफ़ाई की सीढ़ी।** किसी भी परिवर्तन से पहले पूरी dry-run योजना लॉग होती है (निरपेक्ष पथ)। हटाना पहले रूट को `dsh-test-drive-quarantine-<ts>` नाम से क्वारंटीन करता है, सत्यापन करता है, फिर हटाता है; विफलता पर निर्देशिका क्वारंटीन रहती है और सूचित होती है — कभी चुपचाप नहीं छोड़ी जाती। सफ़ाई सफलता, विफलता, समय-समाप्ति और रद्दीकरण के हर रास्ते में `finally` में चलती है, और प्लगइन हटने पर फिर चलती है।
- **`allowBuilds` एक वास्तविक अनुमति है।** git पैकेज की `prepare` बिल्ड की अनुमति इंस्टॉल के समय उस पैकेज का कोड चलाना है। अनुमति केवल डिस्पोज़ेबल प्रोफ़ाइल तक सीमित है, फिर भी केवल भरोसेमंद लक्ष्यों का परीक्षण करें और commit पिन करें।
- **हेडलेस स्मोक डिफ़ॉल्ट रूप से कुंजी-रहित है।** बूट जाँच को क्रेडेंशियल नहीं चाहिए; एक-वाक्य कार्य पूरा करने को चाहिए। क्रेडेंशियल स्पष्ट रूप से भेजें (`forwardEnv`) और उन्हें कभी लॉग न करें।

## Known limitations (ज्ञात सीमाएँ)

- रजिस्ट्री/git लक्ष्य इंस्टॉल करने के लिए उप-प्रक्रिया `dsh`/pnpm को नेटवर्क चाहिए।
- स्मोक कार्य को `pass` तक पहुँचने के लिए मॉडल क्रेडेंशियल चाहिए; बिना उनके यह ईमानदार `boot-ok` दर्ज करता है।
- `storageDomain` रहित संरचनाओं में रिपोर्टें स्थायी नहीं होतीं (`drive_report` ईमानदारी से विफल होता है)।
- `dsh` PATH पर मिलना चाहिए (या `dshBin` सेट करें); Windows पर npm का `.cmd`/`.bat` shim स्वतः पार्स होता है, केवल `.ps1` मिलने पर `dshBin` माँगा जाता है।
- बैच डिफ़ॉल्ट रूप से क्रमिक चलते हैं; `batchConcurrency` बढ़ाने से केवल pnpm-स्टोर डिस्क विवाद प्रभावित होता है, शुद्धता नहीं।

## Development (विकास)

```sh
pnpm install
pnpm run typecheck && pnpm run typecheck:ci && pnpm test
pnpm run build && pnpm run verify:self-contained && pnpm run verify:artifacts && pnpm pack
```

- `typecheck` स्थानीय harness चेकआउट से `@deepseek-ai/*` हल करता है; `typecheck:ci` प्रकाशित `0.1.7-rc.2` प्रकारों से जाँचता है।
- परीक्षण वास्तविक `Context`/`Session`/`ToolRuntime`/`LocalJobRegistry`/स्टोरेज स्टैक और एक स्क्रिप्टेड subprocess प्रदाता का उपयोग करते हैं।
- वास्तविक-CLI एंड-टू-एंड (नेटवर्क + PATH पर `dsh` आवश्यक): `DSH_TESTDRIVE_E2E=1 pnpm run test:e2e` — इसी पैकेज के चेकआउट को वास्तविक इंस्टॉल-स्मोक लूप से परखता है।
- रिलीज़: `node scripts/release.mjs <x.y.z>` (संस्करण बढ़ाता, CHANGELOG मुहर लगाता, द्वार फिर चलाता, commit + tag; कभी push नहीं)।

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `plugin-testing`, `install-smoke`, `compatibility-matrix`, `ci`

## Contributors (योगदानकर्ता)

[PerryLink](https://github.com/PerryLink) — डिज़ाइन और कार्यान्वयन।

## PerryLink DSH Plugin Family

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) के **87 सक्रिय रूप से अनुरक्षित** DeepSeek Harness प्लगइन में से एक है। पूरा परिवार **95** प्लगइन है — **5 फ़्रोज़न**, **3 सेवानिवृत्त** — और नीचे संक्षिप्त रखा गया है ताकि हर README की पहली स्क्रीन छोटी रहे। हर पंक्ति देखने के लिए इसे खोलें; कारण स्थिति कॉलम में है।

<details>
<summary>सभी 95 प्लगइन खोलें</summary>

| प्लगइन | एक पंक्ति | स्थिति |
|---|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | 水产养殖投入品记录核对（按投入品用量、休药期与起捕间隔核对记录自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | 档案归档完整性与保管期限核对（依据《档案法》及配套规定，仅提示差异，不作出定性结论） |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command |  |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | 投标文件符合性预检（按招标文件逐条核对响应情况，仅提示差异，不作出定性结论） |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | 投标人资格条件核对（按资格条件与证明材料核对逐条响应，仅提示差异，不作出定性结论） |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |  |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | 合同条款立场台账核对（按立场、风险等级与退让底线核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | 报关单证一致性核对（按公开的报关单填制规范核对单证间字段一致性，仅提示差异，不作出定性结论） |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) |  |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | 滞箱费台账核对（按免箱期与费率核对超期天数与金额的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review |  |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** | 应急演练脚本核对（按阶段、响应分级、指挥与资源要素核对脚本齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** | 环评导则适用性核对（按要素、导则名称与执行标准核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** | 应急预案要素齐备性与条款级页码定位（依据 GB/T 29639-2020 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** | 作文量表评分核对（按评分项、原文定位与分值算术核对评分自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** | 证据清单齐备性核对（按待证事实与证据要素核对清单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** | 出口管制物项核对（按管制清单、最终用途与许可证核对台账齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** | FMEA 分析表要素齐备性与风险顺序数一致性核对（按公开的 FMEA 方法标准核对表内自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** | 预测准确率考核核对（按准确率、门槛与考核单价核对考核费用的算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** | 公文流转与办理时限核对（按公开的公文处理规范核对环节完整性与时限，仅提示差异，不作出定性结论） |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** | 公文格式要素核对（按公开的党政机关公文格式标准核对版头与主体要素，仅提示差异，不作出定性结论） |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** | 劳动保护与安全防护用品配置表核对（按公开的配备标准核对品名规格与配置数量，仅提示差异，不作出定性结论） |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** | 危险化学品临界量与重大危险源辨识核对（按储存量与临界量核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** | HAZOP 分析表要素齐备性与偏差推导一致性核对（依据公开的危险与可操作性分析标准，仅提示差异，不作出定性结论） |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** | 安全隐患台账→《工贸企业重大事故隐患判定标准》（应急管理部令第10号）条款映射提示（仅提示差异，不作出定性结论） |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** | 商品归类层级一致性核对（按章、品目、子目与商品编号的层级关系核对自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** | ICD 合并编码与星剑号配对提示（依据 GB/T 14396-2016 与公开的 ICD 使用说明，仅提示差异，不作出定性结论） |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** | 法条引用与文书要素核对（按名称、条号、原文与效力状态核对引用可核验性，仅提示差异，不作出定性结论） |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** | 信用证单据条款核对（按单据种类、份数、期限与不符点核对交单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** | 能力差距与培养计划核对（按能力等级差、培养措施与完成期限核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** | 病案首页形式质控与逻辑矛盾提示（依据国卫办医发〔2016〕24号等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** | 国家自然科学基金申请书形式审查与匿名化提示（依据《国家自然科学基金条例》与申请人导入的当年指南，仅提示差异，不作出定性结论） |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** | 护理记录时限、签名与评估表完整性校验（依据《病历书写基本规范》等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** | 原产地区域价值成分核对（按 RVC 定义式与门槛核对原产地判定自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** | 在线点评回复台账核对（按回复时限、问题分类与整改状态核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** | 试卷解析结构核对（按题型、答案、分值与 yotta 标识核对试卷结构自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** | 行政许可办理核对（按申请材料、法定时限与决定记录核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** | 项目全流程文件链条核对（按环节先后与金额口径核对链条自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** | 起诉状要素齐备性核对（按诉请、事实、证据、法条四要素核对文书齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** | 政策专报要素核对（按观点、依据、出处与建议核对专报齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** | 线损电量拆分与考核表核对（依据公开的线损计算口径，仅提示差异，不作出定性结论） |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** | 电力工作票要素齐备性与签发许可顺序核对（依据现行电力安全工作规程，仅提示差异，不作出定性结论） |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** | PPAP 提交要素齐备性核对（按公开的 PPAP 手册与提交等级核对要素齐备与版本填写，仅提示差异，不作出定性结论） |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** | 质疑与投诉期限核对（按公开的政府采购质疑投诉规定核对期限与台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** | 铁路施工天窗台账核对（按时间窗、时长算术与命令号核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | 维修工单结算核对（按项目金额、配件工时合计与结算总额核对算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | 审稿意见逐条回应覆盖核对（按意见与回应一一对应核对覆盖完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | 规则库文件自检核对（按条款引用纪律与效力上限核对规则库自身合规，仅提示差异，不作出定性结论） |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | 安全技术交底记录要素齐备性与签字闭环核对（依据公开的安全生产法规与检查标准，仅提示差异，不作出定性结论） |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. |  |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | 监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | 三重一大决策台账核对（按前置研究、会议审议与决议记录核对程序留痕，仅提示差异，不作出定性结论） |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | 土壤与地下水监测台账核对（按点位、监测项目、限值与超标判定核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | 作业规程与 FMEA／控制计划一致性核对（按编号与版本核对三份文件是否同步，仅提示差异，不作出定性结论） |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | 控制图常数与过程能力指数核对（按 GB/T 4091 的常规控制图常数表核对控制限与 Cp/Cpk 的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |  |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** | 招标文件条款摘录核对（按出处与原文逐字核对摘录完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** | 评标因素评分矩阵核对（按分值上限与合计核对矩阵自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** | 质保期与索赔金额核对（按质保期月数与里程、索赔金额算式核对自洽，仅提示差异，不作出定性结论） |  |

</details>

</details>

</details>## License (लाइसेंस)

[Apache-2.0](LICENSE)

### DSH Desktop मार्केट से इंस्टॉल करें

सभी PerryLink प्लगइन DSH Desktop के बिल्ट-इन मार्केट में देखे जा सकते हैं: **Market → Sources → add source → पेस्ट करें** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ चुनें**। इंस्टॉलेशन मार्केट के npm-identity सत्यापन और आपकी पुष्टि से ही होता है।
