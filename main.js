(() => {
        "use strict";

        // ===== 1. 彩虹文字特效 =====
        // 1. 改用 querySelectorAll 選取所有類別為 rbw 的元素
        const rainbowElements = document.querySelectorAll(".rbw");
        // 2. 檢查是否至少有找到一個元素
        if (rainbowElements.length > 0) {
            let hue = 0;
            const animateRainbow = () => {
                // 3. 使用 forEach 遍歷所有選到的元素，同步更新顏色
                rainbowElements.forEach((element) => {
                    element.style.color = `hsl(${hue}, 80%, 60%)`;
                });
                hue = (hue + 5) % 360;
                requestAnimationFrame(animateRainbow);
            };
            animateRainbow();
        }

        // ===== 2. 封裝用的切換開關函式 =====
        const setupToggle = ({ inputId, storageKey, labels, className }) => {
            const checkbox = document.getElementById(inputId);
            const label = document.querySelector(`label[for="${inputId}"]`);

            if (!checkbox || !label) return;

            let savedState = null;
            try {
                savedState = localStorage.getItem(storageKey);
            } catch (error) {
                console.warn("LocalStorage access denied");
            }

            if (savedState !== null) {
                checkbox.checked = savedState === "true";
            }

            const updateUI = () => {
                label.textContent = labels[checkbox.checked ? 1 : 0];
                if (checkbox.checked) {
                    document.documentElement.classList.add(className);
                } else {
                    document.documentElement.classList.remove(className);
                }
            };

            updateUI();

            checkbox.addEventListener("change", () => {
                try {
                    localStorage.setItem(storageKey, checkbox.checked);
                } catch (error) {}
                updateUI();
            });
        };

        // ===== 3. 啟用模式切換 =====
        setupToggle({
            inputId: "contrast",
            storageKey: "contrast",
            labels: ["開啟->高對比背景", "關閉->預設背景"],
            className: "contrast"
        });

        setupToggle({
            inputId: "invmode",
            storageKey: "inverted",
            labels: ["開啟->灰階背景", "關閉->白色背景"],
            className: "inverted"
        });

        // ===== 4. 右側面板控制 =====
        const rightPanel = document.getElementById("right-panel");
        const panelBody = document.getElementById("panel-body");
        const panelTitle = document.getElementById("panel-title");
        const closeBtn = document.getElementById("panel-close");
        const layout = document.querySelector(".layout");

        // 開啟面板並顯示指定內容
        const openPanel = (title, contentId) => {
            if (!rightPanel || !panelBody) return;

            // 隱藏所有 detail
            document.querySelectorAll(".detail-content").forEach(el => {
                el.classList.remove("active");
            });

            // 顯示目標內容
            const target = document.getElementById(contentId);
            if (target) {
                target.classList.add("active");
            }

            // 設定標題
            if (panelTitle) {
                panelTitle.textContent = title || "";
            }

            // 開啟面板
            rightPanel.classList.add("open");
            if (layout) layout.classList.add("panel-open");
        };

            // 關閉面板
            const closePanel = () => {
                if (!rightPanel) return;
                rightPanel.classList.remove("open");
                if (layout) layout.classList.remove("panel-open");
            };

                // 綁定關閉按鈕
                if (closeBtn) {
                    closeBtn.addEventListener("click", closePanel);
                }

                // 點擊觸發項目（使用 id + title，符合 XHTML 1.0 Strict）
                // 按鈕 id 格式：open-detail-xxx  → 對應內容 id：detail-xxx
                document.querySelectorAll(".trigger-item").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const contentId = btn.id.replace(/^open-/, "");
                        const title = btn.getAttribute("title") || btn.textContent.trim();
                        openPanel(title, contentId);
                    });
                });

                // ESC 鍵關閉
                document.addEventListener("keydown", (e) => {
                    if (e.key === "Escape") {
                        closePanel();
                    }
                });

                // 點擊面板外關閉
                document.addEventListener("click", (e) => {
                    if (!rightPanel || !rightPanel.classList.contains("open")) return;
                    if (rightPanel.contains(e.target)) return;
                    if (e.target.closest(".trigger-item")) return;
                    closePanel();
                });

})();
