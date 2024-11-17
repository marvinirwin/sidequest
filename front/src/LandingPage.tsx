export const LandingPage = ({setStarted}: {setStarted: (started: boolean) => void}) => {
    return <button onClick={() => setStarted(true)}>Start</button>
}