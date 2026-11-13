# 🇻🇳 VIETNAM LIFE 3D — Restaurant & City Simulator

**Dự án game 3D mô phỏng cuộc sống Việt Nam, khởi đầu tại Hà Nội.**

**Phiên bản trên GitHub hiện tại: V0.2 — NPC có lịch sinh hoạt, khách vào bàn và đơn hàng được xử lý qua bếp/nhân viên.**

Người chơi làm chủ quán nhậu hư cấu **Nhậu Phố Việt**, quản lý cửa hàng, nhân viên, nguyên liệu, tiền, doanh thu và trải nghiệm cuộc sống hàng ngày. Có người dân NPC di chuyển, xe cộ trên phố và vòng lặp kinh doanh.

## 🎮 Chơi bản demo GitHub

1. Tải repository bằng **Code → Download ZIP** rồi giải nén.
2. Cài Python 3 trên Windows (nếu chưa có).
3. Trong thư mục chứa `index.html`, mở PowerShell và chạy:

```powershell
py -m http.server 5173
```

4. Mở **http://localhost:5173** bằng Chrome/Edge.

Bản demo này cũng có thể chạy trên GitHub Pages nếu **chủ repository chủ động bật** trong Settings → Pages. Chúng tôi chưa tự bật xuất bản công khai game.

> Cần Internet để tải thư viện Three.js, Leaflet và ảnh bản đồ từ CDN.

## Hiện trạng phiên bản V0.2

- ✅ Một khu phố Hà Nội **cách điệu** (không phải mô hình 1:1).
- ✅ Quán nhậu, bàn ăn, NPC đi bộ có lịch sinh hoạt theo nghề nghiệp, xe máy trên phố.
- ✅ Khách đến quán và được xếp bàn; bếp chế biến, nhân viên phục vụ; doanh thu được cộng khi món phục vụ xong.
- ✅ Theo dõi đơn đang xử lý, nhật ký, doanh thu hằng ngày; có thể tạm đóng/mở quán.
- ✅ Người chơi có thể di chuyển bằng **WASD / phím mũi tên**, kéo chuột để xoay camera, cuộn để zoom.
- ✅ Quản lý nhập hàng, thuê nhân viên, mua bàn, chạy quảng cáo, doanh thu theo đơn và chi phí hằng ngày.
- ✅ Chu trình thời gian, ngày đêm và trạng thái mưa nắng giả lập.
- ✅ Bản đồ Việt Nam thực tế **2D** qua OpenStreetMap / Leaflet, chưa khám phá 3D toàn quốc.
- ✅ Lưu dữ liệu trong localStorage **trên trình duyệt hiện tại**.
- ⚠️ Đây vẫn là **prototype HTML + mô-đun JavaScript**, chưa có đồ họa/nhân vật chân thực, map 3D địa lý hoặc AI nói chuyện tự do. Bộ ZIP V0.1 trước đây là bản riêng; phiên bản trên GitHub đã nâng cấp thành V0.2.
- ✅ Bộ kiểm thử logic chạy bằng Node 22 và GitHub Actions CI. Xem mục Kiểm thử bên dưới.
- ⚠️ Chưa hoàn tất kiểm thử trực tiếp giao diện WebGL và iPhone.

## Mục tiêu dài hạn

1. **Hà Nội sống động:** quận/phường, nhà dân, giao thông, sinh hoạt theo lịch.
2. **Nhà hàng thực tế:** đặt bàn, gọi món, nấu nướng, tuyển dụng, quản lý kho và công nợ.
3. **NPC có đời sống riêng:** nghề nghiệp, gia đình, công việc, tài chính, lịch trình.
4. **Mở rộng khắp Việt Nam:** bản đồ dựa trên dữ liệu địa lý thật, các vùng được dựng 3D theo giai đoạn.
5. **AI cùng phát triển:** ChatGPT thiết kế/QA, Claude Code lập trình, Gemini hỗ trợ 3D và code; Tripo, ElevenLabs có thể hỗ trợ tài sản khi đủ điều kiện sử dụng.

## Kiểm thử và phát triển

Chạy từ thư mục repo:

- Test: node --test tests/simulation.test.mjs
- Kiểm tra cú pháp: node --check src/simulation.mjs
- Tự động kiểm tra trên GitHub: Actions → VIETNAM LIFE 3D tests

Cấu trúc:

- index.html — giao diện game 3D
- src/simulation.mjs — logic đơn hàng, nhân viên, khách, ngày giờ và lịch NPC
- tests/simulation.test.mjs — 10 bài kiểm thử logic V0.2
- docs/AI_TEAM_V02.md — prompt riêng cho các AI và quy trình làm việc không xung đột

## Tài liệu dự án

- [Game Design Document](docs/GAME_DESIGN.md)
- [Master Prompt phối hợp AI](docs/MASTER_PROMPT.md)
- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [AI TEAM — Prompt Claude Code, Gemini, Tripo, ElevenLabs và ChatGPT](docs/AI_TEAM_V02.md)

## Lưu ý pháp lý và an toàn

Tên quán **Nhậu Phố Việt** là hư cấu; không mặc định có quyền dùng thương hiệu, logo hoặc bản thiết kế của **Quán Nhậu Tự Do**. Ghi công dữ liệu © OpenStreetMap contributors theo giấy phép tương ứng. Không đưa API key AI vào mã nguồn hay commit GitHub. Các tính năng AI trả phí không được bật mặc định.

**Repo chính:** https://github.com/quang-vu-stack/nha-hang
