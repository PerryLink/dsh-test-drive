# dsh-test-drive

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) प्लगइन के लिए पृथक (isolated) इंस्टॉल-और-स्मोक परीक्षण। किसी रिपो या npm पैकेज को देकर, यह लक्ष्य को एक **डिस्पोज़ेबल `DSH_HOME` प्रोफ़ाइल** में इंस्टॉल करता है, बंडल पैच और बूट लॉग की जाँच करता है, **संरचित पास/फेल परिणाम** दर्ज करता है, और अपने द्वारा बनाई गई हर चीज़ हटा देता है — आपके असली `~/.dsh` को कभी नहीं छूता।

**स्थिति (ZH)**: 在一次性隔离 DSH_HOME 中自动完成插件"安装 → 引导冒烟 → 卸载清理"实测并产出结构化结果矩阵。

[English](README.md) · [中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md)

## Compatibility (संगतता)

| घटक | संस्करण |
|---|---|
| DeepSeek Harness | `0.1.0-rc.6` (peer निर्भरताएँ पिन की गईं) |
| Node.js | `^22.19.0 \|\| >=24.0.0` |
| पैकेज प्रबंधक | `pnpm@11.7.0` |
| प्लेटफ़ॉर्म | Windows / macOS / Linux (केवल host प्लगइन) |
| बाहरी उपकरण | PATH पर `dsh` CLI (स्वतः-पहचान, npm shim पार्स किए जाते हैं), PATH पर `pnpm` |

## What you get (आपको क्या मिलता है)

- `test_drive` उपकरण — एक लक्ष्य को पूरी पाइपलाइन से गुज़ारता है: `dsh plugin add` → `--dump-config` पैच जाँच → हेडलेस बूट स्मोक (FAILED मार्कर स्कैन + वैकल्पिक एक-वाक्य कार्य) → `dsh plugin remove` → क्वारंटीन सफ़ाई। संरचित रिकॉर्ड समकालिक रूप से लौटाता है, या `background: true` पर `{ kind: 'background', jobId }`।
- `/testdrive` कमांड — स्पेस/कॉमा से अलग किए गए लक्ष्यों की सूची को `ctx.jobs` पर `drive-batch` पृष्ठभूमि कार्य के रूप में चलाकर मैट्रिक्स रिपोर्ट (JSON + Markdown) बनाता है।
- `drive_report` उपकरण — किसी भी रन (`tdr_...`), मैट्रिक्स (`tdm_...`) या नवीनतम मैट्रिक्स को लाता है; Markdown में प्रस्तुत होता है।
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

## Install & uninstall (इंस्टॉल और अनइंस्टॉल)

```sh
dsh plugin --profile web add dsh-test-drive     # इंस्टॉल (npm) — या ऊपर वाला git रूप
dsh plugin --profile web remove dsh-test-drive  # अनइंस्टॉल
```

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
| `uninstallTimeoutMs` | `120000` | `dsh plugin remove` चरण की समय-सीमा। |
| `outputTailBytes` | `8000` | प्रति चरण दर्ज सैनिटाइज़्ड आउटपुट टेल की सीमा। |
| `keepTempDirs` | `false` | विफलता पर फ़ॉरेंसिक हेतु अस्थायी निर्देशिकाएँ रखें (स्वामित्व छोड़ा जाता है; आप साफ़ करें)। |
| `maxBatchTargets` | `20` | `/testdrive` बैच सीमा। |
| `batchConcurrency` | `1` | बैच समानांतरता (क्रमिक pnpm-स्टोर विवाद से बचाता है)। |

## Tools & surfaces (उपकरण और सतहें)

### `test_drive`

```
test_drive(target: string, headlessTask?: string, background?: boolean)
```

- `target` — git स्पेक (`github:owner/repo#sha`, `git+https://...`), npm नाम, स्थानीय पथ या `.tgz` टारबॉल।
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
           "harnessVersion": "0.1.0-rc.6", "pluginVersion": "0.1.0",
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
    "uninstall": { "status": "pass", "exitCode": 0, "durationMs": 5123, "attempts": 1,
                   "summary": "remove ok (exit 0)", "outputTail": "" },
    "cleanup":   { "status": "pass", "quarantined": true, "removed": true,
                   "summary": "owned temp root quarantined and removed" }
  },
  "verdict": "pass",
  "verdictReason": "install, patch, boot, and uninstall verified; headless task inconclusive (see smoke.summary)"
}
```

निर्णय नियम: इंस्टॉल विफलता या बूट विफलता (`smoke.fail`) ⇒ `fail`; इंस्टॉल पास + पैच प्रभावी + साफ़ बूट (`pass`/`boot-ok`) + अनइंस्टॉल पास ⇒ `pass`; इंस्टॉल हुआ पर बाद की कोई पुष्टि अधूरी ⇒ `partial`; अन्यथा ⇒ `unknown`।

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

- `typecheck` स्थानीय harness चेकआउट से `@deepseek-ai/*` हल करता है; `typecheck:ci` प्रकाशित `0.1.0-rc.6` प्रकारों से जाँचता है।
- परीक्षण वास्तविक `Context`/`Session`/`ToolRuntime`/`LocalJobRegistry`/स्टोरेज स्टैक और एक स्क्रिप्टेड subprocess प्रदाता का उपयोग करते हैं।
- वास्तविक-CLI एंड-टू-एंड (नेटवर्क + PATH पर `dsh` आवश्यक): `DSH_TESTDRIVE_E2E=1 pnpm run test:e2e` — इसी पैकेज के चेकआउट को वास्तविक इंस्टॉल-स्मोक लूप से परखता है।
- रिलीज़: `node scripts/release.mjs <x.y.z>` (संस्करण बढ़ाता, CHANGELOG मुहर लगाता, द्वार फिर चलाता, commit + tag; कभी push नहीं)।

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `plugin-testing`, `install-smoke`, `compatibility-matrix`, `ci`

## Contributors (योगदानकर्ता)

[PerryLink](https://github.com/PerryLink) — डिज़ाइन और कार्यान्वयन।

## License (लाइसेंस)

[Apache-2.0](LICENSE)
