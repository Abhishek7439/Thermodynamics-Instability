/**
 * skewt.js — Skew-T / Log-P Diagram with Hodograph
 *
 * Pure client-side SVG renderer for atmospheric sounding profiles.
 * Interactive with parcel path, CAPE/CIN shading, and hover tooltip.
 */

const SKEWT = (() => {
    // Physical constants
    const Rd  = 287.05;
    const cp  = 1005.7;
    const K   = Rd / cp;
    const Lv  = 2.501e6;
    const Rv  = 461.5;
    const P0  = 1000;
    const g   = 9.80665;

    const MARGIN = { top: 40, right: 75, bottom: 40, left: 60 };
    const WIDTH  = 800;
    const HEIGHT = 800;
    const PLOT_W = WIDTH  - MARGIN.left - MARGIN.right;
    const PLOT_H = HEIGHT - MARGIN.top  - MARGIN.bottom;

    const P_TOP    = 100;
    const P_BOTTOM = 1050;
    const T_MIN = -40;
    const T_MAX =  50;
    const SKEW = 37;

    const STD_ISOBARS = [1000, 850, 700, 500, 400, 300, 200, 100];

    function yFromP(p) {
        const logTop = Math.log(P_TOP);
        const logBot = Math.log(P_BOTTOM);
        return PLOT_H * (Math.log(p) - logTop) / (logBot - logTop);
    }

    function pFromY(y) {
        const logTop = Math.log(P_TOP);
        const logBot = Math.log(P_BOTTOM);
        return Math.exp((y / PLOT_H) * (logBot - logTop) + logTop);
    }

    function xFromT(t, p) {
        const skewOffset = SKEW * Math.log(P0 / p);
        const tNorm = (t + skewOffset - T_MIN) / (T_MAX - T_MIN + SKEW * Math.log(P0 / P_TOP));
        return tNorm * PLOT_W;
    }

    function es(T_celsius) {
        return 6.112 * Math.exp(17.67 * T_celsius / (T_celsius + 243.5));
    }

    function ws(T_celsius, P_hpa) {
        const e = es(T_celsius);
        return 0.622 * e / (P_hpa - e);
    }

    function dryAdiabatT(theta, P_hpa) {
        return theta * Math.pow(P_hpa / P0, K) - 273.15;
    }

    function moistLapseStep(T_K, P_hpa, dP) {
        const T_C = T_K - 273.15;
        const w   = ws(T_C, P_hpa);
        const num = (Rd * T_K / P_hpa) + (Lv * w / P_hpa);
        const den = cp + (Lv * Lv * w * 0.622) / (Rd * T_K * T_K);
        return T_K + num / den * dP;
    }

    function interpolateEnvT(p, levels) {
        let lower = null, upper = null;
        for (let i = 0; i < levels.length; i++) {
            if (levels[i].pressure === null || levels[i].temperature === null) continue;
            if (levels[i].pressure >= p) {
                if (!lower || levels[i].pressure < lower.pressure) lower = levels[i];
            }
            if (levels[i].pressure <= p) {
                if (!upper || levels[i].pressure > upper.pressure) upper = levels[i];
            }
        }
        if (!lower && !upper) return null;
        if (!lower) return upper.temperature;
        if (!upper) return lower.temperature;
        if (lower.pressure === upper.pressure) return lower.temperature;
        const f = Math.log(lower.pressure / p) / Math.log(lower.pressure / upper.pressure);
        return lower.temperature + f * (upper.temperature - lower.temperature);
    }

    function computeParcel(levels, type) {
        if (!levels || levels.length === 0) return null;
        let p_start, t_start, td_start;

        const validLevels = levels.filter(l => l.pressure !== null && l.temperature !== null && l.dewpoint !== null);
        if (validLevels.length === 0) return null;
        validLevels.sort((a, b) => b.pressure - a.pressure);

        if (type === 'SB') {
            p_start = validLevels[0].pressure;
            t_start = validLevels[0].temperature;
            td_start = validLevels[0].dewpoint;
        } else if (type === 'ML') {
            const sfc_p = validLevels[0].pressure;
            let sum_t = 0, sum_td = 0, count = 0;
            for (const l of validLevels) {
                if (sfc_p - l.pressure <= 100) {
                    sum_t += l.temperature;
                    sum_td += l.dewpoint;
                    count++;
                }
            }
            p_start = sfc_p;
            t_start = sum_t / count;
            td_start = sum_td / count;
        } else if (type === 'MU') {
            let max_te = -999;
            const sfc_p = validLevels[0].pressure;
            for (const l of validLevels) {
                if (sfc_p - l.pressure > 300) break;
                const w = ws(l.dewpoint, l.pressure);
                const theta = (l.temperature + 273.15) * Math.pow(P0 / l.pressure, K);
                const theta_e = theta * Math.exp((Lv * w) / (cp * (l.temperature + 273.15)));
                if (theta_e > max_te) {
                    max_te = theta_e;
                    p_start = l.pressure;
                    t_start = l.temperature;
                    td_start = l.dewpoint;
                }
            }
        }

        if (p_start === undefined) return null;

        const w_sfc = ws(td_start, p_start);
        const theta_sfc = (t_start + 273.15) * Math.pow(P0 / p_start, K);

        let T_parcel_K = t_start + 273.15;
        const pts = [];
        let saturated = false;

        const dP = -5;
        for (let p = p_start; p >= P_TOP; p += dP) {
            if (!saturated) {
                const T_dry = dryAdiabatT(theta_sfc, p);
                if (ws(T_dry, p) <= w_sfc) {
                    saturated = true;
                    T_parcel_K = T_dry + 273.15;
                } else {
                    T_parcel_K = T_dry + 273.15;
                }
            } else {
                T_parcel_K = moistLapseStep(T_parcel_K, p, dP);
            }
            
            const env_T = interpolateEnvT(p, validLevels);
            pts.push({ p: p, t: T_parcel_K - 273.15, env_t: env_T });
        }
        return pts;
    }

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

    function renderSkewT(container, sounding, opts) {
        container.innerHTML = '';
        const levels = sounding.levelData || [];
        const hasData = levels.length > 0;

        const svg = svgEl('svg', {
            viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
            class: 'skewt-svg',
            preserveAspectRatio: 'xMidYMid meet'
        });
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.maxWidth = `${WIDTH}px`;
        svg.style.display = 'block';

        const defs = svgEl('defs');
        const clipPath = svgEl('clipPath', { id: 'skewt-clip-' + sounding.stationNum });
        clipPath.appendChild(svgEl('rect', { x: 0, y: 0, width: PLOT_W, height: PLOT_H }));
        defs.appendChild(clipPath);
        svg.appendChild(defs);

        const g = svgEl('g', { transform: `translate(${MARGIN.left},${MARGIN.top})` });
        svg.appendChild(g);

        const clipG = svgEl('g', { 'clip-path': `url(#skewt-clip-${sounding.stationNum})` });
        g.appendChild(clipG);

        clipG.appendChild(svgEl('rect', {
            x: 0, y: 0, width: PLOT_W, height: PLOT_H,
            fill: 'rgba(255, 255, 255, 0.9)', rx: 0
        }));

        drawIsobars(clipG, g);
        drawIsotherms(clipG);
        
        if (opts.showAdiabats) {
            drawDryAdiabats(clipG);
            drawMoistAdiabats(clipG);
        }
        if (opts.showMixing) {
            drawMixingRatioLines(clipG);
        }

        if (hasData) {
            if (opts.showParcel) {
                drawParcelPath(clipG, levels, opts.parcelType);
            }
            drawTrace(clipG, levels, 'temperature', SKEWT_COLORS.tempTrace || '#ef4444', 2.5);
            drawTrace(clipG, levels, 'dewpoint', SKEWT_COLORS.dewTrace || '#22c55e', 2.5);
            if (opts.showBarbs) {
                drawWindBarbs(g, levels);
            }
        }

        g.appendChild(svgEl('rect', {
            x: 0, y: 0, width: PLOT_W, height: PLOT_H,
            fill: 'none', stroke: 'rgba(0,0,0,0.3)', 'stroke-width': 1
        }));

        const titleText = svgEl('text', {
            x: PLOT_W / 2, y: -15,
            'text-anchor': 'middle', fill: '#0f172a',
            'font-size': '14', 'font-weight': '700', 'font-family': 'Inter, sans-serif'
        });
        titleText.textContent = `${sounding.stationName} — ${sounding.date} ${sounding.time}Z`;
        g.appendChild(titleText);

        const sourceText = svgEl('text', {
            x: PLOT_W / 2, y: -2,
            'text-anchor': 'middle', fill: '#475569',
            'font-size': '10', 'font-family': 'Inter, sans-serif'
        });
        sourceText.textContent = `WMO ${sounding.stationNum} • Univ. of Wyoming Sounding`;
        g.appendChild(sourceText);

        drawLegend(g);

        if (!hasData) {
            const note = svgEl('text', {
                x: PLOT_W / 2, y: PLOT_H / 2,
                'text-anchor': 'middle', fill: '#f87171',
                'font-size': '14', 'font-weight': '600', 'font-family': 'Inter, sans-serif'
            });
            note.textContent = 'No level data available for this sounding';
            g.appendChild(note);
        }

        // Interactivity
        if (hasData) {
            addInteractivity(svg, clipG, g, levels);
        }

        container.appendChild(svg);
    }

    function drawIsobars(clipG, labelG) {
        STD_ISOBARS.forEach(p => {
            const y = yFromP(p);
            clipG.appendChild(svgEl('line', {
                x1: 0, y1: y, x2: PLOT_W, y2: y,
                stroke: 'rgba(0,0,0,0.15)', 'stroke-width': 0.8
            }));
            const label = svgEl('text', {
                x: -8, y: y + 4,
                'text-anchor': 'end', fill: '#475569',
                'font-size': '10', 'font-family': 'Inter, sans-serif'
            });
            label.textContent = p;
            labelG.appendChild(label);
        });
    }

    function drawIsotherms(clipG) {
        for (let t = -80; t <= 60; t += 10) {
            const x1 = xFromT(t, P_BOTTOM);
            const y1 = yFromP(P_BOTTOM);
            const x2 = xFromT(t, P_TOP);
            const y2 = yFromP(P_TOP);
            clipG.appendChild(svgEl('line', {
                x1, y1, x2, y2,
                stroke: t === 0 ? 'rgba(37,99,235,0.7)' : 'rgba(0,0,0,0.08)',
                'stroke-width': t === 0 ? 1.2 : 0.6
            }));
            if (t >= T_MIN && t <= T_MAX) {
                const label = svgEl('text', {
                    x: x1, y: yFromP(P_BOTTOM) + 14,
                    'text-anchor': 'middle', fill: '#475569',
                    'font-size': '9', 'font-family': 'Inter, sans-serif'
                });
                label.textContent = `${t}°`;
                clipG.appendChild(label);
            }
        }
    }

    function drawDryAdiabats(clipG) {
        for (let theta = 220; theta <= 460; theta += 20) {
            const pts = [];
            for (let p = P_BOTTOM; p >= P_TOP; p -= 5) {
                const t = dryAdiabatT(theta, p);
                pts.push([xFromT(t, p), yFromP(p)]);
            }
            clipG.appendChild(svgEl('polyline', {
                points: polylinePoints(pts),
                fill: 'none',
                stroke: SKEWT_COLORS.dryAdiabat || 'rgba(239, 68, 68, 0.12)',
                'stroke-width': 0.6
            }));
        }
    }

    function drawMoistAdiabats(clipG) {
        const startTemps = [-30, -20, -10, 0, 8, 16, 24, 32, 40];
        const dP = -5;
        startTemps.forEach(tStart => {
            const pts = [];
            let T_K = tStart + 273.15;
            for (let p = P_BOTTOM; p >= P_TOP; p += dP) {
                const t_c = T_K - 273.15;
                pts.push([xFromT(t_c, p), yFromP(p)]);
                T_K = moistLapseStep(T_K, p, dP);
                if (T_K < 173) break;
            }
            clipG.appendChild(svgEl('polyline', {
                points: polylinePoints(pts),
                fill: 'none',
                stroke: SKEWT_COLORS.moistAdiabat || 'rgba(34, 197, 94, 0.14)',
                'stroke-width': 0.6,
                'stroke-dasharray': '4,3'
            }));
        });
    }

    function drawMixingRatioLines(clipG) {
        const wsValues = [0.4, 1, 2, 4, 7, 10, 16, 24, 32];
        wsValues.forEach(wg => {
            const w = wg / 1000;
            const pts = [];
            for (let p = P_BOTTOM; p >= 400; p -= 10) {
                const e = w * p / (0.622 + w);
                if (e <= 0) continue;
                const lnRatio = Math.log(e / 6.112);
                const t = 243.5 * lnRatio / (17.67 - lnRatio);
                if (t < -80 || t > 60) continue;
                pts.push([xFromT(t, p), yFromP(p)]);
            }
            if (pts.length > 1) {
                clipG.appendChild(svgEl('polyline', {
                    points: polylinePoints(pts),
                    fill: 'none',
                    stroke: SKEWT_COLORS.mixingRatio || 'rgba(139, 92, 246, 0.12)',
                    'stroke-width': 0.5,
                    'stroke-dasharray': '2,4'
                }));
            }
        });
    }

    function drawTrace(clipG, levels, field, color, width) {
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

    function drawParcelPath(clipG, levels, parcelType) {
        const parcelPts = computeParcel(levels, parcelType);
        if (!parcelPts || parcelPts.length === 0) return;

        // Draw CAPE and CIN shading
        const capePts = [];
        const cinPts = [];
        let inCape = false, inCin = false;
        
        for (let i = 0; i < parcelPts.length; i++) {
            const pt = parcelPts[i];
            if (pt.env_t === null) continue;
            const xEnv = xFromT(pt.env_t, pt.p);
            const xPar = xFromT(pt.t, pt.p);
            const yP = yFromP(pt.p);
            
            if (pt.t > pt.env_t) { // CAPE
                capePts.push([xPar, yP, xEnv, yP]);
            } else if (pt.t < pt.env_t) { // CIN
                cinPts.push([xPar, yP, xEnv, yP]);
            }
        }
        
        function renderShading(ptPairs, color) {
            if (ptPairs.length < 2) return;
            const poly = [];
            // Forward path (parcel)
            for (let i = 0; i < ptPairs.length; i++) poly.push(`${ptPairs[i][0]},${ptPairs[i][1]}`);
            // Backward path (environment)
            for (let i = ptPairs.length - 1; i >= 0; i--) poly.push(`${ptPairs[i][2]},${ptPairs[i][3]}`);
            
            clipG.appendChild(svgEl('polygon', {
                points: poly.join(' '),
                fill: color, stroke: 'none'
            }));
        }

        renderShading(capePts, SKEWT_COLORS.cape || 'rgba(245, 158, 11, 0.35)');
        renderShading(cinPts, SKEWT_COLORS.cin || 'rgba(59, 130, 246, 0.35)');

        // Draw parcel line
        const pathCoords = parcelPts.map(pt => [xFromT(pt.t, pt.p), yFromP(pt.p)]);
        clipG.appendChild(svgEl('polyline', {
            points: polylinePoints(pathCoords),
            fill: 'none', stroke: SKEWT_COLORS.parcelPath || '#d946ef',
            'stroke-width': 1.5, 'stroke-dasharray': '5,3'
        }));
    }

    function drawLegend(g) {
        const items = [
            { color: SKEWT_COLORS.tempTrace || '#ef4444', label: 'Temperature', dash: '' },
            { color: SKEWT_COLORS.dewTrace || '#22c55e', label: 'Dewpoint', dash: '' },
            { color: SKEWT_COLORS.parcelPath || '#d946ef', label: 'Parcel Path', dash: '5,3' },
            { color: SKEWT_COLORS.dryAdiabat || 'rgba(239,68,68,0.35)', label: 'Dry Adiabat', dash: '' },
            { color: SKEWT_COLORS.moistAdiabat || 'rgba(34,197,94,0.4)', label: 'Moist Adiabat', dash: '4,3' },
            { color: SKEWT_COLORS.mixingRatio || 'rgba(139,92,246,0.35)', label: 'Mixing Ratio', dash: '2,4' }
        ];
        const startX = 5;
        const startY = PLOT_H + 22;

        items.forEach((item, i) => {
            const xOff = startX + i * 110;
            g.appendChild(svgEl('line', {
                x1: xOff, y1: startY, x2: xOff + 20, y2: startY,
                stroke: item.color, 'stroke-width': 2,
                'stroke-dasharray': item.dash || 'none'
            }));
            const t = svgEl('text', {
                x: xOff + 25, y: startY + 3.5,
                fill: '#475569', 'font-size': '9', 'font-family': 'Inter, sans-serif'
            });
            t.textContent = item.label;
            g.appendChild(t);
        });
    }

    function drawWindBarbs(parentG, levels) {
        const barbX = PLOT_W + 25;
        const barbLen = 22;
        const barbSpacing = 5;

        let lastY = -Infinity;
        const minGap = 12;

        for (const lv of levels) {
            if (lv.pressure === null || lv.windSpeed === null || lv.windDirection === null) continue;
            if (lv.pressure < P_TOP || lv.pressure > P_BOTTOM) continue;

            const y = yFromP(lv.pressure);
            if (Math.abs(y - lastY) < minGap) continue;
            lastY = y;

            const speed  = lv.windSpeed;
            let strokeColor = '#475569';
            if (typeof WIND_BARB_BINS !== 'undefined') {
                const bin = WIND_BARB_BINS.find(b => speed <= b.max);
                if (bin) strokeColor = bin.color;
            }

            const barbG = svgEl('g', {
                transform: `translate(${MARGIN.left + barbX}, ${MARGIN.top + y}) rotate(${lv.windDirection + 180})`
            });

            barbG.appendChild(svgEl('line', {
                x1: 0, y1: 0, x2: 0, y2: -barbLen,
                stroke: strokeColor, 'stroke-width': 1.2
            }));

            if (speed < 2.5) {
                barbG.appendChild(svgEl('circle', {
                    cx: 0, cy: 0, r: 4,
                    fill: 'none', stroke: strokeColor, 'stroke-width': 1
                }));
            } else {
                let remaining = speed;
                let offset = 0;
                while (remaining >= 47.5) {
                    const py = -barbLen + offset;
                    barbG.appendChild(svgEl('polygon', {
                        points: `0,${py} 8,${py + barbSpacing / 2} 0,${py + barbSpacing}`,
                        fill: strokeColor, stroke: 'none'
                    }));
                    remaining -= 50;
                    offset += barbSpacing;
                }
                while (remaining >= 7.5) {
                    const py = -barbLen + offset;
                    barbG.appendChild(svgEl('line', {
                        x1: 0, y1: py, x2: 8, y2: py - 2,
                        stroke: strokeColor, 'stroke-width': 1.2
                    }));
                    remaining -= 10;
                    offset += barbSpacing;
                }
                if (remaining >= 2.5) {
                    const py = -barbLen + offset;
                    barbG.appendChild(svgEl('line', {
                        x1: 0, y1: py, x2: 5, y2: py - 1.5,
                        stroke: strokeColor, 'stroke-width': 1.2
                    }));
                }
            }
            parentG.appendChild(barbG);
        }
    }

    function addInteractivity(svg, clipG, g, levels) {
        // Tooltip container
        let tooltip = document.getElementById('skewt-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'skewt-tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.background = 'rgba(255, 255, 255, 0.95)';
            tooltip.style.border = '1px solid rgba(0,0,0,0.2)';
            tooltip.style.padding = '8px';
            tooltip.style.borderRadius = '6px';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.display = 'none';
            tooltip.style.zIndex = '1000';
            tooltip.style.color = '#0f172a';
            tooltip.style.fontSize = '0.8rem';
            tooltip.style.lineHeight = '1.4';
            document.body.appendChild(tooltip);
        }

        const hoverLine = svgEl('line', {
            x1: 0, x2: PLOT_W,
            stroke: 'rgba(0,0,0,0.3)', 'stroke-width': 1, 'stroke-dasharray': '2,2',
            display: 'none'
        });
        clipG.appendChild(hoverLine);

        const overlay = svgEl('rect', {
            x: 0, y: 0, width: PLOT_W, height: PLOT_H,
            fill: 'transparent', cursor: 'crosshair'
        });
        clipG.appendChild(overlay);

        overlay.addEventListener('mousemove', (e) => {
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(clipG.getScreenCTM().inverse());
            
            const pCursor = pFromY(svgP.y);
            
            // Find closest level
            let closest = null;
            let minDist = Infinity;
            for (const l of levels) {
                if (l.pressure === null) continue;
                const d = Math.abs(l.pressure - pCursor);
                if (d < minDist) {
                    minDist = d;
                    closest = l;
                }
            }

            if (closest) {
                const yC = yFromP(closest.pressure);
                hoverLine.setAttribute('y1', yC);
                hoverLine.setAttribute('y2', yC);
                hoverLine.setAttribute('display', 'block');

                const tStr = closest.temperature !== null ? closest.temperature.toFixed(1) + '°C' : '--';
                const tdStr = closest.dewpoint !== null ? closest.dewpoint.toFixed(1) + '°C' : '--';
                const spdStr = closest.windSpeed !== null ? closest.windSpeed + ' kt' : '--';
                const dirStr = closest.windDirection !== null ? closest.windDirection + '°' : '--';
                
                let rhStr = '--';
                if (closest.temperature !== null && closest.dewpoint !== null) {
                    const eActual = es(closest.dewpoint);
                    const eSat = es(closest.temperature);
                    const rh = Math.max(0, Math.min(100, (eActual / eSat) * 100));
                    rhStr = Math.round(rh) + '%';
                }

                tooltip.innerHTML = `
                    <div style="font-weight: 700; border-bottom: 1px solid rgba(0,0,0,0.2); margin-bottom: 4px; padding-bottom: 2px;">
                        ${closest.pressure.toFixed(1)} hPa
                    </div>
                    <div><span style="color:#ef4444">T:</span> ${tStr}</div>
                    <div><span style="color:#22c55e">Td:</span> ${tdStr}</div>
                    <div>RH: ${rhStr}</div>
                    <div>Wind: ${dirStr} @ ${spdStr}</div>
                `;
                tooltip.style.left = (e.pageX + 15) + 'px';
                tooltip.style.top = (e.pageY - 20) + 'px';
                tooltip.style.display = 'block';
            }
        });

        overlay.addEventListener('mouseleave', () => {
            hoverLine.setAttribute('display', 'none');
            tooltip.style.display = 'none';
        });
    }

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

        svg.appendChild(svgEl('rect', {
            x: 0, y: 0, width: SIZE, height: SIZE,
            fill: 'rgba(255, 255, 255, 0.9)', rx: 8
        }));

        const title = svgEl('text', {
            x: CENTER, y: 16,
            'text-anchor': 'middle', fill: '#0f172a',
            'font-size': '11', 'font-weight': '600', 'font-family': 'Inter, sans-serif'
        });
        title.textContent = 'Hodograph (same wind levels)';
        svg.appendChild(title);

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
                'text-anchor': 'middle', fill: '#475569',
                'font-size': '11', 'font-family': 'Inter, sans-serif'
            });
            note.textContent = 'Insufficient wind data';
            svg.appendChild(note);
            container.appendChild(svg);
            return;
        }

        let maxWind = 0;
        windPts.forEach(w => {
            maxWind = Math.max(maxWind, Math.abs(w.u), Math.abs(w.v));
        });
        maxWind = Math.max(maxWind, 10);
        const ringStep = maxWind <= 20 ? 10 : maxWind <= 60 ? 20 : maxWind <= 120 ? 40 : 50;
        const maxRing  = Math.ceil(maxWind / ringStep) * ringStep;
        const scale = RADIUS / maxRing;

        for (let r = ringStep; r <= maxRing; r += ringStep) {
            const px = r * scale;
            svg.appendChild(svgEl('circle', {
                cx: CENTER, cy: CENTER, r: px,
                fill: 'none', stroke: 'rgba(0,0,0,0.1)', 'stroke-width': 0.6
            }));
            const lbl = svgEl('text', {
                x: CENTER + px + 2, y: CENTER - 3,
                fill: '#475569', 'font-size': '8', 'font-family': 'Inter, sans-serif'
            });
            lbl.textContent = `${r}`;
            svg.appendChild(lbl);
        }

        svg.appendChild(svgEl('line', {
            x1: CENTER - RADIUS, y1: CENTER, x2: CENTER + RADIUS, y2: CENTER,
            stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 0.6
        }));
        svg.appendChild(svgEl('line', {
            x1: CENTER, y1: CENTER - RADIUS, x2: CENTER, y2: CENTER + RADIUS,
            stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 0.6
        }));

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

        windPts.forEach(w => {
            svg.appendChild(svgEl('circle', {
                cx: CENTER + w.u * scale, cy: CENTER - w.v * scale, r: 2,
                fill: tierColor(w.height)
            }));
        });

        const legY = SIZE - 14;
        tiers.forEach((t, i) => {
            const xOff = 10 + i * 78;
            svg.appendChild(svgEl('rect', {
                x: xOff, y: legY - 6, width: 12, height: 8, rx: 2,
                fill: t.color
            }));
            const lt = svgEl('text', {
                x: xOff + 16, y: legY + 1,
                fill: '#475569', 'font-size': '9', 'font-family': 'Inter, sans-serif'
            });
            lt.textContent = t.label;
            svg.appendChild(lt);
        });

        container.appendChild(svg);
    }

    function initSkewTView(appData) {
        const select = document.getElementById('diagramSoundingSelect');
        const skewTContainer  = document.getElementById('skewTContainer');
        const hodoContainer   = document.getElementById('hodographContainer');

        const toggleAdiabats = document.getElementById('toggleAdiabats');
        const toggleMixing = document.getElementById('toggleMixing');
        const toggleParcel = document.getElementById('toggleParcel');
        const toggleBarbs = document.getElementById('toggleBarbs');
        const parcelTypeSelect = document.getElementById('parcelTypeSelect');

        if (!select || !skewTContainer || !hodoContainer) return;

        if (select._skewtDrawHandler) {
            select.removeEventListener('change', select._skewtDrawHandler);
            if (toggleAdiabats) toggleAdiabats.removeEventListener('change', select._skewtDrawHandler);
            if (toggleMixing) toggleMixing.removeEventListener('change', select._skewtDrawHandler);
            if (toggleParcel) toggleParcel.removeEventListener('change', select._skewtDrawHandler);
            if (toggleBarbs) toggleBarbs.removeEventListener('change', select._skewtDrawHandler);
            if (parcelTypeSelect) parcelTypeSelect.removeEventListener('change', select._skewtDrawHandler);
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
            const opts = {
                showAdiabats: toggleAdiabats ? toggleAdiabats.checked : true,
                showMixing: toggleMixing ? toggleMixing.checked : true,
                showParcel: toggleParcel ? toggleParcel.checked : true,
                showBarbs: toggleBarbs ? toggleBarbs.checked : true,
                parcelType: parcelTypeSelect ? parcelTypeSelect.value : 'ML'
            };
            try {
                renderSkewT(skewTContainer, appData[idx], opts);
                renderHodograph(hodoContainer, appData[idx]);
            } catch (err) {
                console.error('Skew-T render error:', err);
                skewTContainer.innerHTML = `<p class="status-error">Diagram render failed: ${err.message}</p>`;
            }
        }

        select._skewtDrawHandler = draw;
        select.addEventListener('change', draw);
        if (toggleAdiabats) toggleAdiabats.addEventListener('change', draw);
        if (toggleMixing) toggleMixing.addEventListener('change', draw);
        if (toggleParcel) toggleParcel.addEventListener('change', draw);
        if (toggleBarbs) toggleBarbs.addEventListener('change', draw);
        if (parcelTypeSelect) parcelTypeSelect.addEventListener('change', draw);
        draw();
    }

    return { initSkewTView, renderSkewT, renderHodograph };
})();

function initSkewTView(appData) {
    SKEWT.initSkewTView(appData);
}
