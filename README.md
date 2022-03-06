# epiviz.scatter.gl

A fast and scalable WebGL2 based rendering library for visualizing scatter/dot plots. The library uses [epiviz.gl](https://github.com/epiviz/epiviz.gl) under the hood and provides an easier interface for use in various applications. 

Internally, the library creates two WebWorkers

- data worker: indexes the data points using [flatbush](https://github.com/mourner/flatbush)
- webgl worker: all the rendering magic happens here

`epiviz.gl` uses [OffScreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) to delegate rendering to a worker. since the main thread of the browser is less busy, this provides a fluid, high-performance user experience for applications.

## Getting started


### Installation

```
npm install epiviz.scatter.gl
```

### Usage

#### Simple usage:

```
    import ScatterGL from "epiviz.scatter.gl";
    
    # you can either pass in a dom selector or HTMLElement
    let plot = new ScatterGL(".canvas");

    # provide input data to the element, 
    # data must contain x and y coordinates
    plot.setInput({
        x: [...],
        y: [...],
    });

    # render the plot
    plot.render();
```

### Advanced Usage

The library provides methods to capture events and modify attributes - 

#### Interaction modes

- pan
- box
- lasso


#### Events

- hoverCallback
- clickCallback
- selectionCallback

#### other attributes

- colors
- size
- opacity