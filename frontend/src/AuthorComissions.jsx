import useCheckUser from "./customHooks/useCheckUser";
import { useEffect, useState, useContext } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import Table from "./Table";
import CommissionMonthSelector from "./CommissionMonthSelector";
import "./AuthorCommissions.scss"

function AuthorCommissions() {
  useCheckUser();
  const { user } = useContext(UserContext);
  const [dataByMonths, setDataByMonths] = useState(null);
  const [activeMonth, setActiveMonth] = useState(0);
  const [payments, setPayments] = useState(null);

  async function fetchAuthorBookSales() {
    try {
      const response = await fetch("http://localhost:3000/author/monthlySales", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setDataByMonths(Object.entries(data));
      };
    } catch(error) {
      console.log("Error when fetching the data", error);
    }
  }

  useEffect(() => {
    fetchAuthorBookSales();
  }, [])

  async function fetchPayments() {
    try {
      const response = await fetch("http://localhost:3000/author/payments", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
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
    <div className="author-commissions">
      <Navbar
        subNav={user && user.role}
        active={"comisiones"} />
      <CommissionMonthSelector
        activeMonth={activeMonth}
        setActiveMonth={setActiveMonth}
        payments={payments}/>
      <Table
        data={dataByMonths}
        activeMonth={activeMonth}
        setActiveMonth={setActiveMonth}/>
    </div>
  )
}

export default AuthorCommissions;
