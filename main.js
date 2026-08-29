(() => {
    "use strict";

    const THEME_GRAY = "#7d7d7d";

    const isThemeGray = (value) => {
        if (!value) return false;
        const v = String(value).trim().toLowerCase().replace(/\s+/g, "");
        if (v === THEME_GRAY) return true;
        if (v === "rgb(125,125,125)" || v === "rgba(125,125,125,1)") return true;
        return false;
    };

    const pageTextColor = () => getComputedStyle(document.body).color;

    const themeGrayFills = (svg, fillValue) => {
        const nodes = svg.querySelectorAll("[fill], [stroke], [style]");
        for (let i = 0; i < nodes.length; i += 1) {
            const el = nodes[i];
            const fill = el.getAttribute("fill");
            if (isThemeGray(fill)) {
                el.setAttribute("fill", fillValue);
            }
            const stroke = el.getAttribute("stroke");
            if (isThemeGray(stroke)) {
                el.setAttribute("stroke", fillValue);
            }
            const style = el.getAttribute("style");
            if (style && /#7d7d7d/i.test(style)) {
                el.setAttribute(
                    "style",
                    style.replace(/#7d7d7d/gi, fillValue === "currentColor" ? "currentColor" : fillValue)
                );
            }
        }
        const prev = svg.getAttribute("class") || "";
        if ((" " + prev + " ").indexOf(" themed-svg ") === -1) {
            svg.setAttribute("class", (prev + " themed-svg").replace(/^\s+/, ""));
        }
        if (fillValue === "currentColor") {
            svg.style.color = "var(--text-color)";
        } else {
            svg.style.color = fillValue;
        }
    };

    const injectObjectTheme = (doc) => {
        const svg = doc.documentElement;
        if (!svg) return;
        const color = pageTextColor();
        let styleEl = doc.getElementById("page-gray-theme");
        if (!styleEl) {
            styleEl = doc.createElementNS("http://www.w3.org/2000/svg", "style");
            styleEl.setAttribute("id", "page-gray-theme");
            svg.insertBefore(styleEl, svg.firstChild);
        }
        styleEl.textContent =
            '[fill="#7d7d7d" i],[fill="#7D7D7D"]{fill:' + color + " !important;}" +
            '[stroke="#7d7d7d" i],[stroke="#7D7D7D"]{stroke:' + color + " !important;}" +
            "svg{color:" + color + " !important;}";
        svg.style.color = color;
        themeGrayFills(svg, color);
    };

    const isSvgObject = (obj) => {
        const type = (obj.getAttribute("type") || "").toLowerCase();
        const src = obj.getAttribute("data") || "";
        return type.indexOf("svg") !== -1 || /\.svg(\?|#|$)/i.test(src);
    };

    const replaceObjectWithSvg = (obj, svg) => {
        if (!svg || svg.nodeName.toLowerCase() !== "svg") return false;
        if (!obj.parentNode) return false;
        themeGrayFills(svg, "currentColor");
        const imported = svg.ownerDocument === document ? svg : document.importNode(svg, true);
        obj.parentNode.replaceChild(imported, obj);
        return true;
    };

    const paintObjectIfReady = (obj) => {
        try {
            const doc = obj.contentDocument;
            if (!doc || !doc.documentElement) return false;
            if (doc.documentElement.nodeName.toLowerCase() !== "svg") return false;
            injectObjectTheme(doc);
            return true;
        } catch (error) {
            return false;
        }
    };

    const inlineSvgObject = (obj) => {
        if (obj.getAttribute("data-svg-inlined") === "1") {
            paintObjectIfReady(obj);
            return;
        }
        obj.setAttribute("data-svg-inlined", "1");

        const fromDoc = () => {
            try {
                const doc = obj.contentDocument;
                if (!doc) return false;
                return replaceObjectWithSvg(obj, doc.documentElement);
            } catch (error) {
                return false;
            }
        };

        const src = obj.getAttribute("data");
        if (!src) {
            if (!fromDoc()) obj.removeAttribute("data-svg-inlined");
            return;
        }

        const onLoad = () => {
            obj.removeEventListener("load", onLoad);
            if (obj.parentNode) {
                if (!fromDoc()) paintObjectIfReady(obj);
            }
        };
        obj.addEventListener("load", onLoad);

        let href = src;
        try {
            href = encodeURI(src);
        } catch (error) {}

        fetch(href)
            .then((res) => {
                if (!res.ok) throw new Error("svg fetch failed");
                return res.text();
            })
            .then((xml) => {
                if (!obj.parentNode) return;
                const parsed = new DOMParser().parseFromString(xml, "image/svg+xml");
                const svg = parsed.documentElement;
                if (!replaceObjectWithSvg(obj, svg)) {
                    if (!fromDoc()) {
                        obj.removeAttribute("data-svg-inlined");
                        paintObjectIfReady(obj);
                    }
                }
            })
            .catch(() => {
                if (!fromDoc()) {
                    obj.removeAttribute("data-svg-inlined");
                    paintObjectIfReady(obj);
                }
            });
    };

    function inlineSvgObjects(root) {
        const scope = root || document;
        const objects = scope.querySelectorAll("object");
        for (let i = 0; i < objects.length; i += 1) {
            if (isSvgObject(objects[i])) {
                inlineSvgObject(objects[i]);
            }
        }
    }

    function syncSvgTheme() {
        const color = pageTextColor();
        const pageSvgs = document.querySelectorAll("svg");
        for (let i = 0; i < pageSvgs.length; i += 1) {
            themeGrayFills(pageSvgs[i], "currentColor");
        }
        const objects = document.querySelectorAll("object");
        for (let j = 0; j < objects.length; j += 1) {
            if (isSvgObject(objects[j])) {
                paintObjectIfReady(objects[j]);
            }
        }
        return color;
    }

    const openPanel = (title, contentId) => {
        const rightPanel = document.getElementById("right-panel");
        const panelBody = document.getElementById("panel-body");
        const panelTitle = document.getElementById("panel-title");
        const layout = document.querySelector(".layout");
        if (!rightPanel || !panelBody) return;

        document.querySelectorAll(".detail-content").forEach((el) => {
            el.classList.remove("active");
        });

        const target = document.getElementById(contentId);
        if (target) {
            target.classList.add("active");
        }

        if (panelTitle) {
            panelTitle.textContent = title || "";
        }

        rightPanel.classList.add("open");
        if (layout) layout.classList.add("panel-open");
        window.setTimeout(() => inlineSvgObjects(target || panelBody), 0);
        window.setTimeout(syncSvgTheme, 50);
    };

    const closePanel = () => {
        const rightPanel = document.getElementById("right-panel");
        const layout = document.querySelector(".layout");
        if (!rightPanel) return;
        rightPanel.classList.remove("open");
        if (layout) layout.classList.remove("panel-open");
    };

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
            window.setTimeout(syncSvgTheme, 0);
        };

        updateUI();

        if (checkbox.dataset.bound !== "1") {
            checkbox.dataset.bound = "1";
            checkbox.addEventListener("change", () => {
                try {
                    localStorage.setItem(storageKey, checkbox.checked);
                } catch (error) {}
                updateUI();
            });
        }
    };

    const checkContrastState = () => {
        const invmodeCheckbox = document.getElementById("invmode");
        const contrastCheckbox = document.getElementById("contrast");
        if (!invmodeCheckbox || !contrastCheckbox) return;
        invmodeCheckbox.disabled = contrastCheckbox.checked;
    };

    let rainbowFrame = 0;
    let delegated = false;

    window.initFlashlightSite = function initFlashlightSite() {
        if (rainbowFrame) {
            cancelAnimationFrame(rainbowFrame);
            rainbowFrame = 0;
        }

        const rainbowElements = document.querySelectorAll(".rbw");
        if (rainbowElements.length > 0) {
            let hue = 0;
            const animateRainbow = () => {
                rainbowElements.forEach((element) => {
                    element.style.color = `hsl(${hue}, 80%, 60%)`;
                });
                hue = (hue + 5) % 360;
                rainbowFrame = requestAnimationFrame(animateRainbow);
            };
            animateRainbow();
        }

        setupToggle({
            inputId: "contrast",
            storageKey: "contrast",
            labels: ["❀標準色", "✿高對比"],
            className: "contrast"
        });

        setupToggle({
            inputId: "invmode",
            storageKey: "inverted",
            labels: ["☀亮主題", "★暗主題"],
            className: "inverted"
        });

        if (!delegated) {
            delegated = true;

            document.addEventListener("click", (e) => {
                const closeBtn = e.target.closest("#panel-close");
                if (closeBtn) {
                    closePanel();
                    return;
                }
                const btn = e.target.closest(".trigger-item");
                if (!btn) return;
                const contentId = btn.id.replace(/^open-/, "");
                const title = btn.getAttribute("title") || btn.textContent.trim();
                openPanel(title, contentId);
            });

            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    closePanel();
                }
            });

            document.addEventListener("change", (e) => {
                if (e.target && e.target.id === "contrast") {
                    checkContrastState();
                }
            });
        }

        checkContrastState();
        inlineSvgObjects(document.querySelector(".aside-preview"));
        window.setTimeout(syncSvgTheme, 80);
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => window.initFlashlightSite());
    } else {
        window.initFlashlightSite();
    }
})();
