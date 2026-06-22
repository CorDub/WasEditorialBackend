import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEye } from "@fortawesome/free-solid-svg-icons";
import "./ViewAsAuthorBanner.scss";

/**
 * Banner que se muestra cuando un admin está viendo las pantallas de un autor.
 * Indica de quién son los datos y ofrece volver a la pantalla de Pagos.
 */
function ViewAsAuthorBanner({ authorName }) {
  const navigate = useNavigate();

  return (
    <div className="vaa-banner">
      <div className="vaa-banner-info">
        <FontAwesomeIcon icon={faEye} />
        <span>
          Viendo como autor:&nbsp;
          <strong>{authorName || "autor seleccionado"}</strong>
          &nbsp;(solo lectura)
        </span>
      </div>
      <button className="vaa-banner-back" onClick={() => navigate("/admin/payments")}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Volver a Pagos
      </button>
    </div>
  );
}

export default ViewAsAuthorBanner;
