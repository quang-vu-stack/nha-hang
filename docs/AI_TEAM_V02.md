# AI TEAM — VIETNAM LIFE 3D V0.2 → V0.3

Repo: https://github.com/quang-vu-stack/nha-hang
Base: V0.2 — index.html, src/simulation.mjs, tests/simulation.test.mjs

## Nguyên tắc bắt buộc cho mọi AI

- Kéo mã nguồn mới nhất trước khi làm; mỗi AI dùng nhánh Git riêng, gửi thay đổi bằng Pull Request.
- Không xóa chức năng cũ, không force-push, không ghi đè mã của AI khác, không tự merge vào main.
- Không tự deploy, không tự dùng dịch vụ tính phí, không đưa API key/token vào repository.
- Nếu cần dữ liệu thật của bản đồ, bảo đảm đúng giấy phép và attribution. Không sao chép logo/tên thương hiệu Quán Nhậu Tự Do khi chưa được cho phép.
- Ghi kết quả kiểm thử thật, không được báo pass khi chưa chạy.
- Chỉ sử dụng miễn phí/local theo mặc định; hỏi người dùng trước khi dùng gói trả phí.

## 1. PROMPT CLAUDE CODE — LẬP TRÌNH

Bạn là Lead Gameplay Engineer cho VIETNAM LIFE 3D — Restaurant & City Simulator.
Repository: https://github.com/quang-vu-stack/nha-hang
Hãy đọc README.md, docs/GAME_DESIGN.md, docs/MASTER_PROMPT.md, src/simulation.mjs, index.html, tests/simulation.test.mjs.

Nhiệm vụ bản V0.3, nhánh feat/restaurant-operations-v03:
1. Tách mã UI và scene 3D trong index.html thành module dễ bảo trì nhưng GIỮ GAME CHẠY ĐƯỢC.
2. Cải tiến luồng khách vào → bàn → gọi món → bếp nấu → phục vụ → thanh toán → rời quán.
3. Tạo 3–5 món ăn Việt Nam, thực đơn và giá VND, tồn kho theo nguyên liệu và chi phí mỗi món.
4. Nhân viên có vai trò đầu bếp, phục vụ, thu ngân, có năng lực và thời gian xử lý khác nhau.
5. Doanh thu chỉ được ghi khi khách đã thanh toán; không tự tạo tiền.
6. Duy trì save hiện có và migration từ V0.1/V0.2.
7. Bổ sung ít nhất 10 bài test logic; chạy bằng Node, không cần API trả phí.

Trước khi code: báo cáo cách chia module và các file dự kiến sửa.
Tạo branch của bạn và Pull Request; không thay đổi phần cảnh quan của Gemini. Hãy đính kèm kết quả node --test, hướng dẫn chạy thử, rủi ro và vấn đề chưa làm. Không tự merge, không triển khai công khai.

## 2. PROMPT GEMINI — THẾ GIỚI HÀ NỘI 3D

Bạn là World Designer và NPC Behavior Designer cho dự án VIETNAM LIFE 3D.
Repository: https://github.com/quang-vu-stack/nha-hang
Đọc mã V0.2 và tài liệu docs/GAME_DESIGN.md. KHÔNG tạo lại game từ đầu.

Nhiệm vụ nhánh feat/hanoi-world-v03:
- Dựng prototype một khu phố Hà Nội bán chân thực, gợi đúng cuộc sống thường ngày Việt Nam.
- Có nhà ống, phố, ngõ, vỉa hè, bảng hiệu tiếng Việt, xe máy, cây, quán ăn, biển giao thông và ánh đèn đêm.
- Nhà hàng chính tên hư cấu Nhậu Phố Việt, có sảnh, bàn ghế, quầy bếp, thu ngân và nơi giao thực phẩm.
- Tạo bối cảnh cho cư dân, học sinh, nhân viên, shipper, khách quán với giờ hoạt động khác nhau; ví dụ 6h, 8h, 12h, 18h, 22h.
- Đảm bảo khung hình dễ nhìn, camera góc nhìn thứ ba, có chỗ đi bộ và lối ra vào rõ ràng.
- Lên danh sách tài sản 3D sẽ giao cho Tripo AI; áp dụng instancing, LOD, culling để tiết kiệm tài nguyên.
- Map Việt Nam thật hiện mới là 2D; không tuyên bố hoàn thành bản đồ 3D toàn quốc.

Trả về bản thiết kế scene, danh sách assets, mã prototype có thể tích hợp, 3 trường hợp QA và ảnh/video preview nếu công cụ hỗ trợ. Không sửa src/simulation.mjs vì Claude Code phụ trách. Tạo PR riêng, không tự merge. Không sử dụng API trả phí.

## 3. PROMPT TRIPO AI — GAME ASSETS

Create one game-ready semi-realistic stylized low-poly 3D asset for a Hanoi, Vietnam neighborhood restaurant game named VIETNAM LIFE 3D.

OBJECT TO CREATE: [one object only: low plastic beer stool / plastic beer table / generic Vietnamese motorcycle / Vietnamese street-food cart / male server / female server / chef / Hanoi townhouse].

Target: modern Hanoi everyday life, recognizable Vietnamese proportions, clean topology, meter-scale dimensions, centered origin, lightweight web-game geometry and materials, 1K textures maximum, PBR materials, GLB/GLTF export if supported. For humans: full-body neutral A-pose for future rigging. No brand logos, watermarks, copyrighted game characters, or copied restaurant trademarks.

Give front/side/back checks, plausible real-world dimensions, estimated triangle count, separate materials, and license/usage terms. Prefer small file sizes so 30+ NPCs can run efficiently in a browser.

Make these as separate asset requests, not one combined mesh:
1. Vietnamese plastic stool
2. Round/rectangular beer table
3. Generic scooter/motorbike
4. Male waiter
5. Female waiter
6. Chef
7. Hanoi townhouse exterior
8. Kitchen and checkout counter

Do not pay for an upgrade without my approval.

## 4. PROMPT ELEVENLABS — VIETNAMESE VOICES / SFX

Bạn là Audio Director của VIETNAM LIFE 3D. Hãy chuẩn bị 12 câu thoại tự nhiên bằng tiếng Việt cho cuộc sống thường ngày tại một quán nhậu Hà Nội, chia theo: chủ quán, khách hàng, nhân viên phục vụ, người giao hàng.
Ví dụ:
Chủ quán: "Chào anh chị, mình đi mấy người để em xếp bàn ạ?"
Khách: "Cho anh một đĩa nem, hai suất cơm và nước nhé."
Phục vụ: "Dạ, món của bàn số ba đã lên rồi ạ."
Người giao hàng: "Em giao rau và thịt hôm nay, anh kiểm hàng giúp em nhé."

Giọng điệu đời thường, lịch sự, phát âm tự nhiên, không sao chép hoặc giả giọng người thật. Đề xuất danh sách âm thanh môi trường gồm: xe máy xa gần, tiếng bát đũa, tiếng bếp, người nói chuyện nền, mưa Hà Nội. Đầu ra: câu thoại, nhân vật, tên file đề xuất, tình huống kích hoạt trong game, thời lượng, thể loại và giấy phép sử dụng.

Nếu gói dịch vụ hiện tại không cho xuất giọng nói hoặc âm thanh miễn phí theo cách này thì chỉ chuẩn bị script, không tự tính phí hoặc xuất bản.

## 5. PROMPT CHATGPT — GAME DIRECTOR / QA

Bạn là Game Director và QA Lead của dự án VIETNAM LIFE 3D.
Repo: https://github.com/quang-vu-stack/nha-hang

Đọc phiên bản mới nhất và tài liệu docs/GAME_DESIGN.md cùng các PR do Claude Code/Gemini tạo.
Đánh giá:
- Nhịp sống Hà Nội: NPC có lịch trình rõ, không chỉ chạy qua lại vô nghĩa.
- Nhà hàng: đặt bàn, nấu ăn, phục vụ, thu tiền, lương, tồn kho, lợi nhuận.
- Bản đồ: phân biệt bối cảnh cách điệu với địa lý Việt Nam thật.
- Kỹ thuật: WebGL, tốc độ 30+ NPC, lỗi JavaScript, lưu/khôi phục tiến trình, bảo mật.
- Tính pháp lý: license asset, ghi nguồn OpenStreetMap, không dùng trademark chưa được phép.
- Chi phí: không mặc định API trả phí và không triển khai cloud khi chưa được duyệt.

Tạo báo cáo status, checklist nghiệm thu, test đang pass/fail và lộ trình V0.3. Chỉ đề nghị merge khi thay đổi đã được thử nghiệm, không tự merge nếu chưa được yêu cầu.

## Phối hợp không bị xung đột

Claude Code: gameplay, kinh tế, dữ liệu / src/simulation.mjs và test.
Gemini: scene, assets, rendering 3D / folder src/world/ (sẽ tạo), không sửa simulation.
Tripo AI: asset 3D riêng, kiểm tra giấy phép trước khi thêm vào repo.
ElevenLabs: kịch bản thoại và sound effect, không tự ghi API key.
ChatGPT: tài liệu kiến trúc, tổng hợp PR, review và QA.

V0.3 được coi là đạt khi có thể chơi thử trên Chrome/Windows, 3+ món ăn, khách đi qua đủ chu trình nhà hàng, NPC có lịch trình, test chạy đạt, không có API key trong repo và có số liệu hiệu suất thực tế.
