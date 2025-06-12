import useCheckUser from "./customHooks/useCheckUser";
import { useEffect, useState, useContext } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import Table from "./Table";
import CommissionMonthSelector from "./CommissionMonthSelector";
import "./AuthorCommissions.scss"

function AuthorCommissions() {
  useCheckUser();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const [dataByMonths, setDataByMonths] = useState(null);
  const [activeMonth, setActiveMonth] = useState(0);
  const [payments, setPayments] = useState(null);
  const [isDemandPaymentPossible, setDemandPaymentPossible] = useState(true);

  useEffect(() => {
    const now = new Date();
    if (now.getDate() >= 25) {
      setDemandPaymentPossible(false);
    }
  }, [])

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
      // check cache first
      const cachedAuthorPayments = sessionStorage.getItem("authorPayments");
      if (cachedAuthorPayments) {
        console.log("cache hit");
        setPayments(JSON.parse(cachedAuthorPayments));
        return
      }

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
      };
    } catch(error) {
      console.log("Error when fetching the data", error);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, [])

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
        preferredFontSize={user.font_size}/>
      <div className="author-commissions-right-side">
        <Table
          data={dataByMonths}
          activeMonth={activeMonth}
          setActiveMonth={setActiveMonth}/>
        {isDemandPaymentPossible
        ? <div className="author-commissions-solicitar-pago">Solicitar Pago</div>
        : <div className="author-commissions-solicitar-pago-unavailable">Solicitar Pago</div>}
      </div>
    </div>
  )
}

export default AuthorCommissions;
