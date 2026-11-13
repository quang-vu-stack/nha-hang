# 🇻🇳 VIETNAM LIFE 3D — Restaurant & City Simulator

**Dự án game 3D mô phỏng cuộc sống Việt Nam, khởi đầu tại Hà Nội.**

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

## Hiện trạng phiên bản

- ✅ Một khu phố Hà Nội **cách điệu** (không phải mô hình 1:1).
- ✅ Quán nhậu, bàn ăn, NPC đi bộ và phương tiện di chuyển.
- ✅ Người chơi có thể di chuyển bằng **WASD / phím mũi tên**, kéo chuột để xoay camera, cuộn để zoom.
- ✅ Quản lý nhập hàng, thuê nhân viên, mua bàn, chạy quảng cáo, doanh thu và chi phí.
- ✅ Chu trình thời gian, ngày đêm và trạng thái mưa nắng giả lập.
- ✅ Bản đồ Việt Nam thực tế **2D** qua OpenStreetMap / Leaflet, chưa khám phá 3D toàn quốc.
- ✅ Lưu dữ liệu trong localStorage **trên trình duyệt hiện tại**.
- ⚠️ Đây là **demo đơn tệp tối giản cho GitHub**. Bộ ZIP `VIETNAM_LIFE_3D_v0.1.zip` được bàn giao riêng trong ChatGPT chứa phiên bản V0.1 khác và đầy đủ mã nguồn hơn. Chưa đồng bộ toàn bộ mã ZIP vào repository.
- ⚠️ Chưa hoàn tất kiểm thử trực tiếp giao diện WebGL và iPhone.

## Mục tiêu dài hạn

1. **Hà Nội sống động:** quận/phường, nhà dân, giao thông, sinh hoạt theo lịch.
2. **Nhà hàng thực tế:** đặt bàn, gọi món, nấu nướng, tuyển dụng, quản lý kho và công nợ.
3. **NPC có đời sống riêng:** nghề nghiệp, gia đình, công việc, tài chính, lịch trình.
4. **Mở rộng khắp Việt Nam:** bản đồ dựa trên dữ liệu địa lý thật, các vùng được dựng 3D theo giai đoạn.
5. **AI cùng phát triển:** ChatGPT thiết kế/QA, Claude Code lập trình, Gemini hỗ trợ 3D và code; Tripo, ElevenLabs có thể hỗ trợ tài sản khi đủ điều kiện sử dụng.

## Tài liệu dự án

- [Game Design Document](docs/GAME_DESIGN.md)
- [Master Prompt phối hợp AI](docs/MASTER_PROMPT.md)
- [Project Overview](docs/PROJECT_OVERVIEW.md)

## Lưu ý pháp lý và an toàn

Tên quán **Nhậu Phố Việt** là hư cấu; không mặc định có quyền dùng thương hiệu, logo hoặc bản thiết kế của **Quán Nhậu Tự Do**. Ghi công dữ liệu © OpenStreetMap contributors theo giấy phép tương ứng. Không đưa API key AI vào mã nguồn hay commit GitHub. Các tính năng AI trả phí không được bật mặc định.

**Repo chính:** https://github.com/quang-vu-stack/nha-hang
