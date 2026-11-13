# 🇻🇳 VIETNAM LIFE 3D — Restaurant & City Simulator

**Dự án game 3D mô phỏng cuộc sống Việt Nam, khởi đầu tại Hà Nội.**

**Phiên bản hiện tại: V0.3 — Cư dân NPC có cuộc sống và nhu cầu cá nhân, thực đơn & hạch toán lợi nhuận bằng VND, nhân sự Đầu bếp / Phục vụ / Thu ngân hoạt động độc lập, cảnh quan Hà Nội 3D nâng cấp kèm pipeline GLB từ Blender và bảo vệ dữ liệu save.**

Người chơi làm chủ quán nhậu hư cấu **Nhậu Phố Việt**, quản lý cửa hàng, nhân viên (đầu bếp, phục vụ, thu ngân), thực đơn, nguyên liệu, tiền mặt, doanh thu, lợi nhuận ròng (VND) và trải nghiệm nhịp sống Hà Nội hàng ngày.

## 🎮 Chơi bản demo GitHub

1. Tải repository bằng **Code → Download ZIP** rồi giải nén (hoặc `git clone`).
2. Cài Python 3 trên Windows/macOS/Linux (nếu chưa có).
3. Trong thư mục chứa `index.html`, mở terminal / PowerShell và chạy:

```powershell
py -m http.server 5173
```

4. Mở **http://localhost:5173** bằng Chrome/Edge.

Bản demo này cũng có thể chạy trên GitHub Pages nếu **chủ repository chủ động bật** trong Settings → Pages. Chúng tôi chưa tự bật xuất bản công khai game.

> Cần Internet để tải thư viện Three.js, Leaflet và ảnh bản đồ từ CDN.

## Hiện trạng phiên bản V0.3

- ✅ **Đời sống cư dân NPC (`citizens`):** 35 cư dân Hà Nội có hồ sơ riêng (`id`, `name`, `role`, `home`, `workplace`, `budget` VND, `hunger`, `energy`, `mood`), lịch trình đi học, đi làm, ăn trưa/ăn tối, dạo phố, nghỉ ngơi và phản ứng với thời tiết mưa.
- ✅ **Chu trình khách nhậu đầy đủ:** Khách vào quán → chọn bàn trống → gọi món trong thực đơn → đầu bếp nấu (`cooking`) → phục vụ bưng bàn (`serving`) → ăn uống (`eating`) → ra quầy thu ngân thanh toán (`paying`) → rời quán (`finished`). Doanh thu chỉ được ghi nhận khi khách hoàn tất bước thanh toán.
- ✅ **Nhân sự độc lập (`staffRoster`):** Tách biệt 3 vai trò **Đầu bếp (`chef`)**, **Phục vụ (`waiter`)**, **Thu ngân (`cashier`)** với phân công công việc theo thời gian thực và chuyển động 3D độc lập giữa khu bếp, bàn ăn và quầy thu ngân.
- ✅ **Thực đơn, Nguyên liệu & Lợi nhuận VND:** 5 món đặc trưng Việt Nam (*Nem rán Hà Nội, Combo Bia hơi & Lạc rang, Bò lúc lắc khoai tây, Gà nướng mật ong, Lẩu Thái hải sản*) kèm quản lý 5 nhóm nguyên liệu, doanh thu ngày, chi phí mặt bằng/nhân sự, giá vốn nguyên liệu và lợi nhuận ròng (`todayProfit`) bằng VND.
- ✅ **Cảnh quan Hà Nội 3D nâng cấp & Ghế nhựa Blender GLB:** Nhà ống Hà Nội có ban công, bồn nước mái, biển hiệu tiếng Việt, đèn đường ban đêm, hiệu ứng mưa, phân khu quán nhậu (*Quầy Lễ Tân, Bếp Nóng, Thu Ngân, Khu Nguyên Liệu, Bàn ghế nhựa*), chặn va chạm tường (`resolvePlayerCollision`), và nạp trực tiếp mô hình ghế nhựa Blender `assets/models/ghe-nhua.glb` qua `GLTFLoader` (tự động fallback về ghế hình trụ khi thiếu tệp).
- ✅ **Lời chào nhân viên Lễ Tân & Đồng bộ khách 3D:** Nhân viên tại **Quầy Lễ Tân** chào đón khi người chơi đến gần (chỉ phát sau khi người chơi bật âm thanh qua nút `#greetNpc`, không autoplay, kèm thời gian chờ 15 giây chống lặp). Khách hàng 3D đồng bộ trực tiếp với trạng thái gọi món, hiện đĩa thức ăn & cốc bia trên bàn khi đang ăn (`eating`), và di chuyển ra Quầy Thu Ngân khi thanh toán (`paying`).
- ✅ **Tối ưu hiệu suất & Bảo vệ Save Game:** Tái sử dụng `BufferGeometry`/`Material`, phân tầng tần suất cập nhật NPC theo khoảng cách (`computeNpcLodTier`), giới hạn bộ nhớ lịch sử đơn/nhật ký, đóng gói save có kiểm tra `checksum` (FNV-1a), tự động khôi phục từ `backup slot` khi dữ liệu bị lỗi và tương thích ngược với save V0.1/V0.2.
- ✅ **Bản đồ Việt Nam thực tế 2D** qua OpenStreetMap / Leaflet.
- ✅ **Bộ kiểm thử tự động 27 bài test** chạy bằng Node 22 và GitHub Actions CI (`node --test tests/*.test.mjs`).

## Mục tiêu dài hạn

1. **Hà Nội sống động:** quận/phường, nhà dân, giao thông, sinh hoạt theo lịch.
2. **Nhà hàng thực tế:** đặt bàn, gọi món, nấu nướng, tuyển dụng, quản lý kho và công nợ.
3. **NPC có đời sống riêng:** nghề nghiệp, gia đình, công việc, tài chính, lịch trình.
4. **Mở rộng khắp Việt Nam:** bản đồ dựa trên dữ liệu địa lý thật, các vùng được dựng 3D theo giai đoạn.
5. **AI cùng phát triển:** ChatGPT thiết kế/QA, Claude Code / Antigravity lập trình, Gemini hỗ trợ 3D và code; Tripo, ElevenLabs có thể hỗ trợ tài sản khi đủ điều kiện sử dụng.

## Kiểm thử và phát triển

Chạy từ thư mục repo:

- Test (27 bài kiểm thử V0.3 & Media): `node --test tests/*.test.mjs`
- Kiểm tra cú pháp:
  - `node --check src/simulation.mjs`
  - `node --check src/restaurant-media.mjs`
  - `node --check src/world/asset-loader.mjs`
  - `node --check src/world/hanoi-scene.mjs`
- Tự động kiểm tra trên GitHub: Actions → VIETNAM LIFE 3D tests

Cấu trúc mã nguồn V0.3:

- `index.html` — giao diện điều hành quán nhậu, importmap Three.js & entrypoint 3D
- `src/simulation.mjs` — lõi mô phỏng V0.3: thực đơn VND, nguyên liệu, đơn hàng, nhân viên (bếp/phục vụ/thu ngân), đời sống NPC và bảo vệ dữ liệu save
- `src/restaurant-media.mjs` — nạp ghế nhựa Blender (`assets/models/ghe-nhua.glb`) kèm fallback và hệ thống lời chào nhân viên Quầy Lễ Tân có cooldown chống lặp
- `src/world/hanoi-scene.mjs` — cảnh quan khu phố Hà Nội 3D, nội thất quán Nhậu Phố Việt, đồng bộ khách 3D theo đơn hàng và va chạm vật lý
- `src/world/asset-loader.mjs` — manifest 8 tài sản 3D chuẩn Blender/Tripo (`.glb`), bộ đệm hình học/vật liệu và tối ưu LOD (`computeNpcLodTier`)
- `tests/simulation.test.mjs` — 21 bài kiểm thử logic mô phỏng V0.3
- `tests/media-integration.test.mjs` — 6 bài kiểm thử tích hợp GLB, lời chào lễ tân, cooldown và đồng bộ khách 3D
- `docs/` — tài liệu thiết kế game, hướng dẫn tích hợp tài sản (`docs/ASSET_INTEGRATION.md`) và quy trình phối hợp AI

## Tài liệu dự án

- [Game Design Document](docs/GAME_DESIGN.md)
- [Master Prompt phối hợp AI](docs/MASTER_PROMPT.md)
- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [AI TEAM — Prompt Claude Code, Gemini, Tripo, ElevenLabs và ChatGPT](docs/AI_TEAM_V02.md)
- [Hướng dẫn tích hợp Ghế Blender & Lời chào Lễ Tân](docs/ASSET_INTEGRATION.md)

## Lưu ý pháp lý và an toàn

Tên quán **Nhậu Phố Việt** là hư cấu; không mặc định có quyền dùng thương hiệu, logo hoặc bản thiết kế của **Quán Nhậu Tự Do**. Ghi công dữ liệu © OpenStreetMap contributors theo giấy phép tương ứng. Không đưa API key AI vào mã nguồn hay commit GitHub. Các tính năng AI trả phí không được bật mặc định.

**Repo chính:** https://github.com/quang-vu-stack/nha-hang
