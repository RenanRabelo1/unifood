/**
 * Foto do produto a partir de um link. Se não houver link, ou se ele não carregar,
 * não mostra nada (em vez do ícone de imagem quebrada) e avisa por `aoFalhar`.
 * Use `key={url}` ao chamar, para tentar de novo quando o link mudar.
 */
export default function ImagemProduto({ url, alt, className, aoFalhar }) {
  if (!url) return null
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer" // alguns sites bloqueiam a foto quando vem de outro endereço
      onError={(e) => {
        e.currentTarget.style.display = 'none'
        aoFalhar?.()
      }}
    />
  )
}
