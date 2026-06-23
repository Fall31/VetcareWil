import { useState } from 'react'
import './ChatbotWidget.css'

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hola 👋 ¿En qué puedo ayudarte hoy?' }
  ])
  const [value, setValue] = useState('')

  const send = () => {
    if (!value.trim()) return
    const userMsg = { from: 'user', text: value }
    setMessages((m) => [...m, userMsg])
    setValue('')
    // respuesta simple de ejemplo
    setTimeout(() => {
      setMessages((m) => [...m, { from: 'bot', text: 'Gracias por tu mensaje. Para reservas usa la sección Reservas.' }])
    }, 600)
  }

  return (
    <div className={`chatbot ${open ? 'open' : ''}`}>
      <div className="chat-toggle" onClick={() => setOpen(!open)}>{open ? 'Cerrar' : 'Chat'}</div>
      <div className="chat-panel">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.from}`}>{m.text}</div>
          ))}
        </div>
        <div className="chat-controls">
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Escribe un mensaje..." />
          <button onClick={send} className="btn-primary">Enviar</button>
        </div>
      </div>
    </div>
  )
}

export default ChatbotWidget
