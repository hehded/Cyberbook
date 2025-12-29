/**
 * Base Component class implementing common functionality
 * Provides lifecycle hooks and event handling
 */

import { eventBus, EventBus, EventType } from '../events/EventBus.ts';
import { stateStore, State, selectors } from '../state/StateStore.ts';

// DOM types for Deno
declare global {
  interface Document {
    createElement(tagName: string): HTMLElement;
    getElementById(id: string): HTMLElement | null;
    querySelector(selector: string): HTMLElement | null;
    querySelectorAll(selector: string): NodeListOf<HTMLElement>;
    head: HTMLHeadElement;
    documentElement: HTMLElement;
    body: HTMLElement;
    readyState: string;
    activeElement: HTMLElement | null;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }
  
  interface HTMLElement {
    innerHTML: string;
    textContent: string;
    style: CSSStyleDeclaration;
    id: string;
    className: string;
    parentNode: Node | null;
    firstElementChild: HTMLElement | null;
    querySelector(selector: string): HTMLElement | null;
    querySelectorAll(selector: string): NodeListOf<HTMLElement>;
    appendChild(node: Node): Node;
    removeChild(node: Node): Node;
    getBoundingClientRect(): DOMRect;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
    getAttribute(name: string): string | null;
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
    classList: DOMTokenList;
    focus(): void;
    blur(): void;
  }
  
  interface DOMTokenList {
    add(token: string): void;
    remove(token: string): void;
    contains(token: string): boolean;
  }
  
  interface HTMLCanvasElement extends HTMLElement {
    width: number;
    height: number;
    getContext(contextId: string): CanvasRenderingContext2D | null;
  }
  
  interface CanvasRenderingContext2D {
    clearRect(x: number, y: number, width: number, height: number): void;
    fillRect(x: number, y: number, width: number, height: number): void;
    strokeRect(x: number, y: number, width: number, height: number): void;
    beginPath(): void;
    closePath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
    fill(): void;
    stroke(): void;
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    fillStyle: string | any;
    strokeStyle: string | any;
    lineWidth: number;
    font: string;
    measureText(text: string): TextMetrics;
    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    globalAlpha: number;
    textBaseline: string;
  }
  
  interface TextMetrics {
    width: number;
  }
  
  interface DOMRect {
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
  }
  
  interface Node {
    parentNode: Node | null;
    removeChild(node: Node): Node;
  }
  
  interface NodeListOf<TNode extends Node> {
    [index: number]: TNode;
    length: number;
    forEach(callbackfn: (value: TNode, key: number, parent: NodeListOf<TNode>) => void): void;
  }
  
  interface CSSStyleDeclaration {
    [property: string]: string;
  }
  
  interface HTMLHeadElement extends HTMLElement {
    appendChild(node: Node): Node;
    removeChild(node: Node): Node;
  }
  
  interface HTMLFormElement extends HTMLElement {
    elements: HTMLFormControlsCollection;
    submit(): void;
    reset(): void;
  }
  
  interface HTMLInputElement extends HTMLElement {
    value: string;
    type: string;
    checked: boolean;
    disabled: boolean;
    min: string;
    max: string;
    focus(): void;
    blur(): void;
  }
  
  interface HTMLButtonElement extends HTMLElement {
    disabled: boolean;
    type: string;
  }
  
  interface HTMLSelectElement extends HTMLElement {
    options: HTMLCollection;
    selectedOptions: HTMLCollection;
    value: string;
    multiple: boolean;
  }
  
  interface HTMLTextAreaElement extends HTMLElement {
    value: string;
    rows: number;
  }
  
  interface HTMLOptionElement extends HTMLElement {
    value: string;
    text: string;
    selected: boolean;
  }
  
  interface HTMLCollection {
    [index: number]: HTMLElement;
    length: number;
    item(index: number): HTMLElement | null;
  }
  
  interface HTMLFormControlsCollection {
    namedItem(name: string): HTMLElement | null;
    [index: number]: HTMLElement;
    length: number;
  }
  
  interface Window {
    devicePixelRatio?: number;
    innerWidth: number;
    innerHeight: number;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
    requestAnimationFrame(callback: FrameRequestCallback): number;
    cancelAnimationFrame(id: number): void;
    setTimeout(callback: Function, delay: number): number;
    clearTimeout(id: number): void;
    setInterval(callback: Function, delay: number): number;
    clearInterval(id: number): void;
  }
  
  interface Event {
    clientX: number;
    clientY: number;
    ctrlKey: boolean;
    metaKey: boolean;
  }
  
  interface MouseEvent extends Event {
    clientX: number;
    clientY: number;
    ctrlKey: boolean;
    metaKey: boolean;
  }
  
  interface EventListener {
    (evt: Event): void;
  }
  
  interface FrameRequestCallback {
    (time: number): void;
  }
  
  interface CSSStyleRule {
    style: CSSStyleDeclaration;
  }
  
  interface CSSStyleSheet {
    cssRules?: CSSRuleList;
  }
  
  interface CSSRuleList {
    [index: number]: CSSStyleRule;
    length: number;
  }
  
  interface Element {
    firstElementChild: Element | null;
    getBoundingClientRect(): DOMRect;
  }
  
  function getComputedStyle(element: Element): CSSStyleDeclaration;
  
  const document: Document;
  // const window: Window; // Already available globally
}

export interface ComponentConfig {
  element?: HTMLElement | string;
  template?: string;
  styles?: string;
  props?: Record<string, any>;
}

/**
 * Base Component class
 */
export abstract class BaseComponent {
  protected element: HTMLElement;
  protected children: BaseComponent[] = [];
  protected eventUnsubscribers: (() => void)[] = [];
  protected stateUnsubscribers: (() => void)[] = [];
  protected props: Record<string, any> = {};
  protected isDestroyed = false;

  constructor(config: ComponentConfig) {
    // Create or get element
    if (typeof config.element === 'string') {
      this.element = document.querySelector(config.element) as HTMLElement;
      if (!this.element) {
        throw new Error(`Element not found: ${config.element}`);
      }
    } else if (config.element) {
      this.element = config.element;
    } else {
      this.element = this.createElement();
    }

    // Set props
    this.props = config.props || {};

    // Apply template if provided
    if (config.template) {
      this.element.innerHTML = config.template;
    }

    // Apply styles if provided
    if (config.styles) {
      this.applyStyles(config.styles);
    }

    // Initialize component
    this.init();
  }

  /**
   * Create element from template
   */
  protected createElement(): HTMLElement {
    const template = this.getTemplate();
    if (!template) {
      return document.createElement('div');
    }

    const div = document.createElement('div');
    div.innerHTML = template.trim();
    return div.firstElementChild as HTMLElement || div;
  }

  /**
   * Get component template - to be overridden by subclasses
   */
  protected getTemplate(): string {
    return '';
  }

  /**
   * Apply styles to component
   */
  protected applyStyles(styles: string): void {
    if (this.element.id) {
      // Create style element if not exists
      let styleEl = document.getElementById(`style-${this.element.id}`);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = `style-${this.element.id}`;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = styles;
    } else {
      // For components without ID, use scoped styles
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
      this.eventUnsubscribers.push(() => {
        document.head.removeChild(styleEl);
      });
    }
  }

  /**
   * Initialize component - called after construction
   */
  protected init(): void {
    this.bindEvents();
    this.subscribeToState();
    this.subscribeToEvents();
    this.onInit();
  }

  /**
   * Bind DOM events - to be overridden by subclasses
   */
  protected bindEvents(): void {
    // Override in subclasses
  }

  /**
   * Subscribe to state changes - to be overridden by subclasses
   */
  protected subscribeToState(): void {
    // Override in subclasses
  }

  /**
   * Subscribe to event bus - to be overridden by subclasses
   */
  protected subscribeToEvents(): void {
    // Override in subclasses
  }

  /**
   * Component initialization hook - called after all setup
   */
  protected onInit(): void {
    // Override in subclasses
  }

  /**
   * Component destruction hook - called before cleanup
   */
  protected onDestroy(): void {
    // Override in subclasses
  }

  /**
   * Subscribe to state changes
   */
  protected subscribeToStateSlice<K extends keyof State>(
    key: K,
    callback: (value: State[K]) => void
  ): void {
    const unsubscribe = stateStore.subscribeToSlice(key, callback);
    this.stateUnsubscribers.push(unsubscribe);
  }

  /**
   * Subscribe to event bus
   */
  protected subscribeToEvent<T>(
    event: EventType,
    callback: (data: T) => void
  ): void {
    const unsubscribe = eventBus.subscribe(event, callback);
    this.eventUnsubscribers.push(unsubscribe);
  }

  /**
   * Get current state
   */
  protected getState(): State {
    return stateStore.getState();
  }

  /**
   * Get specific state slice
   */
  protected getStateSlice<K extends keyof State>(key: K): State[K] {
    return stateStore.getStateSlice(key);
  }

  /**
   * Update state
   */
  protected setState(updates: Partial<State>): void {
    stateStore.setState(updates);
  }

  /**
   * Update state slice
   */
  protected setStateSlice<K extends keyof State>(
    key: K,
    value: State[K]
  ): void {
    stateStore.setStateSlice(key, value);
  }

  /**
   * Publish event to event bus
   */
  protected publishEvent<T>(event: EventType, data: T): void {
    eventBus.publish(event, data);
  }

  /**
   * Find child element
   */
  protected findElement<T extends HTMLElement = HTMLElement>(
    selector: string
  ): T | null {
    return this.element.querySelector(selector) as T | null;
  }

  /**
   * Find child elements
   */
  protected findElements<T extends HTMLElement = HTMLElement>(
    selector: string
  ): T[] {
    return Array.from(this.element.querySelectorAll(selector)) as T[];
  }

  /**
   * Add child component
   */
  protected addChild(child: BaseComponent): void {
    this.children.push(child);
    this.element.appendChild(child.element);
  }

  /**
   * Remove child component
   */
  protected removeChild(child: BaseComponent): void {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.destroy();
    }
  }

  /**
   * Show component
   */
  public show(): void {
    this.element.style.display = '';
    this.onShow();
  }

  /**
   * Hide component
   */
  public hide(): void {
    this.element.style.display = 'none';
    this.onHide();
  }

  /**
   * Show/hide component hook
   */
  protected onShow(): void {
    // Override in subclasses
  }

  protected onHide(): void {
    // Override in subclasses
  }

  /**
   * Set component property
   */
  public setProp(key: string, value: any): void {
    this.props[key] = value;
    this.onPropChange(key, value);
  }

  /**
   * Get component property
   */
  public getProp<T = any>(key: string): T {
    return this.props[key];
  }

  /**
   * Property change hook
   */
  protected onPropChange(key: string, value: any): void {
    // Override in subclasses
  }

  /**
   * Update component rendering
   */
  protected render(): void {
    this.beforeRender();
    this.doRender();
    this.afterRender();
  }

  /**
   * Before render hook
   */
  protected beforeRender(): void {
    // Override in subclasses
  }

  /**
   * Do actual rendering - to be overridden by subclasses
   */
  protected doRender(): void {
    // Override in subclasses
  }

  /**
   * After render hook
   */
  protected afterRender(): void {
    // Override in subclasses
  }

  /**
   * Destroy component and clean up
   */
  public destroy(): void {
    if (this.isDestroyed) return;

    this.onDestroy();

    // Destroy children
    this.children.forEach(child => child.destroy());
    this.children = [];

    // Unsubscribe from events
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];

    // Unsubscribe from state
    this.stateUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.stateUnsubscribers = [];

    // Remove element from DOM
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.isDestroyed = true;
  }

  /**
   * Check if component is destroyed
   */
  public isComponentDestroyed(): boolean {
    return this.isDestroyed;
  }
}

/**
 * Functional component helper
 */
export function createComponent<P extends Record<string, any> = Record<string, any>>(
  config: ComponentConfig & {
    render: (props: P) => string;
    onMount?: (element: HTMLElement, props: P) => (() => void) | void;
    onUpdate?: (element: HTMLElement, props: P) => void;
    onDestroy?: (element: HTMLElement) => void;
  }
): BaseComponent {
  class FunctionalComponent extends BaseComponent {
    private cleanup: (() => void) | null = null;

    protected override getTemplate(): string {
      return config.render(this.props as P);
    }

    protected override onInit(): void {
      if (config.onMount) {
        this.cleanup = config.onMount(this.element, this.props as P) || null;
      }
    }

    protected override onPropChange(key: string, value: any): void {
      if (config.onUpdate) {
        config.onUpdate(this.element, this.props as P);
      }
    }

    protected override onDestroy(): void {
      if (this.cleanup) {
        this.cleanup();
      }
      if (config.onDestroy) {
        config.onDestroy(this.element);
      }
    }
  }

  return new FunctionalComponent(config);
}