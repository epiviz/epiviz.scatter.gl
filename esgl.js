'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var WebGLVis = _interopDefault(require('epiviz.gl'));

function isObject(object) {
    return typeof object === 'object' && Array.isArray(object) === false;
}

const getMinMax = (arr) => {
    var max = -Number.MAX_VALUE,
        min = Number.MAX_VALUE;
    arr.forEach(function (x) {
        if (max < x) {
            max = x;
        }
        if (min > x) {
            min = x;
        }
    });
    return [min, max];
};

class ScatterGL {
  constructor(selectorOrElement) {
    this.elem = selectorOrElement;
    if (
      typeof selectorOrElement === "string" ||
      selectorOrElement instanceof String
    ) {
      this.elem = document.querySelector(selectorOrElement);
    }

    if (!(this.elem instanceof HTMLElement)) {
      throw `${selectorOrElement} is neither a valid dom selector not an element on the page`;
    }

    this.plot = new WebGLVis(this.elem);
    this.plot.addToDom();

    // input properties
    this.input = {
      x: null,
      y: null,
    };

    // state
    this.state = {
      size: 3,
      opacity: 0.8,
      color: "#3182bd",
    };

    // private properties
    this._renderCount = 0;

    // add events
    var self = this;
    this.plot.addEventListener("onSelectionEnd", (e) => {
      self.selectionCallback(e.detail.data);
    });
  }

  generateSpec() {
    const { xBound, yBound } = this.calcBounds();

    let spec = {
      defaultData: {
        x: this.input.x,
        y: this.input.y,
      },
      xAxis: "none",
      yAxis: "none",
      tracks: [
        {
          mark: "point",
          x: {
            attribute: "x",
            type: "quantitative",
            domain: xBound,
          },
          y: {
            attribute: "y",
            type: "quantitative",
            domain: yBound,
          },
          size: { value: this.state.size ? this.state.size : 3 },
          opacity: { value: this.state.opacity ? this.state.opacity : 0.8 },
        },
      ],
    };

    this._generateSpecForEncoding(spec, "color", this.state.color);
    this._generateSpecForEncoding(spec, "size", this.state.size);
    this._generateSpecForEncoding(spec, "opacity", this.state.opacity);

    if ("shape" in this.state) {
      this._generateSpecForEncoding(spec, "shape", this.state.shape);
    }

    return spec;
  }

  _generateSpecForEncoding(spec, attribute, value) {
    if (Array.isArray(value)) {

      if (value.length !== spec.defaultData[Object.keys(spec.defaultData)[0]].length) {
        throw `length of ${value} not the same as the length of data: needs to be ${spec.defaultData[Object.keys(spec.defaultData)[0]].length}`
      }

      spec.defaultData[attribute] = value;
      spec.tracks[0][attribute] = {
        attribute: attribute,
        type: "inline",
      };
    } else {
      spec.tracks[0][attribute] = {
        value: value ? value : this.state[attribute],
      };
    }
  }

  calcBounds() {
    // set boundaries to create a squarish plot
    // aspect ratio for scatter plots
    let aspRatio = this.elem.clientWidth / this.elem.clientHeight;

    if (!Number.isFinite(aspRatio)) {
      aspRatio = 1;
    }

    let xBound = this.xDomain;
    // Math.max(...this.xDomain.map((a) => Math.abs(a)));
    let yBound = this.yDomain;
    // Math.max(...this.yDomain.map((a) => Math.abs(a)));

    if (aspRatio > 1) {
      xBound = xBound.map(x => x * aspRatio);
    } else {
      yBound = yBound.map(x => x / aspRatio);
    }

    return { xBound, yBound };
  }

  setInput(data) {
    if (
      isObject(data) &&
      "x" in data &&
      "y" in data &&
      data.x.length === data.y.length
    ) {
      this.input = { ...this.input, ...data };

      // calc min and max
      let xMinMax = getMinMax(this.input.x);
      let yMinMax = getMinMax(this.input.y);

      xMinMax = xMinMax.map((x, i) => x === 0 ? (Math.pow(-1, i + 1) * (xMinMax[i + 1 % 2] * 0.05)) : x);
      yMinMax = yMinMax.map((x, i) => x === 0 ? (Math.pow(-1, i + 1) * (yMinMax[i + 1 % 2] * 0.05)) : x);

      this.xDomain = [
        xMinMax[0] - Math.abs(0.05 * xMinMax[0]),
        xMinMax[1] + Math.abs(0.05 * xMinMax[1]),
      ];
      this.yDomain = [
        yMinMax[0] - Math.abs(0.05 * yMinMax[0]),
        yMinMax[1] + Math.abs(0.05 * yMinMax[1]),
      ];
    } else {
      throw `input data should contain x and y attributes`;
    }
  }

  setState(encoding) {
    if ("size" in encoding) {
      this.state["size"] = encoding["size"];
    }

    if ("color" in encoding) {
      this.state["color"] = encoding["color"];
    }

    if ("opacity" in encoding) {
      this.state["opacity"] = encoding["opacity"];
    }

    if ("shape" in encoding) {
      this.state["shape"] = encoding["shape"];
    }
  }

  setInteraction(mode) {
    if (!["lasso", "pan", "box"].includes(mode)) {
      throw `${mode} needs to be one of lasso, pan or box selection`;
    }

    this.plot.setViewOptions({ tool: mode });
  }

  resize(width, height) {
    this.plot.setCanvasSize(
      width, height
    );

    // this.render();

    // this.plot.setSpecification(spec);
  }

  attachResizeEvent() {
    var self = this;
    // set window timesize event once
    let resizeTimeout;
    window.addEventListener("resize", () => {
      // similar to what we do in epiviz
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        self.resize(self.elem.parentNode.clientWidth, self.elem.parentNode.clientHeight);
      }, 500);
    });
  }


  render(width, height) {
    var self = this;
    this._spec = this.generateSpec();

    if (width) {
      this._spec.width = width;
    }

    if (height) {
      this._spec.height = height;
    }

    if (this._renderCount == 0) {
      this.plot.setSpecification(this._spec);
    } else {
      this.plot.updateSpecification(this._spec);
    }

    this.plot.addEventListener("pointHovered", (e) => {
      const hdata = e.detail.data;
      e.preventDefault();

      self.hoverCallback(hdata);
    });

    this.plot.addEventListener("pointClicked", (e) => {
      e.preventDefault();

      const hdata = e.detail.data;
      self.clickCallback(hdata);
    });
  }

  // events
  selectionCallback(pointIdxs) {
    return pointIdxs;
  }

  clickCallback(pointIdx) {
    return pointIdx;
  }

  hoverCallback(pointIdx) {
    return pointIdx;
  }
}

module.exports = ScatterGL;
