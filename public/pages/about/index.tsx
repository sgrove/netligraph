// @ts-ignore: it's css.
import styles from './style.module.css'
import React from 'react'

const About = (props: any) => (
  <section className={styles.about}>
    <h1>About</h1>
    <p>A page all about this website!</p>
    <pre>Props: {JSON.stringify(props)}</pre>
  </section>
)

export default About
