import HoloScene from './components/HoloScene'
import HandCamera from './vision/HandCamera'

function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#080512',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <HoloScene />

      <div
        style={{
          position: 'absolute',
          right: '24px',
          bottom: '24px',
          width: '280px',
          height: '210px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(168, 85, 247, 0.5)',
          background: '#000',
        }}
      >
        <HandCamera />
      </div>
    </div>
  )
}

export default App