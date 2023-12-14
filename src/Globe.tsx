import {
  geoPath,
  geoOrthographic,
  geoGraticule10,
  select,
  drag,
  zoom,
  geoCircle,
  geoCentroid,
  geoLength,
  interpolate,
  transition,
} from 'd3';
import { land, land110m } from './App';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { rotateProjectionTo } from './transformations';
import * as solar from 'solar-calculator';
import { debounce } from '@mui/material';

const tau = 2 * Math.PI;
function blurredCircular(context, operation, radius, step = 0.18) {
  radius /= 2;
  const alpha = context.globalAlpha;
  context.globalAlpha = alpha * step * 1.4;
  for (let a = 0; a < 1; a += step) {
    const x = radius * Math.cos(a * tau),
      y = radius * Math.sin(a * tau);
    context.translate(x, y);
    operation();
    context.translate(-x, -y);
  }
  context.globalAlpha = alpha;
}

type ThemeItem = { value: string; label: string };
interface Theme {
  countryOutline: ThemeItem;
  countryFill: ThemeItem;
  countryOutlineSelected: ThemeItem;
  countryFillSelected: ThemeItem;
  oceanFill: ThemeItem;
  graticule: ThemeItem;
  smallCountryCircle: ThemeItem;
  bgHaze1: ThemeItem;
  bgHaze2: ThemeItem;
  bg: ThemeItem;
  nightShade: ThemeItem;
}

const theme: Theme = {
  countryOutline: { value: 'rgba(0, 0, 0, 0.4)', label: 'Country Outline' },
  countryFill: { value: '#aaccb5', label: 'Country Fill' },
  countryOutlineSelected: {
    value: 'rgba(0, 0, 0, 0.4)',
    label: 'Country Outline',
  },
  countryFillSelected: { value: '#ffd570', label: 'Country Fill' },
  oceanFill: { value: '#e0f2ff', label: 'Oceans' },
  graticule: { value: 'rgba(0, 0, 0, 0.1)', label: 'Graticule' },
  smallCountryCircle: {
    value: 'rgba(255, 0, 0, 0.8)',
    label: 'Small country circle',
  },
  bgHaze1: { value: '#0eb7e1', label: 'BG Haze 1' },
  bgHaze2: { value: '#045181', label: 'BG Haze 2' },
  bg: { value: 'white', label: 'BG Color' },
  nightShade: { value: 'rgba(0, 0, 0, 0.15', label: 'Night shade' },
};

// const theme: Theme = {
//   countryOutline: { value: '#d61f1f', label: 'Country Outline' },
//   countryFill: { value: '#800a21', label: 'Country Fill' },
//   countryOutlineSelected: {
//     value: 'rgba(0, 0, 0, 0.4)',
//     label: 'Country Outline',
//   },
//   countryFillSelected: { value: '#ffd570', label: 'Country Fill' },
//   smallCountryCircle: {
//     value: 'rgba(255, 0, 0, 0.8)',
//     label: 'Small country circle',
//   },
//   oceanFill: { value: '#060623', label: 'Oceans' },
//   graticule: { value: '#152123', label: 'Graticule' },
//   bgHaze1: { value: '#0eb7e1', label: 'BG Haze 1' },
//   bgHaze2: { value: '#045181', label: 'BG Haze 2' },
//   bg: { value: '#000', label: 'BG Color' },
//   nightShade: { value: 'rgba(0, 0, 0, 0.2', label: 'Night shade' },
// };

interface Settings {
  renderer: 'canvas' | 'svg';
}

const settings: Settings = {
  renderer: 'canvas',
};

export function Globe({ size, country, initialRotation, rotation }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);

  const { width, height } = size;
  const cx = width / 2;
  const cy = height / 2;

  const initialScale = Math.max(Math.min(size.width, size.height) / 2 - 10, 1);
  const maxScroll = 20;
  const minScroll = 0.3;
  const sensitivity = 75;
  const data = land;

  const projection = useMemo(
    () =>
      geoOrthographic()
        .scale(initialScale)
        .center([0, 0])
        .rotate(initialRotation)
        .translate([width / 2, height / 2]),
    [width, height],
  );
  const path = geoPath().projection(projection);
  const smallCountryCircle = geoCircle();
  const globe = { type: 'Sphere' };

  // TODO or area
  const countrySize = geoLength(country);
  const newRotation = geoCentroid(country);
  smallCountryCircle.center(newRotation).radius(1);

  const graticule = geoGraticule10();

  const antipode = ([longitude, latitude]) => [longitude + 180, -latitude];
  const night = geoCircle().radius(90).center(antipode(sun()));

  function sun() {
    const now = new Date();
    const day = new Date(+now).setUTCHours(0, 0, 0, 0);
    const t = solar.century(now);
    const longitude = ((day - now) / 864e5) * 360 - 180;
    return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
  }

  function drawCanvas(animating = false) {
    const c = context.current;
    if (!c) return;
    if (animating) {
      const hasDrawn = draw();
      if (hasDrawn) return;
    }

    const path = geoPath().projection(projection).context(c);
    c.fillStyle = theme.bg.value;
    c.fillRect(0, 0, width, height);

    haze(0.5, 0, width * 1.5);

    // Draw the oceans
    c.beginPath();
    c.fillStyle = theme.oceanFill.value;
    path(globe);
    c.fill();

    c.beginPath();
    path(graticule);
    c.strokeStyle = theme.graticule.value;
    c.stroke();

    c.beginPath();
    c.strokeStyle = theme.countryOutline.value;
    c.fillStyle = theme.countryFill.value;
    path(animating ? land110m : data);
    c.fill();
    c.stroke();

    c.beginPath();
    c.strokeStyle = theme.countryOutlineSelected.value;
    c.fillStyle = theme.countryFillSelected.value;
    path(
      (animating ? land110m : data).features.find(
        ({ id }) => id === country.id,
      ),
    );
    c.fill();
    c.stroke();

    if (0.02 > countrySize) {
      c.beginPath();
      c.strokeStyle = theme.smallCountryCircle.value;
      path(smallCountryCircle());
      c.stroke();
    }

    c.save();
    c.clip(path(globe));
    blurredCircular(
      c,
      () => {
        c.beginPath();
        c.fillStyle = theme.nightShade.value;
        path(night());
        c.fill();
      },
      10,
    );
    c.restore();

    // haze(0.3, 0, width);
  }

  const inset = 10;
  function haze(alpha = 0.5, r1 = 0, r2 = height / 2 - inset) {
    const c = context.current;
    if (!c) return;
    c.save();
    var grd = c.createRadialGradient(
      width / 3,
      height / 3,
      r1,
      height / 2,
      height / 2,
      r2,
    );
    grd.addColorStop(0.0, theme.bgHaze1.value);
    grd.addColorStop(0.35, theme.bgHaze2.value);
    grd.addColorStop(1, theme.bg.value);
    // Fill with gradient
    c.globalAlpha = alpha;
    c.fillStyle = grd;
    c.beginPath();
    c.arc(width / 2, height / 2, r2, 0, 2 * Math.PI, false);
    c.fill();
    c.restore();
  }

  useEffect(() => {
    if (settings.renderer === 'svg') return;

    if (width && height) {
      const dpr = window.devicePixelRatio ?? 1;
      if (document.querySelector('canvas')) {
        select('canvas')
          .attr('width', width * dpr)
          .attr('height', height * dpr);
      } else {
        const canvas = select(rootRef.current)
          .append('canvas')
          .style('display', 'block')
          .attr('width', width * dpr)
          .attr('height', height * dpr);
        context.current = canvas.node()?.getContext('2d') ?? null;
      }

      if (context.current !== null) {
        context.current.scale(dpr, dpr);
      }
    }
    drawCanvas(true);
  }, [width]);

  const draw = debounce(() => {
    drawCanvas();
    return true;
  }, 50);

  useEffect(() => {
    if (!data.features.length) return;

    // Selectors
    const root = select(
      settings.renderer === 'svg' ? svgRef.current : rootRef.current,
    );
    const globeCircle = root.selectAll('circle');
    const countryPaths = root.selectAll('.country-path');
    const graticulePath = root.select('.graticule');
    const smallCountryCirclePath = root.select('.small-country-circle');
    const nightShadePath = root.select('.night-shade');

    // Drag
    const dragBehaviour = drag().on('drag', (event) => {
      const rotate = projection.rotate();
      const k = sensitivity / projection.scale();

      projection.rotate([rotate[0] + event.dx * k, rotate[1] - event.dy * k]);
      // Update projection
      if (settings.renderer === 'svg') {
        path.projection(projection);
        countryPaths.attr('d', path);
        graticulePath.attr('d', path);
        smallCountryCirclePath.attr('d', path);
        nightShadePath.attr('d', path);
      } else {
        // TODO Maybe pass projection?
        drawCanvas(true);
      }
    });

    // Zoom
    const zoomBehaviour = zoom().on('zoom', (event) => {
      const scrollValue = event.transform.k;

      // Reached max/min zoom
      if (scrollValue >= maxScroll) event.transform.k = maxScroll;
      if (scrollValue <= minScroll) event.transform.k = minScroll;
      else {
        // Update projection
        projection.scale(initialScale * event.transform.k);

        // Update path generator with new projection
        path.projection(projection);

        // Update selectors
        if (settings.renderer === 'svg') {
          countryPaths.attr('d', path);
          globeCircle.attr('r', projection.scale());
          graticulePath.attr('d', path);
          smallCountryCirclePath.attr('d', path);
          nightShadePath.attr('d', path);
        } else {
          drawCanvas(true);
        }
      }
    });

    // Apply scroll and drag behaviour
    root.call(dragBehaviour).call(zoomBehaviour);

    // Update country paths

    if (settings.renderer === 'svg') {
      countryPaths.data(data.features).join('path').attr('d', path);
      globeCircle.attr('r', projection.scale());
      graticulePath.data([graticule]).attr('d', path);
      smallCountryCirclePath.data([smallCountryCircle()]).attr('d', path);
      nightShadePath.data([night()]).attr('d', path);
    } else {
      drawCanvas();
    }
  }, [
    width,
    data,
    path,
    projection,
    initialScale,
    minScroll,
    maxScroll,
    sensitivity,
    graticule,
    smallCountryCircle,
  ]);

  useEffect(() => {
    if (!rotation) return;

    if (settings.renderer === 'svg') {
      const countryPaths = select(svgRef.current).selectAll('path');
      rotateProjectionTo({
        selection: countryPaths,
        projection,
        path,
        rotation,
      });
    } else {
      const duration = 1000;
      const currentRotate = projection.rotate();

      path.projection(projection);
      const r = interpolate(currentRotate, rotation);

      // Update selection
      transition()
        .duration(duration)
        .tween('rotate', () => (t) => {
          projection.rotate(r(Math.pow(t, 0.33)));
          path.projection(projection);
          drawCanvas(true);
        });
    }
  }, [rotation, path, projection]);

  return settings.renderer === 'svg' ? (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size.width || 0} ${size.height || 0}`}
      className="globe"
      style={{ background: theme.bg.value }}
    >
      <defs>
        <radialGradient
          id="SphereShade"
          cx="0.5"
          cy="0.5"
          r=".8"
          fx="0.35"
          fy="0.25"
        >
          <stop offset="0" stopOpacity="0" />
          <stop offset=".3" stopOpacity="0.1" />
          <stop offset=".5" stopOpacity="0.3" />
          <stop offset=".9" stopOpacity="1" />
        </radialGradient>
        <filter id="night-blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
        </filter>

        <clipPath id="clip">
          <circle cx={cx} cy={cy} r={initialScale} />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={initialScale} fill={theme.oceanFill.value} />

      <path className="graticule" stroke={theme.graticule.value} fill="none" />

      <g>
        {data.features.map(({ id, ...rest }) => {
          return (
            <path
              key={id === '-99' ? rest.properties.name : id}
              id={id}
              className="country-path"
              stroke={
                country.id === id
                  ? theme.countryOutlineSelected.value
                  : theme.countryOutline.value
              }
              fill={
                country.id === id
                  ? theme.countryFillSelected.value
                  : theme.countryFill.value
              }
            />
          );
        })}
      </g>

      <path
        className="small-country-circle"
        stroke={0.02 > countrySize ? theme.smallCountryCircle.value : 'none'}
        strokeWidth="2"
        fill="none"
      />

      <g clipPath="url(#clip)">
        <circle
          cx={cx}
          cy={cy}
          r={initialScale}
          fill="url(#SphereShade)"
          opacity=".3"
        />
        <path
          className="night-shade"
          strokeWidth="2"
          fill={theme.nightShade.value}
          filter="url(#night-blur)"
        />
      </g>
    </svg>
  ) : (
    <div ref={rootRef} />
  );
}
