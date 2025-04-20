declare module 'leaflet' {
  export interface MapOptions {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    scrollWheelZoom?: boolean;
    [key: string]: any;
  }

  export interface IconOptions {
    iconUrl?: string;
    iconRetinaUrl?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
    tooltipAnchor?: [number, number];
    shadowUrl?: string;
    shadowRetinaUrl?: string;
    shadowSize?: [number, number];
    shadowAnchor?: [number, number];
    className?: string;
    [key: string]: any;
  }

  export interface DivIconOptions extends IconOptions {
    html?: string;
    bgPos?: [number, number];
    [key: string]: any;
  }

  export class Icon {
    constructor(options: IconOptions);
    createIcon(oldIcon?: HTMLElement): HTMLElement;
    createShadow(oldIcon?: HTMLElement): HTMLElement;
  }

  export class DivIcon extends Icon {
    constructor(options: DivIconOptions);
  }

  export class Marker extends FeatureGroup {
    constructor(latlng: [number, number], options?: any);
    setIcon(icon: Icon): this;
    getLatLng(): LatLng;
    setLatLng(latlng: [number, number]): this;
  }

  export class Popup extends FeatureGroup {
    constructor(options?: any);
    setLatLng(latlng: [number, number]): this;
    setContent(content: string | HTMLElement): this;
    openOn(map: Map): this;
  }

  export class FeatureGroup extends LayerGroup {
    constructor(layers?: Layer[]);
  }

  export class LayerGroup extends Layer {
    constructor(layers?: Layer[]);
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    clearLayers(): this;
  }

  export class Layer {
    addTo(map: Map): this;
    remove(): this;
    removeFrom(map: Map): this;
  }

  export class Map {
    constructor(element: string | HTMLElement, options?: MapOptions);
    setView(center: [number, number], zoom?: number, options?: any): this;
    fitBounds(bounds: LatLngBounds, options?: any): this;
    getBounds(): LatLngBounds;
    getCenter(): LatLng;
    getZoom(): number;
    setZoom(zoom: number): this;
    zoomIn(delta?: number): this;
    zoomOut(delta?: number): this;
    panTo(latlng: [number, number], options?: any): this;
    flyTo(latlng: [number, number], zoom?: number, options?: any): this;
    flyToBounds(bounds: LatLngBounds, options?: any): this;
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    hasLayer(layer: Layer): boolean;
    eachLayer(fn: (layer: Layer) => void, context?: any): this;
    openPopup(popup: Popup): this;
    closePopup(popup?: Popup): this;
    openTooltip(tooltip: Tooltip): this;
    closeTooltip(tooltip?: Tooltip): this;
  }

  export class LatLng {
    constructor(lat: number, lng: number, alt?: number);
    lat: number;
    lng: number;
    alt?: number;
    equals(otherLatLng: LatLng, maxMargin?: number): boolean;
    toString(): string;
    distanceTo(otherLatLng: LatLng): number;
    wrap(): LatLng;
    toBounds(sizeInMeters: number): LatLngBounds;
  }

  export class LatLngBounds {
    constructor(southWest: LatLng | [number, number], northEast: LatLng | [number, number]);
    extend(latlng: LatLng | [number, number]): this;
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
    getNorth(): number;
    getSouth(): number;
    getEast(): number;
    getWest(): number;
    getCenter(): LatLng;
    contains(latlng: LatLng | [number, number]): boolean;
    intersects(bounds: LatLngBounds): boolean;
    overlaps(bounds: Bounds): boolean;
    toBBoxString(): string;
    equals(bounds: LatLngBounds): boolean;
    isValid(): boolean;
  }

  export class Bounds {
    constructor(points: Point[]);
    extend(point: Point): this;
    getCenter(round?: boolean): Point;
    getBottomLeft(): Point;
    getBottomRight(): Point;
    getTopLeft(): Point;
    getTopRight(): Point;
    getSize(): Point;
    contains(point: Point): boolean;
    intersects(bounds: Bounds): boolean;
    overlaps(bounds: Bounds): boolean;
  }

  export class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
    equals(otherPoint: Point): boolean;
    contains(otherPoint: Point): boolean;
    toString(): string;
    distanceTo(otherPoint: Point): number;
    add(otherPoint: Point): Point;
    subtract(otherPoint: Point): Point;
    divideBy(num: number): Point;
    multiplyBy(num: number): Point;
    scaleBy(scale: Point): Point;
    unscaleBy(scale: Point): Point;
    round(): Point;
    floor(): Point;
    ceil(): Point;
    trunc(): Point;
  }

  export class Tooltip extends Layer {
    constructor(options?: any);
    setLatLng(latlng: [number, number]): this;
    setContent(content: string | HTMLElement): this;
  }

  export namespace DomUtil {
    function get(id: string | HTMLElement): HTMLElement;
    function getStyle(el: HTMLElement, styleAttrs: string[]): any;
    function create(tagName: string, className?: string, container?: HTMLElement): HTMLElement;
    function remove(el: HTMLElement): void;
    function empty(el: HTMLElement): void;
    function toFront(el: HTMLElement): void;
    function toBack(el: HTMLElement): void;
  }

  export namespace DomEvent {
    function addListener(el: HTMLElement, types: string, fn: Function, context?: any): void;
    function removeListener(el: HTMLElement, types: string, fn: Function, context?: any): void;
    function stopPropagation(e: Event): void;
    function disableScrollPropagation(el: HTMLElement): void;
    function disableClickPropagation(el: HTMLElement): void;
    function preventDefault(e: Event): void;
    function stop(e: Event): void;
  }

  export namespace Util {
    function extend(dest: any, src: any): any;
    function bind(fn: Function, obj: any): Function;
    function stamp(obj: any): number;
    function throttle(fn: Function, time: number, context?: any): Function;
    function wrapNum(num: number, range: number[], includeMax?: boolean): number;
    function falseFn(): boolean;
    function formatNum(num: number, digits?: number): number;
    function trim(str: string): string;
    function splitWords(str: string): string[];
    function setOptions(obj: any, options: any): any;
    function getParamString(obj: any, existingUrl?: string, uppercase?: boolean): string;
    function template(str: string, data: any): string;
    function isArray(obj: any): boolean;
    function indexOf(array: any[], el: any): number;
    function requestAnimFrame(fn: Function): number;
    function cancelAnimFrame(id: number): void;
  }

  export namespace Icon {
    class Default extends Icon {
      static mergeOptions(options: IconOptions): void;
    }
  }

  export function latLng(latitude: number, longitude: number, altitude?: number): LatLng;
  export function latLng(coords: [number, number] | [number, number, number]): LatLng;
  export function latLng(coords: { lat: number; lng: number; alt?: number }): LatLng;

  export function latLngBounds(southWest: LatLng | [number, number], northEast: LatLng | [number, number]): LatLngBounds;
  export function latLngBounds(latlngs: LatLng[] | [number, number][]): LatLngBounds;

  export function point(x: number, y: number): Point;
  export function point(coords: [number, number]): Point;

  export function bounds(points: Point[]): Bounds;
  export function bounds(topLeft: Point, bottomRight: Point): Bounds;

  export function divIcon(options: DivIconOptions): DivIcon;
  export function icon(options: IconOptions): Icon;
  export function marker(latlng: LatLng | [number, number], options?: any): Marker;
  export function popup(options?: any): Popup;
  export function tooltip(options?: any): Tooltip;
  export function map(element: string | HTMLElement, options?: MapOptions): Map;
} 