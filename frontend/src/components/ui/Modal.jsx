export default function Modal({ aoFechar, children }) {
  return (
    <div className="modal" onClick={aoFechar}>
      <div className="card" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}
