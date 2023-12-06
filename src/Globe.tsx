// import * as d3 from "d3"
import { geoPath, geoCentroid, geoOrthographic, geoGraticule10, select, drag, zoom, geoContains } from 'd3';
import { land } from "./App";
import { useEffect, useMemo, useRef } from "react";
import {
  throttledRotateProjectionBy,
  throttledZoomProjectionBy,
  rotateProjectionTo,
} from './transformations';

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

  useEffect(() => {
    if (!data.features.length) return;

    const graticule = geoGraticule10()

    // Selectors
    const svg = select(svgRef.current);
    const globeCircle = svg.selectAll('circle');
    const countryPaths = svg.selectAll('.country-path');
    const graticulePath = svg.select('.graticule');

    // Drag
    const dragBehaviour = drag().on('drag', event => {
      const rotate = projection.rotate();
      const k = sensitivity / projection.scale();

      // Update projection
      projection.rotate([rotate[0] + event.dx * k, rotate[1] - event.dy * k]);
      path.projection(projection);
      countryPaths.attr('d', path);
      graticulePath.attr('d', path);
    });

    // Zoom
    const zoomBehaviour = zoom().on('zoom', event => {
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
      }
    });

    // Apply scroll and drag behaviour
    svg.call(dragBehaviour).call(zoomBehaviour);

    // Update country paths
    countryPaths.data(data.features).join('path').attr('d', path);
    globeCircle.attr('r', projection.scale());
    graticulePath.attr('d', path);
  }, [
    width,
    data,
    path,
    projection,
    initialScale,
    minScroll,
    maxScroll,
    sensitivity,
  ]);


  useEffect(() => {
    if (!rotation) return;

    const countryPaths = select(svgRef.current).selectAll('.country-path');

    rotateProjectionTo({
      selection: countryPaths,
      projection,
      path,
      rotation,
    });
  }, [rotation, path, projection]);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${size.width || 0} ${size.height || 0}`} className="globe">
      <defs>
        <radialGradient id="SphereShade" cx="0.5" cy="0.5" r=".8" fx="0.35" fy="0.25">
          <stop offset="0" stopOpacity="0" />
          <stop offset=".3" stopOpacity="0.1" />
          <stop offset=".5" stopOpacity="0.3" />
          <stop offset=".9" stopOpacity="1" />
        </radialGradient>
      </defs>

      <g>
        <circle cx={cx} cy={cy} r={initialScale} fill="#e0f2ff" />
        {data.features.map(({ id }) => (
          <path
            key={id}
            id={id}
            className="country-path"
            stroke="rgba(0, 0, 0, 0.4)" fill={country.id === id ? "#ffd570" : "#aaccb5"}
          />
        ))}
      </g>

      {/* <use xlinkHref="#outline" stroke="rgba(0, 0, 0, 0.5)" fill="#e0f2ff" /> */}
      <path className="graticule" stroke="rgba(0, 0, 0, 0.1)" fill="none" />
      <circle cx={cx} cy={cy} r={initialScale} fill="url(#SphereShade)" opacity=".3" />
    </svg >
  )
}
