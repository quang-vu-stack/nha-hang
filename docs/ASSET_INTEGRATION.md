# Tích hợp ghế Blender và lời chào nhân viên Lễ Tân — VIETNAM LIFE 3D V0.3

**Trạng thái:** Tích hợp hoàn chỉnh cùng hệ thống V0.3 trên nhánh tích hợp riêng (không sửa trực tiếp `main`).

## 1. Cấu trúc tệp tài nguyên

- `assets/models/ghe-nhua.glb` — Mô hình ghế nhựa quán nhậu Hà Nội (glTF 2.0 binary, 240 tam giác, kích thước thực tế ~0.34m × 0.46m × 0.34m, tự động co giãn về `0.72` world units trong scene).
- `assets/audio/npc-greeting-vien.mp3` *(tùy chọn, được chặn trong `.gitignore`)* — Câu chào khách tiếng Việt tại quầy lễ tân.

## 2. Cơ chế hoạt động

1. **Ghế nhựa Blender (`installUserStools` trong `src/restaurant-media.mjs`):**
   - Nạp `./assets/models/ghe-nhua.glb` qua `GLTFLoader` (sử dụng `<script type="importmap">` cho `three` và `three/addons/`).
   - Tự động đo `Box3` để chuẩn hóa chiều cao ghế phù hợp với bàn nhậu V0.3 và ẩn ghế hình trụ dự phòng (`fallbackStools`).
   - Khi người chơi mua thêm bàn mới (`🪑 Mua thêm bàn`), ghế nhựa Blender cũng tự động được nhân bản cho bàn mới.
   - **Fallback an toàn:** Nếu thiếu hoặc lỗi tệp `ghe-nhua.glb`, trò chơi giữ nguyên ghế hình trụ dự phòng và không gây lỗi dừng game.

2. **Lời chào nhân viên tại Quầy Lễ Tân (`installNpcGreeting` & `shouldTriggerReceptionGreeting`):**
   - **Không autoplay:** Âm thanh mặc định tắt khi vừa mở trang để tuân thủ chính sách trình duyệt và trải nghiệm người dùng.
   - Khi người chơi nhấn nút **`🔊 Nghe nhân viên chào khách`** (`#greetNpc`), âm thanh lời chào được bật và phát ngay câu thoại:
     > *"Dạ, em chào anh chị ạ. Nhà mình đi mấy người để em sắp xếp bàn? Anh chị muốn ngồi trong nhà hay ngoài trời ạ?"*
   - **Kích hoạt theo vị trí Quầy Lễ Tân + Cooldown chống lặp:** Khi người chơi điều khiển nhân vật (`WASD` / phím mũi tên) đi đến gần **Quầy Lễ Tân** (`RESTAURANT_ZONES.reception`, bán kính `5.5m`), nếu đã bật âm thanh thì nhân viên lễ tân sẽ tự động chào đón, kèm **thời gian chờ 15 giây (`GREETING_COOLDOWN_MS = 15000`)** để tránh lặp lại liên tục.
   - **Fallback giọng nói:** Nếu chưa chép tệp `assets/audio/npc-greeting-vien.mp3` vào máy, hệ thống tự động chuyển sang giọng đọc tiếng Việt của trình duyệt (`window.speechSynthesis`, `vi-VN`) kết hợp hiển thị phụ đề.

## 3. Quyền sử dụng âm thanh & Bảo mật

- ElevenLabs Free chỉ cho phép sử dụng phi thương mại kèm ghi công (*"AI voice generated using ElevenLabs"*).
- Do chưa xác minh gói bản quyền phân phối công khai của tệp MP3, đường dẫn `assets/audio/npc-greeting-vien.mp3` và `assets/audio/chao-khach-vien.mp3` được đưa vào `.gitignore` để **không đẩy MP3 lên GitHub công khai**.
- Không sử dụng bất kỳ API trả phí nào ở runtime.

## 4. Kiểm thử

```bash
node --check src/simulation.mjs
node --check src/restaurant-media.mjs
node --check src/world/asset-loader.mjs
node --check src/world/hanoi-scene.mjs
node --test tests/*.test.mjs
```
