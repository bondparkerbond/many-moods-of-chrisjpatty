import React from 'react'
import * as d3 from 'd3'
import _ from 'lodash'

const margin = { top: 0, right: 30, bottom: 20, left: 60 }
const curve = d3.curveCatmullRom

export default class Chart extends React.Component {
  state = {
    arcs: [],
    texts: [],
    xScale: () => 0,
    yScale: () => 0,
    hovered: null,
    width: 2000,
    height: 500
  }
  componentDidMount = () => {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight / 2
    })
  }
  xAxis = d3.axisBottom().tickSizeOuter(0)
  yAxis = d3.axisLeft().tickSizeOuter(0)

  componentDidUpdate() {
    this.xAxis.scale(this.state.xScale)
    this.yAxis.scale(this.state.yScale)

    d3.select(this.refs.xAxis).call(this.xAxis)
    d3.select(this.refs.yAxis)
      .call(this.yAxis)
      .select('.domain')
      .remove()
  }

  static getDerivedStateFromProps({tweets, colors}, state) {
    const medianBox = d3.median(tweets, d => d.sentiment.score)

    // x scale with dates
    const [minDate, maxDate] = d3.extent(tweets, d => d.created)

    const xScale = d3
      .scaleTime()
      .domain([
        d3.timeMonth.offset(minDate, -2),
        d3.timeMonth.offset(maxDate, 2)
      ])
      .range([margin.left, state.width - margin.right])

    const yExtent = d3.extent(tweets, d => d.sentiment.score - medianBox)
    const yScale = d3
      .scaleLinear()
      .domain(yExtent)
      .range([state.height - margin.bottom, margin.top])

    const areaGen = d3
      .area()
      .y0(yScale(0))
      .curve(curve)

    const arcs = _.chain(tweets)
      // put biggest arcs in the background
      .sortBy(d => -Math.abs(d.sentiment.score - medianBox))
      .map(d => {
        // for each arc, just need d & fill
        return {
          path: areaGen([
            [xScale(d3.timeMonth.offset(d.created, -1)), yScale(0)],
            [xScale(d.created), yScale(d.sentiment.score - medianBox)],
            [xScale(d3.timeMonth.offset(d.created, 1)), yScale(0)]
          ]),
          fill: colors(d.sentiment.score),
          data: d
        }
      })
      .value()

    return { arcs, xScale, yScale }
  }
  render() {
    return (
      <div style={{ display: 'inline-block', position: 'relative' }}>
        <svg width={this.state.width} height={this.state.height}>
          <g className="arcs">
            {this.state.arcs.map((d, i) => (
              <path
                d={d.path}
                fill={d.fill}
                key={i}
                opacity=".8"
                stroke="rgba(255,255,255,.3)"
                strokeWidth=".5"
                onClick={() => this.setState({ hovered: d })}
              />
            ))}
          </g>
          <g
            ref="xAxis"
            className="xAxis"
            transform={`translate(0, ${this.state.yScale(0)})`}
          />
          <g
            ref="yAxis"
            className="yAxis"
            transform={`translate(${margin.left}, 0)`}
          />
        </svg>

        <div
          style={{
            display: this.state.hovered ? 'block' : 'none',
            position: 'absolute',
            top: -30,
            right: 0,
            margin: '10px',
            padding: '10px',
            width: '240px',
            background: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          <strong>date</strong>{' '}
          {this.state.hovered &&
            d3.timeFormat('%b %d, %Y')(this.state.hovered.data.created)}
          <br />
          <strong>Sentiment</strong>{' '}
          {this.state.hovered && this.state.hovered.data.sentiment.score}
          <br />
          {
            !this.props.noLink &&
            <a
              target="_blank"
              href={`https://twitter.com/chrisjpatty/status/${this.state
                .hovered && this.state.hovered.data.id}`}
            >
              See this tweet
            </a>
          }
        </div>
      </div>
    )
  }
}
