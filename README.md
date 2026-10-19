# 视频标签页自动整理 / Video Tab Organizer

自动检测正在播放视频的标签页，并把它们集中移动到浏览器窗口右侧，让视频页面和文字页面不再混在一起。

Automatically detects tabs that are playing video and moves them to the right side of the browser window.

> **版权与使用限制 / Copyright & Usage**
>
> 本项目源码仅供查看、学习和个人非商业使用。**未经作者书面许可，禁止将本项目代码或衍生作品用于任何商业目的、销售、再分发或构建竞争产品。** 商业授权请联系作者。
>
> This source code is provided for viewing, learning, and personal
> non-commercial use only. **Commercial use, resale, redistribution, or
> building a competing product from this code is prohibited without prior
> written permission from the author.** For commercial licensing, please
> contact the author.

## 功能 / Features

- 自动检测页面中 `<video>` 元素的播放状态
- 正在播放视频的标签页自动移动到窗口右侧
- 右侧视频标签页按打开顺序排列，可切换“早打开的靠左”或“晚打开的靠左”
- 固定标签页始终保留在最左侧，不参与移动
- 多窗口独立整理，互不影响
- 弹窗中可启用/暂停自动整理，或手动点击“立即整理一次”
- 不收集、不上传任何用户数据，所有逻辑在本地完成

- Detects the playback state of `<video>` elements
- Moves tabs playing video to the right side of the window
- Orders video tabs by opening time, with switchable sort direction
- Pinned tabs always stay on the far left
- Organizes each window independently
- Popup controls for enabling/pausing auto-organization and manual reorder
- No data collection or upload; everything runs locally

## 安装 / Installation

### 开发者模式加载 / Load unpacked

1. 下载本仓库代码，或从 [Releases](../../releases) 下载 zip 并解压
2. 打开 `chrome://extensions/`（Edge 为 `edge://extensions/`）
3. 打开“开发者模式”
4. 点击“加载已解压的扩展程序”，选择包含 `manifest.json` 的文件夹
5. 安装后刷新已经打开的网页

1. Download this repository or the zip from [Releases](../../releases)
2. Open `chrome://extensions/` (or `edge://extensions/`)
3. Enable Developer mode
4. Click "Load unpacked" and select the folder containing `manifest.json`
5. Refresh any already-open pages after installation

## 权限说明 / Permissions

- `tabs`：查询和移动标签页 / query and move tabs
- `storage`：保存启用状态和排序方向 / save settings
- 访问网页内容：检测页面中是否存在正在播放的 `<video>` 元素 / detect playing `<video>` elements

## 已知限制 / Known Limitations

- 检测依赖普通 DOM 中的 `<video>` 元素；使用 Shadow DOM 或特殊播放器的网站可能无法识别，例如部分 B 站播放器
- 右侧视频标签页的排序使用标签页 ID 近似表示打开顺序，并非精确时间戳
- 固定标签页始终保留在最左侧，不参与视频页移动

## 隐私 / Privacy

本扩展不收集、不存储、不上传任何用户数据。所有视频检测和标签页整理均在本地浏览器中完成。

This extension does not collect, store, or upload any user data. All detection and organization happen locally in the browser.

## 技术栈 / Tech Stack

JavaScript, Chrome Extensions API (Manifest V3), MutationObserver

## 商业授权 / Commercial Licensing

如需商业使用授权，请通过 GitHub Issue 或作者邮箱联系。

For commercial licensing inquiries, please contact the author via GitHub Issues or email.

## License

Source Available, Non-Commercial. See [LICENSE](LICENSE) for details.
