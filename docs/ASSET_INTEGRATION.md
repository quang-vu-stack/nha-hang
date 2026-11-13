# Tích hợp ghế Blender và giọng nhân viên — VIETNAM LIFE 3D

**Trạng thái:** Mã tích hợp nằm trên nhánh `feat/blender-stool-npc-greeting`, không sửa `main`.
Gói tải về trong cuộc trò chuyện: `VIETNAM_LIFE_3D_ghe_va_giong_noi.zip`.

## Cấu trúc tệp mong đợi

- `assets/models/ghe-nhua.glb` — mẫu ghế người dùng tạo bằng Blender, 240 tam giác, khoảng 25 KB.
- `assets/audio/npc-greeting-vien.mp3` — câu chào khách tiếng Việt khoảng 7,16 giây.

Cách dùng:
1. Lấy nhánh `feat/blender-stool-npc-greeting` về laptop bằng Git hoặc Antigravity.
2. Giải nén gói tài sản vào **thư mục gốc** `nha-hang/` sao cho hai đường dẫn bên trên khớp chính xác.
3. Chạy `py -m http.server 5173` từ thư mục dự án; mở `http://localhost:5173`.
4. Nếu có tệp GLB, ghế 3D được tạo quanh các bàn hiện có lúc tải game. Nếu thiếu GLB, ghế hình trụ của V0.2 vẫn giữ nguyên.
5. Nhấn nút **Nghe nhân viên chào khách** để phát MP3. Nếu thiếu MP3, trình duyệt dùng giọng tổng hợp có sẵn, nếu hỗ trợ.
6. Mua bàn mới hiện dùng ghế dạng cũ; bản sau sẽ nâng cấp để mô hình Blender được nhân bản theo bàn mới.

## Quyền sử dụng âm thanh

ElevenLabs Free cho phép sử dụng phi thương mại và yêu cầu ghi credit. Gói trả phí có điều kiện sử dụng thương mại khác nhau. **Chưa xác định được tài khoản tạo giọng là gói nào.**
Vì thế, **KHÔNG đẩy MP3 lên GitHub công khai** hoặc dùng vào sản phẩm thương mại cho đến khi xác minh quyền phù hợp. Âm thanh hiện được hỗ trợ dưới dạng tệp tùy chọn trên máy người dùng.
Mẫu ghi công khi dùng âm thanh từ Free (nếu cách sử dụng được cấp phép): "AI voice generated using ElevenLabs".

## Chức năng và giới hạn

- Mẫu ghế được gắn theo vị trí bàn V0.2; chưa có animation hoặc va chạm riêng.
- Lời thoại chỉ phát khi người chơi bấm nút, tránh autoplay gây khó chịu và chặn của trình duyệt.
- Không sử dụng bất kỳ API trả phí nào ở runtime.
- Những thành phần khác của game và save V0.2 được giữ nguyên.
- Bổ sung import map cho Three.js để GLTFLoader chạy trên Chrome/Edge.

## Kiểm thử cần làm trên máy người dùng

- `node --test tests/simulation.test.mjs tests/media-integration.test.mjs`
- `node --check src/restaurant-media.mjs`
- Mở game, kiểm tra ghế hiển thị đúng kích thước, không biến mất hay xuyên bàn.
- Mở DevTools Console, đảm bảo không có lỗi import. Kiểm tra fallback khi chưa thêm GLB.
- Phát thử MP3 bằng nút và tắt/tab game; xác minh không có autoplay.
- **Không tự merge và không tự triển khai công khai.**
