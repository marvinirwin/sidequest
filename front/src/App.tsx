import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { PromptChain } from './PromptChain'

function App() {
  return (
    <>
    <PromptChain initialPrompt="What is your problem" validationPhrase="The user has classified their problem into body, mind or other" />
    </>
  )
}

export default App
