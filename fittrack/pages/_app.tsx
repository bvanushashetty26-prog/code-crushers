import React from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { AppProvider } from '@/context/AppContext'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>FitTrack – Your Fitness Companion</title>
        <meta name="description" content="Track workouts, set goals, and monitor your fitness progress with FitTrack." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppProvider>
        <Component {...pageProps} />
      </AppProvider>
    </>
  )
}
