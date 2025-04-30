import useCheckUser from "./customHooks/useCheckUser";
import { useEffect, useState, useContext } from "react";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import Table from "./Table";
import CommissionMonthSelector from "./CommissionMonthSelector";

function AuthorCommissions() {
  useCheckUser();
  const { user } = useContext(UserContext);
  const [dataByMonths, setDataByMonths] = useState(null);

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
        setDataByMonths(data);
      };
    } catch(error) {
      console.log("Error when fetching the data", error);
    }
  }

  useEffect(() => {
    fetchAuthorBookSales();
  }, [])

  return(
    <div className="author-commisions">
      <Navbar subNav={user && user.role} active={"comisiones"} />
      <CommissionMonthSelector data={dataByMonths}/>
      <Table data={dataByMonths && dataByMonths}/>
    </div>
  )
}

export default AuthorCommissions;
