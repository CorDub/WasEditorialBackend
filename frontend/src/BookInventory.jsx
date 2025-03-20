import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useLocation } from 'react-router-dom';

function BookInventory() {
  useCheckAdmin()
  const location = useLocation();
  console.log(location.state);

  return(
    <div className="book-inventory">
      yes this is the book inventory for {location && location.state.name}
    </div>
  )
}

export default BookInventory;
