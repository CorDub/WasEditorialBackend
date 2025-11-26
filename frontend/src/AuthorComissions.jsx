import useCheckUser from "./customHooks/useCheckUser";
import { useEffect, useState, useContext } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
// import Table from "./Table";
import CommissionMonthSelector from "./CommissionMonthSelector";
import "./AuthorCommissions.scss"
import Modal from "./Modal";
import Alert from "./Alert";
import TableBookstores from "./TableBookstores";
import { isForMonthNextMonth } from "../../backend/utils";

function AuthorCommissions() {
  useCheckUser();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const [dataByMonths, setDataByMonths] = useState(null);
  const [activeMonth, setActiveMonth] = useState(0);
  const [payments, setPayments] = useState(null);
  const [isDemandPaymentPossible, setDemandPaymentPossible] = useState(true);
  const [isDemandPaymentTooltipOpen, setDemandPaymentTooltipPossible] = useState('available');
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("payment");
  const [modalAction, setModalAction] = useState("demand");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [salesByPayments, setSalesByPayments] = useState([]);

  // set the status of payment
  useEffect(() => {
    if (paymentInfo != null) {
      if (paymentInfo.status === "solicited") {
        setDemandPaymentPossible("solicited");
        return;
      } 
      if (paymentInfo.status === "paid") {
        setDemandPaymentPossible("paid");
        return;
      } 
      if (paymentInfo.status === "noVentas") {
        setDemandPaymentPossible("noVentas");
        return;
      } 
      if (paymentInfo.amount < 0) {
        setDemandPaymentPossible("negativeAmount");
        return;
      }
    }

    if (salesByPayments.length > 0 && Number.isInteger(activeMonth)) {
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const currentActiveMonth = year + "-" + month
      if (currentActiveMonth === salesByPayments[activeMonth].forMonth) {
        setDemandPaymentPossible("currentMonth");
        return;
      }
      if ((isForMonthNextMonth(currentActiveMonth, salesByPayments[activeMonth].forMonth)) && now.getDate() < 10) {
        setDemandPaymentPossible("tooEarlyInTheNextMonth");
        return;
      }
      setDemandPaymentPossible("available");
    }
  }, [salesByPayments, activeMonth, paymentInfo, forceRender])

  async function fetchPayments() {
    try {
      // check cache (but skip if forceRender is true)
      const cachedAuthorPayments = sessionStorage.getItem("authorPayments");
      if (cachedAuthorPayments && !forceRender) {
        console.log("cache hit");
        setPayments(JSON.parse(cachedAuthorPayments));
        setPaymentInfo(JSON.parse(cachedAuthorPayments)[0]);
        return
      }

      console.log("refetch");
      const response = await fetch(`${baseURL}/api/author/payments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem("authorPayments", JSON.stringify(data));
        console.log("cache storage");
        console.log("data", data)
        console.log("data[0]", data[0])
        setPayments(data);
        setPaymentInfo(data[0]);
        setForceRender(false);
      };
    } catch(error) {
      console.log("Error when fetching the data", error);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, [forceRender])

  function closeModal(reload, alertMessage, alertType) {
    setModalOpen(false);
    if (reload === true) {
      setPaymentInfo(prev => ({
        ...prev,
        status: "solicited"
        }));
      // setForceRender(true);
      setDemandPaymentPossible("solicited")
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  async function fetchSalesByPayments() {
    try {
      const response = await fetch(`${baseURL}/api/author/monthlySalesByPayments`, {
        method: "GET",
        headers: {
          "Content-Type":"application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const salesByPayments = await response.json();
        console.log("salesByPayments", salesByPayments);
        setSalesByPayments(salesByPayments);
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchSalesByPayments()
  }, [])

  return(
    <div className="author-commissions"
      style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar
        subNav={user && user.role}
        active={"comisiones"} />
      <div className="contain">
        <CommissionMonthSelector
          activeMonth={activeMonth}
          setActiveMonth={setActiveMonth}
          payments={payments}
          preferredFontSize={user.font_size}
          setPaymentInfo={setPaymentInfo}/>
      
        <div className="author-commissions-right-side">

          <TableBookstores
            salesByPayments={salesByPayments}
            activeMonth={activeMonth}/>
          {isDemandPaymentPossible === "available" && (
            <div className="author-commissions-solicitar-pago"
              onClick={() => setModalOpen(true)}>Solicitar Pago</div>
          )}
          {isDemandPaymentPossible === "currentMonth" && (
            null
          )}
          {isDemandPaymentPossible === "noVentas" && (
            null
          )}
          {isDemandPaymentPossible === "negativeAmount" && (
            null
          )}
          {isDemandPaymentPossible === "tooEarlyInTheNextMonth" && (
            <div className="author-commissions-solicitar-pago-unavailable"
              onMouseEnter={() => setDemandPaymentTooltipPossible(true)}
              onMouseLeave={() => setDemandPaymentTooltipPossible(false)}>Solicitar Pago
            </div>
          )}
          {isDemandPaymentPossible === "solicited" && (
            <div className="author-commissions-solicitar-pago-unavailable">Pago solicitado</div>
          )}
          {isDemandPaymentPossible === "paid" && (
            <div className="author-commissions-solicitar-pago-paid">Pagado</div>
          )}
        </div>
      </div>
      {isModalOpen && <Modal
          paymentInfo={paymentInfo}
          modalType={modalType}
          modalAction={modalAction}
          closeModal={closeModal}/>}
      <Alert
        message={alertMessage}
        type={alertType}
        setAlertMessage={setAlertMessage}
        setAlertType={setAlertType}/>
    </div>
  )
}

export default AuthorCommissions;
