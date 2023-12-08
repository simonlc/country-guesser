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
} from 'd3';
import { land } from './App';
import { useEffect, useMemo, useRef } from 'react';
import { rotateProjectionTo } from './transformations';
import * as solar from 'solar-calculator';

const theme = {
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
  nightShade: { value: 'rgba(0, 0, 0, 0.2', label: 'Night shade' },
};

// const theme = {
//   countryOutline: { value: '#d61f1f', label: 'Country Outline' },
//   countryFill: { value: '#800a21', label: 'Country Fill' },
//   oceanFill: { value: '#060623', label: 'Oceans' },
//   graticule: { value: '#152123', label: 'Graticule' },
//   bgHaze1: { value: '#0eb7e1', label: 'BG Haze 1' },
//   bgHaze2: { value: '#045181', label: 'BG Haze 2' },
//   bg: { value: '#000', label: 'BG Color' },
//   nightShade: { value: 'rgba(0, 0, 0, 0.2', label: 'Night shade' },
// };

export function Globe({ size, country, initialRotation, rotation }) {
  const svgRef = useRef<SVGSVGElement>(null);

  const width = size.width;
  const height = size.height;
  const cx = width / 2;
  const cy = height / 2;

  const initialScale = Math.min(size.width, size.height) / 2 - 10;
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

  function haze(alpha = 0.5, r1 = 0, r2 = height / 2 - inset) {
    context.save();
    var grd = context.createRadialGradient(
      width / 3,
      height / 3,
      r1,
      height / 2,
      height / 2,
      r2,
    );
    grd.addColorStop(0.0, colors.bgHaze1);
    grd.addColorStop(0.35, colors.bgHaze2);
    grd.addColorStop(1, colors.bg);
    // Fill with gradient
    context.globalAlpha = alpha;
    context.fillStyle = grd;
    context.beginPath();
    context.arc(width / 2, height / 2, r2, 0, 2 * Math.PI, false);
    context.fill();
    context.restore();
  }
  // haze(0.5, 0, width*1.5)
  //     haze(0.3, 0, width)

  useEffect(() => {
    if (!data.features.length) return;

    // Selectors
    const svg = select(svgRef.current);
    const globeCircle = svg.selectAll('circle');
    const countryPaths = svg.selectAll('.country-path');
    const graticulePath = svg.select('.graticule');
    const smallCountryCirclePath = svg.select('.small-country-circle');
    const nightShadePath = svg.select('.night-shade');

    // Drag
    const dragBehaviour = drag().on('drag', (event) => {
      const rotate = projection.rotate();
      const k = sensitivity / projection.scale();

      // Update projection
      projection.rotate([rotate[0] + event.dx * k, rotate[1] - event.dy * k]);
      path.projection(projection);
      countryPaths.attr('d', path);
      graticulePath.attr('d', path);
      smallCountryCirclePath.attr('d', path);
      nightShadePath.attr('d', path);
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
        countryPaths.attr('d', path);
        globeCircle.attr('r', projection.scale());
        graticulePath.attr('d', path);
        smallCountryCirclePath.attr('d', path);
        nightShadePath.attr('d', path);
      }
    });

    // Apply scroll and drag behaviour
    svg.call(dragBehaviour).call(zoomBehaviour);

    // Update country paths
    countryPaths.data(data.features).join('path').attr('d', path);
    globeCircle.attr('r', projection.scale());
    graticulePath.data([graticule]).attr('d', path);
    smallCountryCirclePath.data([smallCountryCircle()]).attr('d', path);
    nightShadePath.data([night()]).attr('d', path);
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

    const countryPaths = select(svgRef.current).selectAll('path');

    rotateProjectionTo({
      selection: countryPaths,
      projection,
      path,
      rotation,
    });
  }, [rotation, path, projection]);

  return (
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

      {/* <circle */}
      {/*   cx={cx} */}
      {/*   cy={cy} */}
      {/*   r={initialScale} */}
      {/*   fill="url(#SphereShade)" */}
      {/*   opacity=".3" */}
      {/* /> */}

      <path
        className="small-country-circle"
        stroke={0.02 > countrySize ? theme.smallCountryCircle.value : 'none'}
        strokeWidth="2"
        fill="none"
      />

      <path
        className="night-shade"
        strokeWidth="2"
        fill={theme.nightShade.value}
        filter="url(#night-blur)"
      />
    </svg>
  );
}
