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
            domain: [-xBound, xBound],
          },
          y: {
            attribute: "y",
            type: "quantitative",
            domain: [-yBound, yBound],
          },
          size: { value: this.state.size ? this.state.size : 3 },
          opacity: { value: this.state.opacity ? this.state.opacity : 0.8 },
        },
      ],
    };

    if (Array.isArray(this.state.color)) {
      spec.defaultData.color = this.state.color;
      spec.tracks[0].color = {
        attribute: "color",
        type: "inline",
      };
    } else {
      spec.tracks[0].color = {
        value: this.state.color ? this.state.color : "#3182bd",
      };
    }

    return spec;
  }

  calcBounds() {
    // set boundaries to create a squarish plot
    // aspect ratio for scatter plots
    const aspRatio = this.elem.clientWidth / this.elem.clientHeight;

    let xBound = Math.max(...this.xDomain.map((a) => Math.abs(a)));
    let yBound = Math.max(...this.yDomain.map((a) => Math.abs(a)));

    if (aspRatio > 1) {
      xBound = xBound * aspRatio;
    } else {
      yBound = yBound / aspRatio;
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
      const xMinMax = getMinMax(this.input.x);
      const yMinMax = getMinMax(this.input.y);
      this.xDomain = [
        xMinMax[0] - Math.abs(0.25 * xMinMax[0]),
        xMinMax[1] + Math.abs(0.25 * xMinMax[1]),
      ];
      this.yDomain = [
        yMinMax[0] - Math.abs(0.25 * yMinMax[0]),
        yMinMax[1] + Math.abs(0.25 * yMinMax[1]),
      ];
    } else {
      throw `input data should contain x and y attributes`;
    }
  }

  setState(size, color, opacity) {
    if (size) {
      this.state["size"] = size;
    }

    if (color) {
      this.state["color"] = color;
    }

    if (opacity) {
      this.state["opacity"] = opacity;
    }
  }

  setInteraction(mode) {
    if (!["lasso", "pan", "box"].includes(mode)) {
      throw `${mode} needs to be one of lasso, pan or box selection`;
    }

    this.plot.setViewOptions({ tool: mode });
  }

  render() {
    var self = this;
    let spec = this.generateSpec();
    if (this._renderCount == 0) {
      this.plot.setSpecification(spec);

      // set window timesize event once
      window.addEventListener("resize", () => {
        // similar to what we do in epiviz
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }

        resizeTimeout = setTimeout(() => {
          self.plot.setCanvasSize(
            self.elem.parentNode.clientWidth,
            self.elem.parentNode.clientHeight
          );

          const { xBound, yBound } = self.calcBounds();

          spec["tracks"][0].x.domain = [-xBound, xBound];
          spec["tracks"][0].y.domain = [-yBound, yBound];

          self.plot.setSpecification(spec);
        }, 500);
      });
    } else {
      this.plot.updateSpecification(spec);
    }

    this.plot.addEventListener("pointHovered", (e) => {
      const hdata = e.detail.data;
      e.preventDefault();

      if ("distance" in hdata && hdata.distance <= 1.5) {
        self.hoverCallback(hdata);
      } else {
        self.hoverCallback(null);
      }
    });

    this.plot.addEventListener("pointClicked", (e) => {
      e.preventDefault();

      const hdata = e.detail.data;
      if ("distance" in hdata && hdata.distance <= 1.5) {
        self.clickCallback(hdata);
      } else {
        self.clickCallback(null);
      }
    });
  }

  // events
  selectionCallback(pointIdxs) {
    console.info(pointIdxs);
    return pointIdxs;
  }

  clickCallback(pointIdx) {
    console.info(pointIdx);
    return pointIdx;
  }

  hoverCallback(pointIdx) {
    console.info(pointIdx);
    return pointIdx;
  }
}

module.exports = ScatterGL;
