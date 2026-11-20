export default function Aviso({ aviso }) {
  if (!aviso) return null
  return <div className={`aviso ${aviso.tipo}`}>{aviso.msg}</div>
}
