import { useEffect, useState } from "react";
import "./GivenToAuthorDetails.scss";

function GivenToAuthorDetails() {
  const [data, setData] = useState([]);

  async function fetchRelevantTransfers() {
    try {
      const response = await fetch("http://localhost:3000/author/givenToAuthorTransfers", {
        method: "GET",
        headers: {
          "Content-Type": 'application/json',
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setData(data);
      };
    } catch (error) {
      console.error("Error when fetching the relevantTransfers", error);
    }
  }

  useEffect(() => {
    fetchRelevantTransfers();
  }, [])

  useEffect(() => {
    console.log(data);
  }, [data])

  return(
    <div className="given-to-author-details">
      <div>Yes delivered to author</div>
    </div>
  )
}

export default GivenToAuthorDetails;
