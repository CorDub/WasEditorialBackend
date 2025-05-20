import { useState, useRef, useEffect} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { faDollarSign } from "@fortawesome/free-solid-svg-icons";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { faPersonArrowUpFromLine } from "@fortawesome/free-solid-svg-icons";
import { faPersonArrowDownToLine } from '@fortawesome/free-solid-svg-icons';
import "./TableActions.scss";
import Tooltip from "./Tooltip";

function TableActions ({
    openModal,
    row,
    isTableActionsOpen,
    setTableActionsOpen,
    setModalType,
    type}) {
  const gearRef = useRef();
  const buttonsRef = useRef();
  const [x, setX] = useState(null);
  const [y, setY] = useState(null);
  const [tooltipMessage, setTooltipMessage] = useState('');
  const [transferType, setTransferType] = useState('');
  const [isEditTooltipOpen, setEditTooltipOpen] = useState(false);
  const [isDeleteTooltipOpen, setDeleteTooltipOpen] = useState(false);
  const [isSaleTooltipOpen, setSaleTooltipOpen ] = useState(false);
  const [isSendTooltipOpen, setSendTooltipOpen ] = useState(false);
  const [isReturnTooltipOpen, setReturnTooltipOpen ] = useState(false);
  const [isGivenToAuthorTooltipOpen, setGivenToAuthorTooltipOpen ] = useState(false);
  const [isReceivedFromAuthorTooltipOpen, setReceivedFromAuthorTooltipOpen ] = useState(false);

  useEffect(() => {
    if (row.original.bookstoreId === 3) {
      setTransferType('send')
    } else {
      setTransferType('return')
    }
  }, [row])

  function displayingActions() {
    if (gearRef.current.classList.contains("displaying")) {
      gearRef.current.classList.remove("displaying");
    } else {
      gearRef.current.classList.add("displaying");
    }

    if (buttonsRef.current.classList.contains("visible")) {
      buttonsRef.current.classList.remove("visible");
      buttonsRef.current.classList.add("invisible");
      setTimeout(() => {
        buttonsRef.current.classList.add("hidden");
      }, 200)
    } else {
      buttonsRef.current.classList.remove("hidden");
      setTimeout(() => {
        buttonsRef.current.classList.add("visible");
        buttonsRef.current.classList.remove("invisible");
      }, 5)
    }
  }

  //Cleaning up state after closing a modal
  useEffect(() => {
    if (!isTableActionsOpen) {
      gearRef.current.classList.remove("displaying");
      buttonsRef.current.classList.remove("visible");
      buttonsRef.current.classList.add("hidden");
    }
  }, [isTableActionsOpen, gearRef, buttonsRef])

  function toggleTooltip(message, elementId) {
    if (x === null || y === null) {
      const element = document.getElementById(elementId);
      const elementRect = element.getBoundingClientRect();
      setY(elementRect.top);
      setX(elementRect.left);
      setTooltipMessage(message);
    } else {
      setY(null);
      setX(null);
      setTooltipMessage("");
    }
  }

  function addSale() {
    setModalType("sale");
    openModal("adding", row.original)
  }

  function transfer() {
    setModalType("transfer");
    openModal("adding", row.original)
  }

  function transferToAuthor() {
    setModalType("transferToAuthor");
    openModal("adding", row.original)
  }

  function transferFromAuthor() {
    setModalType("transferFromAuthor");
    openModal("adding", row.original);
  }

  return(
    <div className="table-actions">
      <FontAwesomeIcon icon={faGear} className="ta-gear"
        onClick={displayingActions} ref={gearRef}/>

      <div className="ta-buttons hidden" ref={buttonsRef}>
        <Tooltip message={tooltipMessage} x={x} y={y}/>
        <FontAwesomeIcon
          icon={faPen}
          className="ta-button ta-edit"
          id={`ta-edit-${row.index}`}
          onClick={() => openModal("edit", row.original)}
          onMouseEnter={() => setEditTooltipOpen(!isEditTooltipOpen)}
          onMouseLeave={() => setEditTooltipOpen(!isEditTooltipOpen)} />
        {isEditTooltipOpen && (
          <div className="ta-tooltip">Editar</div>)}
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="ta-button ta-delete"
          id={`ta-delete-${row.index}`}
          onClick={() => openModal("delete", row.original)}
          onMouseEnter={() => setDeleteTooltipOpen(!isDeleteTooltipOpen)}
          onMouseLeave={() => setDeleteTooltipOpen(!isDeleteTooltipOpen)}/>
        {isDeleteTooltipOpen && (
          <div className="ta-tooltip">Eliminar</div>)}
        {type && type === "inventory" &&
          <>
          <FontAwesomeIcon icon={faDollarSign}
            className='ta-button ta-sale'
            id={`ta-sale-${row.index}`}
            onClick={addSale}
            onMouseEnter={() => setSaleTooltipOpen(!isSaleTooltipOpen)}
            onMouseLeave={() => setSaleTooltipOpen(!isSaleTooltipOpen)}/>
          {isSaleTooltipOpen && (
            <div className="ta-tooltip">Añadir venta</div>)}
          {transferType === "send" ?
            <>
              <FontAwesomeIcon icon={faArrowUp}
                className='ta-button ta-transfer-send'
                id={`ta-transfer-${row.index}`}
                onClick={transfer}
                onMouseEnter={() => setSendTooltipOpen(!isSendTooltipOpen)}
                onMouseLeave={() => setSendTooltipOpen(!isSendTooltipOpen)}/>
              {isSendTooltipOpen && (
                <div className="ta-tooltip">Añadir entrega</div>)}
            </>
            :
            <>
              <FontAwesomeIcon icon={faArrowDown}
                className='ta-button ta-transfer-return'
                id={`ta-transfer-${row.index}`}
                onClick={transfer}
                onMouseEnter={() => setReturnTooltipOpen(!isReturnTooltipOpen)}
                onMouseLeave={() => setReturnTooltipOpen(!isReturnTooltipOpen)}/>
              {isReturnTooltipOpen && (
                <div className="ta-tooltip">Añadir devolución</div>)}
            </>
          }
          <FontAwesomeIcon icon={faPersonArrowUpFromLine}
            className='ta-button ta-givenToAuthor'
            id={`ta-transfer-${row.index}`}
            onClick={transferToAuthor}
            onMouseEnter={() => setGivenToAuthorTooltipOpen(!isGivenToAuthorTooltipOpen)}
            onMouseLeave={() => setGivenToAuthorTooltipOpen(!isGivenToAuthorTooltipOpen)}/>
          {isGivenToAuthorTooltipOpen && (
            <div className="ta-tooltip">Añadir entrega a autor</div>)}
          <FontAwesomeIcon icon={faPersonArrowDownToLine}
            className='ta-button ta-receivedFromAuthor'
            id={`ta-transfer-${row.index}`}
            onClick={transferFromAuthor}
            onMouseEnter={() => setReceivedFromAuthorTooltipOpen(!isReceivedFromAuthorTooltipOpen)}
            onMouseLeave={() => setReceivedFromAuthorTooltipOpen(!isReceivedFromAuthorTooltipOpen)}/>
          {isReceivedFromAuthorTooltipOpen && (
            <div className="ta-tooltip">Añadir entrega de autor</div>)}
          </>
        }
      </div>
    </div>
  )
}

export default TableActions;
