import { useSearchParams } from "react-router-dom";

/**
 * Soporta el modo "ver como autor" para administradores.
 *
 * Cuando un admin entra a una pantalla de autor con ?authorId=NN&authorName=...
 * en la URL, este hook expone ese id para añadirlo a las llamadas al backend,
 * y los datos para mostrar un banner de "estás viendo como <autor>".
 *
 * Para un autor normal (sin esos parámetros) todo queda vacío y las pantallas
 * funcionan exactamente igual que antes.
 */
function useViewAsAuthor() {
  const [searchParams] = useSearchParams();
  const authorId = searchParams.get("authorId");
  const authorName = searchParams.get("authorName");

  const isViewingAsAuthor = Boolean(authorId);

  // Sufijo listo para concatenar a un endpoint.
  // - appendAuthorParam("...?foo=bar")  -> "...?foo=bar&authorId=NN"
  // - appendAuthorParam("...")          -> "...?authorId=NN"
  function appendAuthorParam(url) {
    if (!authorId) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}authorId=${authorId}`;
  }

  return { authorId, authorName, isViewingAsAuthor, appendAuthorParam };
}

export default useViewAsAuthor;
