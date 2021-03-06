/** Class representing a treemap. */
class Treemap {
  /**
   * Create a new treemap.
   * @param {!number} width - The width of the viewbox of the treemap.
   * @param {!number} height - The width of the viewbox of the height.
   * @param {?object} data - The data object of the treemap (see data folder for examples).
   * @param {!function} [format=d3.format(',d')] - The string formatting function of the data.
   * @param {!function} [color=d3.scaleOrdinal(d3.schemeCategory10)] - The d3 color function of the treemap (see [here]{@link https://github.com/d3/d3-scale-chromatic} for examples).
   */
  constructor (width, height, data, format = d3.format(',d'), color = d3.scaleOrdinal(d3.schemeCategory10)) {
    this._format = format;
    this._color = color;

    this._width = width;
    this._height = height;
    this._data = data;
    this._parents = [];
    this.update()
  }

  update() {
    for (var i = this._parents.length - 1; i >= 0; i--) {
      this.node.parentNode.removeChild(this.node);
    }

    this._svg = d3.create('svg')
      .attr('viewBox', [0, 0, this.width, this.height])
      .style('font', '10px sans-serif');

    if(this._data == null) {
      return;
    }

    this.root = Treemap.treemap(this.width, this.height, this.data);

    const leaf = this._svg.selectAll('g')
      .data(this.root.leaves())
      .join('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    leaf.append('title')
      .text(d => `${d.ancestors().reverse().map(d => d.data.name).join('/')}\n${this.format(d.value)}`);

    leaf.append('rect')
      .attr('id', d => Treemap.linkedUid(d, 'leaf'))
      .attr('fill', d => { while (d.depth > 1) d = d.parent; return this.color(d.data.name); })
      .attr('fill-opacity', 0.6)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0);

    leaf.append('clipPath')
        .attr('id', d => Treemap.linkedUid(d, 'clip'))
      .append('use')
        .attr('xlink:href', d => d.leafHref);

    leaf.append('text')
      .attr('clip-path', d => 'url(' + d.clipHref + ')')
      .selectAll('tspan')
      .data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g).concat(this.format(d.value)))
      .join('tspan')
        .attr('x', 3)
        .attr('y', (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
        .attr('fill-opacity', (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
        .text(d => d);

    for (var i = this._parents.length - 1; i >= 0; i--) {
      $(this._parents[i]).append(this.node);
    }
  }

  /**
   * Property (get/set) - d3 color function. On set it will update the treemap in the DOM.
   * @type {function}
   */
  get color() {
    return this._color;
  }

  set color(color) {
    this._color = color;
    this.update();
  }

  /**
   * Property (get/set) - d3 string format function. On set it will update the treemap in the DOM.
   * @type {function}
   */
  get format() {
    return this._format;
  }

  set format(format) {
    this._format = format;
    this.update();
  }

  /**
   * Property (get/set) - treemap data object. On set it will update the treemap in the DOM.
   * @type {object}
   */
  get data() {
    return this._data;
  }
  
  set data(data) {
    this._data = data;
    this.update();
  }

  /**
   * Property (get/set) - width. On set it will update the treemap in the DOM.
   * @type {number}
   */
  get width() {
    return this._width;
  }

  set width(width) {
    this._width = width;
    this.update();
  }

  /**
   * Property (get/set) - height. On set it will update the treemap in the DOM.
   * @type {number}
   */
  get height() {
    return this._height;
  }

  set height(height) {
    this._height = height;
    this.update();
  }

  /**
   * Property (get) - node. Returns HTML node of the most recently generate SVG of the treemap.
   * @type {number}
   */
  get node() {
    return this._svg.node();
  }

  /**
   * Appends the treemap into a parent.
   * @param {string} into - Uses jQuery to select the parent element into which the treemap should be nested.
   */
  appendInto(into) {
    const $into = $(into);
    $into.append(this.node);
    this._parents.push($into);
  }

  /**
   * Helper method to set some of the properties of the basic d3 treemap including: size, padding, roundness and data sorting.
   * @param {number} width - Height of the treemap.
   * @param {number} height - Width of the treemap.
   * @param {object} d - d3 data object.
   * @returns {object} treemap - Root d3 treemap object.
   */
  static treemap (width, height, data) {
    return d3.treemap()
      .size([width, height])
      .padding(1)
      .round(true)(d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value));
  }

  /**
   * Helper method to generate the base URL of the window (i.e. no trailing '/#')
   * @returns {string} url - Base URL of the current window.
   */
  static baseUrl () {
    return window.location.origin + window.location.pathname;
  }

  /**
   * Helper method to generate a pseudo-random, pseudo-unique ID.
   * @returns {string} id - A unique identifier.
   */
  static uid () {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Helper method to append the UID and link to the element which has that UID to a leaf (for use in clip paths).
   * @param {object} d - d3 data object to add these properties to.
   * @param {string} prefix - String to prefix the UID/link (href) with - only 'clip' or 'leaf' in base class for defining clip paths then making text adhere to them.
   * @returns {object} d - Modified d3 data object with the UID and link to the element injected.
   */
  static linkedUid (d, prefix) {
    d[prefix + 'Uid'] = 'clip' + Treemap.uid();
    d[prefix + 'Href'] = Treemap.baseUrl() + '#' + d[prefix + 'Uid'];
    return d[prefix + 'Uid'];
  }
}