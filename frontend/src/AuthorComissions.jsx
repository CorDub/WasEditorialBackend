import useCheckUser from "./customHooks/useCheckUser";
import { useEffect, useState, useContext } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import Table from "./Table";
import CommissionMonthSelector from "./CommissionMonthSelector";
import "./AuthorCommissions.scss"
import Modal from "./Modal";
import Alert from "./Alert";

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
    }
    if (dataByMonths && activeMonth != null) {
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const currentActiveMonth = year + "-" + month
      if (currentActiveMonth === dataByMonths[activeMonth][0]) {
        setDemandPaymentPossible("currentMonth");
        return;
      }
      if (now.getDate() >= 25) {
        setDemandPaymentPossible("tooLateInTheMonth");
        return;
      }
      setDemandPaymentPossible("available");
    }
  }, [dataByMonths, activeMonth, paymentInfo, forceRender])

  async function fetchAuthorBookSales() {
    try {
      // check cache first
      const cachedAuthorMonthlySales = sessionStorage.getItem("authorMonthlySales");
      if (cachedAuthorMonthlySales && JSON.parse(cachedAuthorMonthlySales).length > 0) {
        console.log("cache hit");
        setDataByMonths(JSON.parse(cachedAuthorMonthlySales));
        return
      }

      const response = await fetch(`${baseURL}/author/monthlySales`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem("authorMonthlySales", JSON.stringify(data));
        console.log("cache storage");
        setDataByMonths(data);
      }

    } catch(error) {
      console.log("Error when fetching the data", error);
    }
  }

  useEffect(() => {
    fetchAuthorBookSales();
  }, [])

  async function fetchPayments() {
    try {
      // check cache (but skip if forceRender is true)
      const cachedAuthorPayments = sessionStorage.getItem("authorPayments");
      if (cachedAuthorPayments && !forceRender) {
        console.log("cache hit");
        setPayments(JSON.parse(cachedAuthorPayments));
        return
      }

      console.log("refetch");
      const response = await fetch(`${baseURL}/author/payments`, {
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
        setPayments(data);
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
      console.log("forceRender to true");
      setPaymentInfo(prev => ({
        ...prev,
        status: "solicited"
        }));
      console.log("solicited");
      setForceRender(true);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  return(
    <div className="author-commissions"
      style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar
        subNav={user && user.role}
        active={"comisiones"} />
      <CommissionMonthSelector
        activeMonth={activeMonth}
        setActiveMonth={setActiveMonth}
        payments={payments}
        preferredFontSize={user.font_size}
        setPaymentInfo={setPaymentInfo}/>
      <div className="author-commissions-right-side">
        <Table
          data={dataByMonths}
          activeMonth={activeMonth}
          setActiveMonth={setActiveMonth}/>
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
        {isDemandPaymentPossible === "tooLateInTheMonth" && (
          <div className="author-commissions-solicitar-pago-unavailable"
            onMouseEnter={() => setDemandPaymentTooltipPossible(true)}
            onMouseLeave={() => setDemandPaymentTooltipPossible(false)}>Solicitar Pago
            {isDemandPaymentTooltipOpen && (
              <div className="demand-payment-tooltip">Solicitar un pago es solamente posible antes del 25 del mes</div>)}
          </div>
        )}
        {isDemandPaymentPossible === "solicited" && (
          <div className="author-commissions-solicitar-pago-unavailable">Pago solicitado</div>
        )}
        {isDemandPaymentPossible === "paid" && (
          <div className="author-commissions-solicitar-pago-paid">Pagado</div>
        )}
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
