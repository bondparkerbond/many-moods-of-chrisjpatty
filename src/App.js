import React, { Component } from 'react'
import Chart from './components/Chart'
import './App.css'
import * as d3 from 'd3'
import twts from './data/tweet_meta.json'

const dateFloor = new Date('1/1/2014')

console.log(dateFloor)

const tweets = twts
  .map(t => ({
    ...t,
    created: new Date(t.created)
  }))
  .filter(t => t.sentiment.score !== 0)
  .filter(t => !t.was_rt)
  .filter(t => t.created > dateFloor)

const colors = d3.scaleSequential(d3.interpolateMagma)
const colorDomain = d3.extent(tweets, d => d.sentiment.score)
colors.domain(colorDomain).nice()

let tweetsPerDay = {}

tweets.forEach(t => {
  const { created } = t
  const dateString = `${created.getMonth()}/${created.getDate()}/${created.getFullYear()}`
  if (tweetsPerDay[dateString] !== undefined) {
    tweetsPerDay[dateString].push(t)
  } else {
    tweetsPerDay[dateString] = [t]
  }
})
const tweetsPerDayArr = Object.entries(tweetsPerDay)
const getReducedScore = value =>
  value.reduce(
    (obj, t) => (obj.sentiment ? obj.sentiment.score : 0) + t.sentiment.score,
    0
  )

tweetsPerDay = tweetsPerDayArr.map((tArr, i) => {
  const key = tArr[0]
  const value = tArr[1]
  const computed = getReducedScore(value)
  let computedScore = computed / value.length
  return {
    created: new Date(key),
    sentiment: {
      score: computedScore
    }
  }
})

let tweetsPerMonth = {}

tweets.forEach(t => {
  const { created } = t
  const dateString = `${created.getMonth()}/1/${created.getFullYear()}`
  if (tweetsPerMonth[dateString] !== undefined) {
    tweetsPerMonth[dateString].push(t)
  } else {
    tweetsPerMonth[dateString] = [t]
  }
})

const tweetsPerMonthArr = Object.entries(tweetsPerMonth)

tweetsPerMonth = tweetsPerMonthArr
  .map((tArr, i) => {
    const key = tArr[0]
    const value = tArr[1]
    const computed = getReducedScore(value)
    let computedScore = computed / value.length
    return {
      created: new Date(key),
      sentiment: {
        score: computedScore.toFixed(4)
      }
    }
  })
  .filter(t => t.created > new Date('8/1/2014'))

const monthColors = d3.scaleSequential(d3.interpolateMagma)
const monthColorDomain = d3.extent(tweetsPerMonth, d => d.sentiment.score)
monthColorDomain[0] = monthColorDomain[0] - .2
monthColors.domain(monthColorDomain).nice()

class App extends Component {
  render() {
    return (
      <div className="App">
        <h1>
          The Many Moods of{' '}
          <a href="https://www.twitter.com/chrisjpatty">@chrisjpatty</a>
        </h1>
        <p style={{ fontStyle: 'italic' }}>
          <a href="https://en.wikipedia.org/wiki/Sentiment_analysis">
            Sentiment analysis
          </a>{' '}
          of tweets by{' '}
          <a href="https://www.twitter.com/chrisjpatty">@chrisjpatty.</a>
        </p>
        <p>
          In short, a positive score means a more positive sentiment and vice
          versa. Click on a tweet to see more details.
        </p>
        <h2>All tweets</h2>
        <Chart tweets={tweets} colors={colors} />
        <h2>Average sentiment per day</h2>
        <Chart tweets={tweetsPerDay} colors={colors} noLink />
        <h2>Average sentiment per month</h2>
        <Chart tweets={tweetsPerMonth} colors={monthColors} noLink />
        <footer>
          Made with{' '}
          <span role="img" aria-label="love">
            ❤️
          </span>{' '}
          by{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/chrisjpatty"
          >
            Chris Patty
          </a>
        </footer>
      </div>
    )
  }
}

export default App
