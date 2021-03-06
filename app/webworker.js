import _ from 'lodash'
import { geoPath } from 'd3'
import { satellite, updateSatellite } from 'satellite.js'
import { PathWriter } from 'canvasProxy.js'

let vectors, path, projection, useSVG
let commands = [], args = []

let fns = {
  'setup': function (options) {
    vectors = options.vectors
    useSVG = options.useSVG
    projection = satellite(options.distance)
    path = geoPath().projection(projection)

    postMessage(['setupComplete', {}])
  },

  'projectPaths': function (options) {
    updateSatellite(
      projection,
      options.width,
      options.height,
      options.rotate
    )

    if (useSVG) {
      let results = _.map(vectors, (vector) => {
        return { 'name': vector.name, 'data': path(vector.data) }
      })

      postMessage(['pathsProjected', { paths: results }])
    }
    else {
      let proxy = new PathWriter(
        options.commandBuffer,
        options.argumentBuffer
      )

      path.context(proxy)

      let results = _.map(vectors, (vector) => {
        path(vector.data)
        proxy.markEndOfPath()
        return vector.name
      })

      postMessage(['pathsProjected', {
          commandBuffer: proxy.commandArray.buffer,
          argumentBuffer: proxy.argumentArray.buffer,
          endOfPaths: proxy.endOfPaths,
          paths: results
        }],
        [proxy.commandArray.buffer, proxy.argumentArray.buffer]
      )
    }

  }
}

onmessage = function (e) {
  var fnName = e.data[0]
  var options = e.data[1]
  fns[fnName](options)
}
