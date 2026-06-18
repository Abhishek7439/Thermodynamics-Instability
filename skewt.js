/**
 * skewt.js — Skew-T / Log-P Diagram with Hodograph
 *
 * Pure client-side SVG renderer for atmospheric sounding profiles.
 * Reads from the levelData array attached to each sounding record
 * in window.appData by parseLevels() (parser.js).
 *
 * Thermodynamic references:
 *   - Dry adiabats:  Poisson's equation  θ = T·(P₀/P)^(Rd/cp)
 *                    Rd = 287.05 J/(kg·K),  cp = 1005.7 J/(kg·K),
 *                    κ = Rd/cp ≈ 0.2854
 *   - Moist adiabats: Bolton (1980) iterative pseudo-adiabatic lapse.
 *                    "The Computation of Equivalent Potential Temperature"
 *                    Monthly Weather Review, 108, 1046–1053.
 *   - Saturation mixing ratio: uses Tetens formula for saturation vapour
 *                    pressure: es = 6.112 · exp(17.67·T / (T + 243.5))
 *                    then ws = 0.622 · es / (P - es)  (g/kg when ×1000)
 */

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */
const SKEWT = (() => {
    // Physical constants
    const Rd  = 287.05;   // J/(kg·K) — gas constant for dry air
    const cp  = 1005.7;   // J/(kg·K) — specific heat at constant pressure
    const K   = Rd / cp;  // ≈ 0.2854 — Poisson exponent
    const Lv  = 2.501e6;  // J/kg     — latent heat of vaporisation (at 0°C)
    const Rv  = 461.5;    // J/(kg·K) — gas constant for water vapour
    const P0  = 1000;     // hPa      — reference pressure
    const g   = 9.80665;  // m/s²

    // Layout dimensions (SVG viewBox units)
    const MARGIN = { top: 40, right: 75, bottom: 40, left: 60 };
    const WIDTH  = 800;
    const HEIGHT = 800;
    const PLOT_W = WIDTH  - MARGIN.left - MARGIN.right;
    const PLOT_H = HEIGHT - MARGIN.top  - MARGIN.bottom;

    // Pressure range
    const P_TOP    = 100;   // hPa
    const P_BOTTOM = 1050;  // hPa (a bit beyond 1000 for surface data > 1000)

    // Temperature range (°C) — visible window at 1000 hPa baseline
    const T_MIN = -40;
    const T_MAX =  50;

    // Skew factor — higher = more skew
    const SKEW = 37;

    // Standard isobar levels for grid
    const STD_ISOBARS = [1000, 850, 700, 500, 400, 300, 200, 100];

    /* ───────────────────────────────────────────────────────────────
       COORDINATE TRANSFORMS
       ─────────────────────────────────────────────────────────────── */
    function yFromP(p) {
        // Log-pressure y: 0 at P_TOP, PLOT_H at P_BOTTOM
        const logTop = Math.log(P_TOP);
        const logBot = Math.log(P_BOTTOM);
        return PLOT_H * (Math.log(p) - logTop) / (logBot - logTop);
    }

    function xFromT(t, p) {
        // Skew transform: screen x shifts right as pressure decreases
        const skewOffset = SKEW * Math.log(P0 / p);
        const tNorm = (t + skewOffset - T_MIN) / (T_MAX - T_MIN + SKEW * Math.log(P0 / P_TOP));
        return tNorm * PLOT_W;
    }

    /* ───────────────────────────────────────────────────────────────
       THERMODYNAMIC HELPER FUNCTIONS
       ─────────────────────────────────────────────────────────────── */

    /**
     * Saturation vapour pressure (hPa) using Tetens formula.
     * Reference: Tetens (1930), also Bolton (1980) Eq. 10.
     */
    function es(T_celsius) {
        return 6.112 * Math.exp(17.67 * T_celsius / (T_celsius + 243.5));
    }

    /**
     * Saturation mixing ratio (kg/kg) given T (°C) and P (hPa).
     */
    function ws(T_celsius, P_hpa) {
        const e = es(T_celsius);
        return 0.622 * e / (P_hpa - e);
    }

    /**
     * Temperature (°C) on a dry adiabat of potential temperature θ (K)
     * at pressure P (hPa).
     * Poisson's equation: T = θ · (P/P₀)^κ
     */
    function dryAdiabatT(theta, P_hpa) {
        return theta * Math.pow(P_hpa / P0, K) - 273.15;
    }

    /**
     * Step along a moist (pseudo) adiabat from (T, P) down by dP.
     * Uses Bolton (1980) formulation for the moist adiabatic lapse rate:
     *
     *   dT/dP = (1/P) · (Rd·T + Lv·ws) / (cp + Lv²·ws / (Rv·T²))
     *
     * where T is in Kelvin. We integrate with small pressure steps.
     */
    function moistLapseStep(T_K, P_hpa, dP) {
        const T_C = T_K - 273.15;
        const w   = ws(T_C, P_hpa);
        const num = (Rd * T_K / P_hpa) + (Lv * w / P_hpa);
        const den = cp + (Lv * Lv * w * 0.622) / (Rd * T_K * T_K);
        return T_K + num / den * dP;
    }

    /* ───────────────────────────────────────────────────────────────
       SVG HELPER
       ─────────────────────────────────────────────────────────────── */
    const SVG_NS = 'http://www.w3.org/2000/svg';

    function svgEl(tag, attrs = {}) {
        const el = document.createElementNS(SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs)) {
            el.setAttribute(k, v);
        }
        return el;
    }

    function polylinePoints(points) {
        return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    }

    /* ═══════════════════════════════════════════════════════════════
       MAIN RENDER FUNCTION
       ═══════════════════════════════════════════════════════════════ */
    function renderSkewT(container, sounding) {
        container.innerHTML = '';

        const levels = sounding.levelData || [];
        const hasData = levels.length > 0;

        // ── Create outer SVG ─────────────────────────────────────
        const svg = svgEl('svg', {
            viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
            class: 'skewt-svg',
            preserveAspectRatio: 'xMidYMid meet'
        });
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.maxWidth = `${WIDTH}px`;
        svg.style.display = 'block';

        // ── Defs: clip path for the plot area ────────────────────
        const defs = svgEl('defs');
        const clipPath = svgEl('clipPath', { id: 'skewt-clip-' + sounding.stationNum });
        clipPath.appendChild(svgEl('rect', { x: 0, y: 0, width: PLOT_W, height: PLOT_H }));
        defs.appendChild(clipPath);
        svg.appendChild(defs);

        // ── Main plot group (translated by margins) ──────────────
        const g = svgEl('g', { transform: `translate(${MARGIN.left},${MARGIN.top})` });
        svg.appendChild(g);

        // Clipped group for traces / gridlines inside plot area
        const clipG = svgEl('g', { 'clip-path': `url(#skewt-clip-${sounding.stationNum})` });
        g.appendChild(clipG);

        // ── Background rect ──────────────────────────────────────
        clipG.appendChild(svgEl('rect', {
            x: 0, y: 0, width: PLOT_W, height: PLOT_H,
            fill: 'rgba(10, 18, 36, 0.85)', rx: 0
        }));

        // ── Draw grid lines ──────────────────────────────────────
        drawIsobars(clipG, g);
        drawIsotherms(clipG);
        drawDryAdiabats(clipG);
        drawMoistAdiabats(clipG);
        drawMixingRatioLines(clipG);

        // ── Draw data traces ─────────────────────────────────────
        if (hasData) {
            drawTrace(clipG, levels, 'temperature', '#ef4444', 2.5);
            drawTrace(clipG, levels, 'dewpoint',    '#22c55e', 2.5);
            drawWindBarbs(g, levels);
        }

        // ── Plot border ──────────────────────────────────────────
        g.appendChild(svgEl('rect', {
            x: 0, y: 0, width: PLOT_W, height: PLOT_H,
            fill: 'none', stroke: 'rgba(255,255,255,0.3)', 'stroke-width': 1
        }));

        // ── Title / source label ─────────────────────────────────
        const titleText = svgEl('text', {
            x: PLOT_W / 2, y: -15,
            'text-anchor': 'middle', fill: '#f8fafc',
            'font-size': '14', 'font-weight': '700', 'font-family': 'Inter, sans-serif'
        });
        titleText.textContent = `${sounding.stationName} — ${sounding.date} ${sounding.time}Z`;
        g.appendChild(titleText);

        const sourceText = svgEl('text', {
            x: PLOT_W / 2, y: -2,
            'text-anchor': 'middle', fill: '#94a3b8',
            'font-size': '10', 'font-family': 'Inter, sans-serif'
        });
        sourceText.textContent = `WMO ${sounding.stationNum} • Univ. of Wyoming Sounding`;
        g.appendChild(sourceText);

        // ── Legend ────────────────────────────────────────────────
        drawLegend(g);

        // ── Incomplete sounding notice ───────────────────────────
        if (hasData) {
            const tempLevels = levels.filter(l => l.temperature !== null);
            if (tempLevels.length < 10) {
                const note = svgEl('text', {
                    x: PLOT_W / 2, y: PLOT_H + 30,
                    'text-anchor': 'middle', fill: '#fbbf24',
                    'font-size': '11', 'font-style': 'italic', 'font-family': 'Inter, sans-serif'
                });
                note.textContent = `⚠ Incomplete sounding — ${tempLevels.length} levels with temperature data`;
                g.appendChild(note);
            }
        } else {
            const note = svgEl('text', {
                x: PLOT_W / 2, y: PLOT_H / 2,
                'text-anchor': 'middle', fill: '#f87171',
                'font-size': '14', 'font-weight': '600', 'font-family': 'Inter, sans-serif'
            });
            note.textContent = 'No level data available for this sounding';
            g.appendChild(note);
        }

        container.appendChild(svg);
    }

    /* ───────────────────────────────────────────────────────────────
       GRID: ISOBARS
       ─────────────────────────────────────────────────────────────── */
    function drawIsobars(clipG, labelG) {
        STD_ISOBARS.forEach(p => {
            const y = yFromP(p);
            clipG.appendChild(svgEl('line', {
                x1: 0, y1: y, x2: PLOT_W, y2: y,
                stroke: 'rgba(255,255,255,0.18)', 'stroke-width': 0.8
            }));
            // Label outside clip, in the label group
            const label = svgEl('text', {
                x: -8, y: y + 4,
                'text-anchor': 'end', fill: '#94a3b8',
                'font-size': '10', 'font-family': 'Inter, sans-serif'
            });
            label.textContent = p;
            labelG.appendChild(label);
        });
    }

    /* ───────────────────────────────────────────────────────────────
       GRID: ISOTHERMS (skewed straight lines, every 10°C)
       ─────────────────────────────────────────────────────────────── */
    function drawIsotherms(clipG) {
        for (let t = -80; t <= 60; t += 10) {
            const x1 = xFromT(t, P_BOTTOM);
            const y1 = yFromP(P_BOTTOM);
            const x2 = xFromT(t, P_TOP);
            const y2 = yFromP(P_TOP);
            clipG.appendChild(svgEl('line', {
                x1, y1, x2, y2,
                stroke: t === 0 ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.08)',
                'stroke-width': t === 0 ? 1.2 : 0.6
            }));
            // Label at bottom
            if (t >= T_MIN && t <= T_MAX) {
                const label = svgEl('text', {
                    x: x1, y: yFromP(P_BOTTOM) + 14,
                    'text-anchor': 'middle', fill: '#64748b',
                    'font-size': '9', 'font-family': 'Inter, sans-serif'
                });
                label.textContent = `${t}°`;
                clipG.appendChild(label);
            }
        }
    }

    /* ───────────────────────────────────────────────────────────────
       GRID: DRY ADIABATS
       Curves of constant potential temperature.
       θ = T·(P₀/P)^κ  →  T = θ·(P/P₀)^κ - 273.15
       ─────────────────────────────────────────────────────────────── */
    function drawDryAdiabats(clipG) {
        // Draw for θ from 220K to 460K in steps of 20K
        for (let theta = 220; theta <= 460; theta += 20) {
            const pts = [];
            for (let p = P_BOTTOM; p >= P_TOP; p -= 5) {
                const t = dryAdiabatT(theta, p);
                pts.push([xFromT(t, p), yFromP(p)]);
            }
            clipG.appendChild(svgEl('polyline', {
                points: polylinePoints(pts),
                fill: 'none',
                stroke: 'rgba(239, 68, 68, 0.12)',
                'stroke-width': 0.6
            }));
        }
    }

    /* ───────────────────────────────────────────────────────────────
       GRID: MOIST (SATURATED) ADIABATS
       Bolton (1980) pseudo-adiabatic lapse rate integration.
       ─────────────────────────────────────────────────────────────── */
    function drawMoistAdiabats(clipG) {
        // Starting temperatures at 1050 hPa
        const startTemps = [-30, -20, -10, 0, 8, 16, 24, 32, 40];
        const dP = -5; // pressure step (hPa), negative = upward

        startTemps.forEach(tStart => {
            const pts = [];
            let T_K = tStart + 273.15;
            for (let p = P_BOTTOM; p >= P_TOP; p += dP) {
                const t_c = T_K - 273.15;
                pts.push([xFromT(t_c, p), yFromP(p)]);
                T_K = moistLapseStep(T_K, p, dP);
                // Safety: if temperature drops below -100°C stop
                if (T_K < 173) break;
            }
            clipG.appendChild(svgEl('polyline', {
                points: polylinePoints(pts),
                fill: 'none',
                stroke: 'rgba(34, 197, 94, 0.14)',
                'stroke-width': 0.6,
                'stroke-dasharray': '4,3'
            }));
        });
    }

    /* ───────────────────────────────────────────────────────────────
       GRID: SATURATION MIXING RATIO LINES
       Lines of constant ws through T-P space.
       ws = 0.622·es(T)/(P - es(T))  →  solve for T given ws and P.
       ─────────────────────────────────────────────────────────────── */
    function drawMixingRatioLines(clipG) {
        // Mixing ratio values in g/kg
        const wsValues = [0.4, 1, 2, 4, 7, 10, 16, 24, 32];

        wsValues.forEach(wg => {
            const w = wg / 1000; // convert to kg/kg
            const pts = [];
            for (let p = P_BOTTOM; p >= 400; p -= 10) {
                // Invert ws formula to find T:  es = w·P/(0.622 + w)
                const e = w * p / (0.622 + w);
                if (e <= 0) continue;
                // Invert Tetens: T = 243.5 · ln(e/6.112) / (17.67 - ln(e/6.112))
                const lnRatio = Math.log(e / 6.112);
                const t = 243.5 * lnRatio / (17.67 - lnRatio);
                if (t < -80 || t > 60) continue;
                pts.push([xFromT(t, p), yFromP(p)]);
            }
            if (pts.length > 1) {
                clipG.appendChild(svgEl('polyline', {
                    points: polylinePoints(pts),
                    fill: 'none',
                    stroke: 'rgba(139, 92, 246, 0.12)',
                    'stroke-width': 0.5,
                    'stroke-dasharray': '2,4'
                }));
            }
        });
    }

    /* ───────────────────────────────────────────────────────────────
       DATA TRACE (temperature or dewpoint)
       ─────────────────────────────────────────────────────────────── */
    function drawTrace(clipG, levels, field, color, width) {
        // Collect valid points, sorted by descending pressure
        const pts = [];
        for (const lv of levels) {
            if (lv.pressure === null || lv[field] === null) continue;
            if (lv.pressure < P_TOP || lv.pressure > P_BOTTOM) continue;
            pts.push([xFromT(lv[field], lv.pressure), yFromP(lv.pressure)]);
        }
        if (pts.length < 2) return;

        clipG.appendChild(svgEl('polyline', {
            points: polylinePoints(pts),
            fill: 'none',
            stroke: color,
            'stroke-width': width,
            'stroke-linejoin': 'round',
            'stroke-linecap': 'round'
        }));
    }

    /* ───────────────────────────────────────────────────────────────
       LEGEND
       ─────────────────────────────────────────────────────────────── */
    function drawLegend(g) {
        const items = [
            { color: '#ef4444', label: 'Temperature', dash: '' },
            { color: '#22c55e', label: 'Dewpoint',    dash: '' },
            { color: 'rgba(239,68,68,0.35)', label: 'Dry Adiabat', dash: '' },
            { color: 'rgba(34,197,94,0.4)',  label: 'Moist Adiabat', dash: '4,3' },
            { color: 'rgba(139,92,246,0.35)', label: 'Mixing Ratio', dash: '2,4' }
        ];
        const startX = 5;
        const startY = PLOT_H + 22;

        items.forEach((item, i) => {
            const xOff = startX + i * 130;
            g.appendChild(svgEl('line', {
                x1: xOff, y1: startY, x2: xOff + 20, y2: startY,
                stroke: item.color, 'stroke-width': 2,
                'stroke-dasharray': item.dash || 'none'
            }));
            const t = svgEl('text', {
                x: xOff + 25, y: startY + 3.5,
                fill: '#94a3b8', 'font-size': '9', 'font-family': 'Inter, sans-serif'
            });
            t.textContent = item.label;
            g.appendChild(t);
        });
    }

    /* ───────────────────────────────────────────────────────────────
       WIND BARBS — WMO standard notation
       Pennant = 50 kt, full barb = 10 kt, half barb = 5 kt.
       Drawn along the right margin at each level's pressure.
       ─────────────────────────────────────────────────────────────── */
    function drawWindBarbs(parentG, levels) {
        const barbX = PLOT_W + 25; // right margin position
        const barbLen = 22;
        const barbSpacing = 5;

        // Thin out barbs so they don't overlap — skip levels too close in y
        let lastY = -Infinity;
        const minGap = 12;

        for (const lv of levels) {
            if (lv.pressure === null || lv.windSpeed === null || lv.windDirection === null) continue;
            if (lv.pressure < P_TOP || lv.pressure > P_BOTTOM) continue;

            const y = yFromP(lv.pressure);
            if (Math.abs(y - lastY) < minGap) continue;
            lastY = y;

            const dirRad = (lv.windDirection * Math.PI) / 180;
            const speed  = lv.windSpeed; // knots

            const barbG = svgEl('g', {
                transform: `translate(${MARGIN.left + barbX}, ${MARGIN.top + y}) rotate(${lv.windDirection + 180})`
            });

            // Staff line (points INTO the wind, barbs on the right side)
            barbG.appendChild(svgEl('line', {
                x1: 0, y1: 0, x2: 0, y2: -barbLen,
                stroke: '#cbd5e1', 'stroke-width': 1.2
            }));

            if (speed < 2.5) {
                // Calm — draw a circle
                barbG.appendChild(svgEl('circle', {
                    cx: 0, cy: 0, r: 4,
                    fill: 'none', stroke: '#cbd5e1', 'stroke-width': 1
                }));
            } else {
                let remaining = speed;
                let offset = 0;

                // Pennants (50 kt triangles)
                while (remaining >= 47.5) {
                    const py = -barbLen + offset;
                    barbG.appendChild(svgEl('polygon', {
                        points: `0,${py} 8,${py + barbSpacing / 2} 0,${py + barbSpacing}`,
                        fill: '#cbd5e1', stroke: 'none'
                    }));
                    remaining -= 50;
                    offset += barbSpacing;
                }
                // Full barbs (10 kt)
                while (remaining >= 7.5) {
                    const py = -barbLen + offset;
                    barbG.appendChild(svgEl('line', {
                        x1: 0, y1: py, x2: 8, y2: py - 2,
                        stroke: '#cbd5e1', 'stroke-width': 1.2
                    }));
                    remaining -= 10;
                    offset += barbSpacing;
                }
                // Half barb (5 kt)
                if (remaining >= 2.5) {
                    const py = -barbLen + offset;
                    barbG.appendChild(svgEl('line', {
                        x1: 0, y1: py, x2: 5, y2: py - 1.5,
                        stroke: '#cbd5e1', 'stroke-width': 1.2
                    }));
                }
            }

            parentG.appendChild(barbG);
        }
    }

    /* ═══════════════════════════════════════════════════════════════
       HODOGRAPH RENDERER
       Plots u/v wind components on a circular grid.
       u = -speed · sin(dir_rad)
       v = -speed · cos(dir_rad)
       Color-coded by height AGL tiers.
       ═══════════════════════════════════════════════════════════════ */
    function renderHodograph(container, sounding) {
        container.innerHTML = '';

        const levels = sounding.levelData || [];
        const SIZE = 320;
        const CENTER = SIZE / 2;
        const RADIUS = SIZE / 2 - 30;

        const svg = svgEl('svg', {
            viewBox: `0 0 ${SIZE} ${SIZE}`,
            class: 'hodograph-svg',
            preserveAspectRatio: 'xMidYMid meet'
        });
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.maxWidth = `${SIZE}px`;
        svg.style.display = 'block';

        // Background
        svg.appendChild(svgEl('rect', {
            x: 0, y: 0, width: SIZE, height: SIZE,
            fill: 'rgba(10, 18, 36, 0.85)', rx: 8
        }));

        // Title
        const title = svgEl('text', {
            x: CENTER, y: 16,
            'text-anchor': 'middle', fill: '#f8fafc',
            'font-size': '11', 'font-weight': '600', 'font-family': 'Inter, sans-serif'
        });
        title.textContent = 'Hodograph (same wind levels)';
        svg.appendChild(title);

        // Compute wind components for levels that have wind + height data
        const surfaceHeight = levels.length > 0 && levels[0].height !== null ? levels[0].height : 0;
        const windPts = [];
        for (const lv of levels) {
            if (lv.windSpeed === null || lv.windDirection === null || lv.height === null) continue;
            const dirRad = (lv.windDirection * Math.PI) / 180;
            const u = -lv.windSpeed * Math.sin(dirRad);
            const v = -lv.windSpeed * Math.cos(dirRad);
            const hAgl = lv.height - surfaceHeight;
            windPts.push({ u, v, height: hAgl, pressure: lv.pressure });
        }

        if (windPts.length < 2) {
            const note = svgEl('text', {
                x: CENTER, y: CENTER,
                'text-anchor': 'middle', fill: '#94a3b8',
                'font-size': '11', 'font-family': 'Inter, sans-serif'
            });
            note.textContent = 'Insufficient wind data';
            svg.appendChild(note);
            container.appendChild(svg);
            return;
        }

        // Determine max wind for scaling
        let maxWind = 0;
        windPts.forEach(w => {
            maxWind = Math.max(maxWind, Math.abs(w.u), Math.abs(w.v));
        });
        maxWind = Math.max(maxWind, 10); // minimum 10 kt scale
        // Round up to nice ring value
        const ringStep = maxWind <= 20 ? 10 : maxWind <= 60 ? 20 : maxWind <= 120 ? 40 : 50;
        const maxRing  = Math.ceil(maxWind / ringStep) * ringStep;
        const scale = RADIUS / maxRing;

        // Draw concentric rings
        for (let r = ringStep; r <= maxRing; r += ringStep) {
            const px = r * scale;
            svg.appendChild(svgEl('circle', {
                cx: CENTER, cy: CENTER, r: px,
                fill: 'none', stroke: 'rgba(255,255,255,0.1)', 'stroke-width': 0.6
            }));
            const lbl = svgEl('text', {
                x: CENTER + px + 2, y: CENTER - 3,
                fill: '#64748b', 'font-size': '8', 'font-family': 'Inter, sans-serif'
            });
            lbl.textContent = `${r}`;
            svg.appendChild(lbl);
        }

        // Cross-hairs
        svg.appendChild(svgEl('line', {
            x1: CENTER - RADIUS, y1: CENTER, x2: CENTER + RADIUS, y2: CENTER,
            stroke: 'rgba(255,255,255,0.12)', 'stroke-width': 0.6
        }));
        svg.appendChild(svgEl('line', {
            x1: CENTER, y1: CENTER - RADIUS, x2: CENTER, y2: CENTER + RADIUS,
            stroke: 'rgba(255,255,255,0.12)', 'stroke-width': 0.6
        }));

        // Height tier colors
        const tiers = [
            { max: 3000,   color: '#ef4444', label: '0–3 km' },
            { max: 6000,   color: '#f59e0b', label: '3–6 km' },
            { max: 9000,   color: '#22c55e', label: '6–9 km' },
            { max: Infinity, color: '#3b82f6', label: '>9 km' }
        ];

        function tierColor(h) {
            for (const t of tiers) {
                if (h < t.max) return t.color;
            }
            return tiers[tiers.length - 1].color;
        }

        // Draw hodograph curve segments
        for (let i = 1; i < windPts.length; i++) {
            const prev = windPts[i - 1];
            const curr = windPts[i];
            const col  = tierColor(curr.height);
            svg.appendChild(svgEl('line', {
                x1: CENTER + prev.u * scale, y1: CENTER - prev.v * scale,
                x2: CENTER + curr.u * scale, y2: CENTER - curr.v * scale,
                stroke: col, 'stroke-width': 2, 'stroke-linecap': 'round'
            }));
        }

        // Draw dots at each point
        windPts.forEach(w => {
            svg.appendChild(svgEl('circle', {
                cx: CENTER + w.u * scale, cy: CENTER - w.v * scale, r: 2,
                fill: tierColor(w.height)
            }));
        });

        // Legend
        const legY = SIZE - 14;
        tiers.forEach((t, i) => {
            const xOff = 10 + i * 78;
            svg.appendChild(svgEl('rect', {
                x: xOff, y: legY - 6, width: 12, height: 8, rx: 2,
                fill: t.color
            }));
            const lt = svgEl('text', {
                x: xOff + 16, y: legY + 1,
                fill: '#94a3b8', 'font-size': '9', 'font-family': 'Inter, sans-serif'
            });
            lt.textContent = t.label;
            svg.appendChild(lt);
        });

        container.appendChild(svg);
    }

    /* ═══════════════════════════════════════════════════════════════
       VIEW CONTROLLER
       Manages the sounding selector dropdown and rendering.
       ═══════════════════════════════════════════════════════════════ */
    function initSkewTView(appData) {
        const select = document.getElementById('diagramSoundingSelect');
        const skewTContainer  = document.getElementById('skewTContainer');
        const hodoContainer   = document.getElementById('hodographContainer');

        if (!select || !skewTContainer || !hodoContainer) return;

        if (select._skewtDrawHandler) {
            select.removeEventListener('change', select._skewtDrawHandler);
            select._skewtDrawHandler = null;
        }

        select.innerHTML = '';
        if (!appData || appData.length === 0) {
            select.appendChild(new Option('No soundings loaded', ''));
            skewTContainer.innerHTML = '<p class="empty-state">Fetch data first, then open this tab to view the Skew-T diagram.</p>';
            hodoContainer.innerHTML = '';
            return;
        }

        const withProfile = appData
            .map((s, idx) => ({ s, idx }))
            .filter(({ s }) => (s.levelData || []).length > 0 && !s.fetchError);

        if (withProfile.length === 0) {
            select.appendChild(new Option('No profile data in current fetch', ''));
            skewTContainer.innerHTML = '<p class="empty-state">No profile levels were parsed. Check that the backend is running on port 5000, Region matches the station, and the fetch status cards show Success.</p>';
            hodoContainer.innerHTML = '';
            return;
        }

        withProfile.forEach(({ s, idx }) => {
            const opt = document.createElement('option');
            opt.value = String(idx);
            const levelCount = s.levelData.length;
            const tempCount = s.levelData.filter(l => l.temperature !== null).length;
            opt.textContent = `${s.stationName} — ${s.date} ${s.time}Z (${levelCount} levels, ${tempCount} T)`;
            select.appendChild(opt);
        });

        function draw() {
            const idx = parseInt(select.value, 10);
            if (isNaN(idx) || !appData[idx]) return;
            try {
                renderSkewT(skewTContainer, appData[idx]);
                renderHodograph(hodoContainer, appData[idx]);
            } catch (err) {
                console.error('Skew-T render error:', err);
                skewTContainer.innerHTML = `<p class="status-error">Diagram render failed: ${err.message}</p>`;
            }
        }

        select._skewtDrawHandler = draw;
        select.addEventListener('change', draw);
        draw();
    }

    // Public API
    return { initSkewTView, renderSkewT, renderHodograph };
})();

// Expose top-level function for app.js tab wiring
function initSkewTView(appData) {
    SKEWT.initSkewTView(appData);
}
